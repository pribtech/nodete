import { Template } from './Template.js';
import { JsListEncoder } from './JsListEncoder.js';
import { JsConstants } from './JsConstants.js';
import { MenuBuilder } from '../definitions/MenuBuilder.js';
import { Escape } from '../util/Escape.js';

const TOUCH_DETECTION = "('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) ||(navigator.userAgent.match(/iPad/i) != null)";
const OLD_IOS_SAFARI = /Mozilla\/[^ ]+ \((iPhone|iPodi|iPad); U; CPU [^;]+ Mac OS X; [^)]+\) AppleWebKit\/[^ ]+ \(KHTML, like Gecko\) Version\/[^ ]+ Mobile\/[^ ]+ Safari\/[^ ]+/;
const CONFIRM_LEAVE = `
window.onbeforeunload = function confirmLeaveVIAbrowserNavigation() {
	return "All open pages within the Technology Explorer will be lost if you leave the page.";
};
`;

/**
 * The console's start page (PHP index.php): loads the front-end scripts, the
 * settings as JS globals, and the home and core page layouts.
 */
export class IndexPage {
	#router;

	constructor({ router }) {
		this.#router = router;
	}

	async handle(req, res) {
		const context = this.#router.createContext(req, res);
		res.set('Cache-Control', 'private').type('text/html; charset=UTF-8').send(this.render(context));
	}

	render(context) {
		const { config, files, request, session, connections } = context;
		const touchOverride = this.#touchOverride(request);
		const isTouch = touchOverride ?? /(iPhone|iPod|iPad)/i.test(request.userAgent);
		const layouts = MenuBuilder.forContext(context);
		const preferences = config.get('USER_PREFERENCES_DIRECTORY');
		const languageFolder = `${config.get('PHP_INCLUDE_BASE_DIRECTORY')}${config.get('BASE_LANGUAGE_DIRECTORY')}${config.get('TE_LANGUAGE')}`;

		return Template.load('index.html').render({
			touchDetection: touchOverride === null ? TOUCH_DETECTION : String(touchOverride),
			cssFile: config.get('CSS_BASE_FILE'),
			titleAndScripts: `<title>${connections.titleString()}</title>\n\n${new JsListEncoder({ files, config }).encode(session.language)}`,
			jsConstants: new JsConstants(config).script(),
			dimensionLoads: this.#dimensionLoads(config, files),
			jsBaseDirectory: config.get('JS_BASE_DIRECTORY'),
			homePageLayout: Escape.inlineJson(this.#homePageLayout(layouts, files, config, preferences, isTouch)),
			coreLayout: Escape.inlineJson(layouts.pageWindowFromFile(`${preferences}default/${isTouch ? 'TE_TOUCH_LAYOUT.json' : 'TE_CORE_LAYOUT.json'}`)),
			ieWarningPage: `${languageFolder}/index_IE_warning.html`,
			confirmLeave: config.get('ENABLE_CONFIRM_LEAVE_VIA_BROWSER_NAVIGATION') ? CONFIRM_LEAVE : '',
			iosError: OLD_IOS_SAFARI.test(request.userAgent) ? (files.tryReadText(`${languageFolder}/index_error.html`) ?? '') : '',
		});
	}

	/** true/false from ?TOUCH_OVERRIDE=, or null when absent. Anything else is ignored. */
	#touchOverride(request) {
		const value = String(request.getParameter('TOUCH_OVERRIDE', '')).toLowerCase();
		return value === 'true' ? true : value === 'false' ? false : null;
	}

	/** Preloads every table-definition dimension in the browser. */
	#dimensionLoads(config, files) {
		const folder = `${config.get('TABLE_DEFINITION_DIRECTORY')}dimensions`;
		return files.listMatching(folder, /^.*\.xml$/i)
			.map((file) => `getDOMParsed ("tableDefinitions/dimensions/${file}",null,checkDimensionLoad,"${file}");`)
			.join('');
	}

	/** The user's custom home page if present, else the default one. */
	#homePageLayout(layouts, files, config, preferences, isTouch) {
		const layout = config.get(isTouch ? 'CUSTOM_TE_TOUCH_HOME_PAGE_LAYOUT' : 'CUSTOM_TE_HOME_PAGE_LAYOUT');
		if (files.isFile(`${preferences}${config.get('CUSTOM_TE_HOME_PAGE_LAYOUT')}`) && files.isFile(`${preferences}${layout}`))
			return layouts.pageWindowFromFile(`${preferences}${layout}`);
		if (files.isFile(`${preferences}default/${layout}`))
			return layouts.pageWindowFromFile(`${preferences}default/${layout}`);
		return null;
	}
}
