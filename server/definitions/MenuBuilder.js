import path from 'node:path';
import { PageBuilder } from './PageBuilder.js';
import { Requirements } from './Requirements.js';
import { ScriptDefinition } from './ScriptDefinition.js';
import { PhpCompat } from '../util/PhpCompat.js';

const SQL_PREFIXES = ['select ', 'xquery ', 'values(', 'values ', 'with '];
const MENU_FILE = /^menu_.*\.json$/i;

/**
 * Builds menus from their JSON definitions (menu_*.json) into the form the front end
 * renders. One instance per request: it carries the request's link defaults and the
 * location of the menu file being loaded.
 *
 * A menu definition is {"type": "leaf" | "branch" | "embeddedBranch" | "table" | "line", ...};
 * see README "Definition files" for the fields.
 */
export class MenuBuilder {
	#files;
	#connections;
	#log;
	#pages;

	constructor({ files, config, connections, log = console }) {
		this.#files = files;
		this.#connections = connections;
		this.#log = log;
		this.#pages = new PageBuilder({ config, buildMenu: (definition) => this.node(definition, null, null, null, null) });
	}

	/** Link and layout builder sharing this request's defaults. */
	get pages() { return this.#pages; }

	set defaultTarget(value) { this.#pages.defaultTarget = value; }
	set defaultWindow(value) { this.#pages.defaultWindow = value; }
	set defaultStage(value) { this.#pages.defaultStage = value; }
	get defaultStage() { return this.#pages.defaultStage; }

	/** A TE script definition in front-end form; loadPage tasks get their links and layouts built. */
	script(definition) {
		return ScriptDefinition.expand(definition, (task) => ({
			type: 'loadPage',
			links: (task.links ?? []).map((link) => this.#pages.link(link)),
			pageLayouts: (task.pageLayouts ?? []).map((window) => this.#pages.pageWindow(window)),
		}));
	}

	/** Parsed definition file, undefined when missing, null when not valid JSON. */
	readDefinition(file) {
		const text = this.#files.tryReadText(file);
		if (text === null) return undefined;
		try { return JSON.parse(text); } catch { return null; }
	}

	pageWindowFromFile(file) {
		const definition = this.readDefinition(file);
		if (!definition) { this.#log.warn(`MenuBuilder layout not readable: ${file}`); return null; }
		return this.#pages.pageWindow(definition);
	}

	// ---- files and folders ---------------------------------------------------------

	loadFile(filename, menuLocation, rootNode, filterList) {
		const location = `${rootNode}/${menuLocation}`;
		this.#pages.setVariable('CURRENT_MENU_LOCATION', location);
		const definition = this.readDefinition(`${location}/${filename}`);
		if (definition === undefined) return this.menuError(`loadFile fail as not found, file: ${location}/${filename}`, rootNode, null, menuLocation);
		if (definition === null) return this.menuError(`menu file is not valid JSON: ${location}/${filename}`, rootNode, null, menuLocation);
		return this.node(definition, menuLocation, rootNode, filterList, filename);
	}

	/** Every menu_*.json in a folder, in name order; "" when the folder does not exist. */
	folder(menuLocation, rootNode, filterList) {
		const folder = `${rootNode}/${menuLocation}`;
		if (!this.#files.isDirectory(folder)) return '';
		return this.#files.listMatching(folder, MENU_FILE).map((file) => this.loadFile(file, menuLocation, rootNode, filterList));
	}

	// ---- messages and errors -------------------------------------------------------

	#message(text) { return this.node({ type: 'leaf', description: text }, null, null, null, null); }

	menuMessage(message) { return [this.#message(message)]; }

	menuError(message, rootNode, onErrorMenu, menuLocation) {
		this.#log.warn(`MenuBuilder root node: ${rootNode} menu location: ${menuLocation} error: ${message}`);
		if (!onErrorMenu) return [this.#message(message)];
		const file = `${rootNode}${menuLocation}/${onErrorMenu}.json`;
		const definition = this.readDefinition(file);
		return [definition ? this.node(definition, menuLocation, rootNode, null, file) : this.#message(`error menu not found : ${file}`)];
	}

	// ---- database and inline branches ----------------------------------------------

	sqlBranch(branch, rootNode, menuLocation) {
		const source = branch.branchSQLXML;
		const lower = source.toLowerCase();
		const isSQL = SQL_PREFIXES.some((prefix) => lower.startsWith(prefix)) || source.startsWith('(');
		if (!isSQL && !this.#files.isFile(`${source}.sql`) && !this.#files.isFile(source))
			return this.menuError(`branchSQLXML "${source}" not found`, rootNode, branch.onErrorMenu, menuLocation);
		if (!this.#connections.isConnected()) return this.menuMessage('No connection found');
		return this.menuError('Database menus are not available yet in the Node.js server', rootNode, branch.onErrorMenu, menuLocation);
	}

	/** branchXML is an inline menu definition (JSON text), optionally transformed by branchXSL. */
	xmlBranch(branch, rootNode, filterList, menuLocation) {
		if (!branch.branchXML) return this.menuError('nil', rootNode, branch.onErrorMenu, menuLocation);
		if (branch.branchXSL)
			return this.menuError('XSL menu transforms are not available yet in the Node.js server', rootNode, branch.onErrorMenu, menuLocation);
		let definition;
		try { definition = JSON.parse(branch.branchXML); } catch { definition = null; }
		const menu = definition ? this.node(definition, menuLocation, rootNode, filterList, null) : {};
		return branch.dropParent === 'true' ? menu : [menu];
	}

	// ---- menu nodes ------------------------------------------------------------------

	node(definition, menuLocation, rootNode, filterList, currentFile) {
		if (!definition) return null;
		let nodeType = (definition.type ?? 'leaf').toUpperCase();
		const delayLoad = definition.delayLoad ?? 'false';
		const reloadOnConnectionChange = definition.reloadOnConnectionChange === true;
		const replacement = definition.replacement === true;
		const branch = MenuBuilder.branchOf(definition);
		const tag = definition.tag ?? '';

		if (!(tag === '' && nodeType === 'BRANCH') && filterList)
			for (const filter of filterList) if (!new RegExp(filter).test(tag)) return null;

		const description = definition.description ?? 'none';
		const filter = Object.hasOwn(definition, 'filter') ? definition.filter : null;
		if (filter !== null) filterList = filterList ? [...filterList, filter] : [filter];

		let elementAction = null, subNodes = null, rootCallBack = null, localFilterList = null;
		let actionJSON = null, linkList = null, pageWindow = null, floatingPanel = null;
		const extra = {};

		switch (nodeType) {
			case 'BRANCH':
				if (delayLoad === 'true' && currentFile !== null) {
					nodeType = 'DELAYLOADBRANCH';
					rootCallBack = `${rootNode}/${menuLocation}/${currentFile}`.replace(/[\\/]+/g, '/');
					localFilterList = filterList ?? null;
				} else if (delayLoad !== 'false' && (branch.branchSQLXML !== '' || branch.branchXML !== '')) {
					nodeType = 'DELAYLOADBRANCH';
					rootCallBack = JSON.stringify({ reloadOnConnectionChange, delayLoad, ...branch, replacement, filter, menulocation: menuLocation });
					localFilterList = filterList ?? null;
				} else {
					if (branch.rootDirectory !== '') subNodes = this.folder(menuLocation, branch.rootDirectory, filterList);
					else if (branch.branchDirectory !== '') subNodes = this.folder(`${menuLocation}/${branch.branchDirectory}`, rootNode, filterList);
					else if (branch.branchSQLXML !== '') { nodeType = 'SQL_BRANCH'; subNodes = this.sqlBranch(branch, rootNode, menuLocation); }
					else if (branch.branchXML !== '') { nodeType = 'XML_BRANCH'; subNodes = this.xmlBranch(branch, rootNode, filterList, menuLocation); }
					if (PhpCompat.isEmpty(subNodes)) return null;
				}
				break;
			case 'LEAF':
				if (Object.hasOwn(definition, 'actionScript')) actionJSON = this.script(definition.actionScript);
				else if (definition.tutorial) pageWindow = this.#tutorialWindow(definition.tutorial);
				elementAction = definition.JSAction ?? null;
				floatingPanel = this.#pages.floatingPanel(definition.floatingPanel);
				linkList = (definition.links ?? []).map((link) => this.#pages.link(link));
				pageWindow ??= (definition.pageWindows ?? []).map((window) => this.#pages.pageWindow(window));
				break;
			case 'EMBEDDEDBRANCH':
				nodeType = 'BRANCH';
				subNodes = (definition.menus ?? []).map((menu) => this.node(menu, menuLocation, rootNode, filterList, null));
				break;
			case 'TABLE':
				extra.table = definition.table ?? '';
				extra.parameters = PhpCompat.assoc(definition.parameters ?? {});
				break;
			case 'LINE':
				break;
			default:
				return this.menuError(`Encode menu node failed as type: "${nodeType}" not known`, rootNode, null, menuLocation);
		}

		return {
			...Requirements.expand(definition.requires),
			...extra,
			nodeType, delayLoad, GUID: definition.GUID ?? '', reloadOnConnectionChange, replacement, tag,
			elementID: definition.menuGUID ?? null,
			elementValue: description,
			elementActionScript: actionJSON,
			elementFloatingLink: floatingPanel,
			elementLinkList: linkList,
			elementPageWindows: pageWindow,
			elementAction,
			elementSubNodes: subNodes,
			rootCallBack,
			filterList: localFilterList,
			elementSubNodeDirection: null,
		};
	}

	/** The eight branch settings, "" when not given. */
	static branchOf(definition) {
		const names = ['rootDirectory', 'branchDirectory', 'branchSQLXML', 'branchSQLPredicate', 'branchXML', 'branchXSL', 'onErrorMenu', 'dropParent'];
		return Object.fromEntries(names.map((name) => [name, definition[name] ?? '']));
	}

	/**
	 * A tutorial leaf opens the tutorial action. Its script is inline (still XML until
	 * tutorials are converted) or read from a source file; a source that is not a file
	 * is passed on as the tutorial's menu location.
	 */
	#tutorialWindow({ name, source, xml }) {
		const parameters = { action: 'tutorial', tutorialName: String(name).trim() };
		if (!source) parameters.script = xml.trim();
		else if (this.#files.isFile(source)) parameters.script = this.#files.readText(source).replace(/\r\n?/g, '\n').trim(); // line endings as an XML parser reports them
		else parameters.CurrentMenuLocation = source.trim();
		return this.#pages.pageWindow({
			target: '_final',
			content: {
				type: 'panel', name: 'Tutorial', primaryContainer: true,
				content: { link: { type: 'action', target: '_self', window: '_self', parameters } },
			},
		});
	}

	/** Directory part of a menu callback path relative to the menu root. */
	static menuLocationOf(callbackPath, menuRoot) {
		return path.posix.dirname(callbackPath).slice(menuRoot.length);
	}
}
