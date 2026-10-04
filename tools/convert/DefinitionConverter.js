import { XmlNode } from '../../server/xml/XmlNode.js';
import { PhpCompat } from '../../server/util/PhpCompat.js';
import { ActionEncoder } from './ActionEncoder.js';
import { GraphEncoder } from './GraphEncoder.js';
import { VersionAttributes } from './VersionAttributes.js';
import { ScriptDefinition } from '../../server/definitions/ScriptDefinition.js';

/** Names a <parameter value="..."> may refer to that are resolved per request. */
const REQUEST_VARIABLES = new Set(['CURRENT_MENU_LOCATION', 'CURRENT_DIRECTORY', 'CURRENT_TUTORIAL']);
const MENU_TYPES = { leaf: 'leaf', branch: 'branch', embeddedbranch: 'embeddedBranch', table: 'table', line: 'line' };
const BRANCH_ATTRIBUTES = ['rootDirectory', 'branchDirectory', 'branchSQLXML', 'branchSQLPredicate', 'branchXML', 'branchXSL', 'onErrorMenu', 'dropParent'];
const VERSION_DEFAULTS = Object.freeze(VersionAttributes.encode(XmlNode.parse('<x/>')));

const isTrue = (value) => String(value ?? '').toLowerCase() === 'true';
/** Copies value into target[key] unless it equals the default the loader would use anyway. */
const setUnlessDefault = (target, key, value, defaultValue = '') => { if (value !== defaultValue && value !== undefined) target[key] = value; };

/**
 * Converts the TE's XML definitions (menus, page layouts, links, TE scripts, script lists)
 * into the JSON definition format read by server/definitions. Mirrors exactly what the
 * XML encoders read, so the front end receives the same JSON as before.
 *
 * Elements and attributes the encoders never read are dropped; each one is recorded in
 * `report` so nothing disappears unnoticed.
 */
export class DefinitionConverter {
	#scripts;
	report = new Map();

	constructor({ messages, acceptedOperators }) {
		this.#scripts = new ActionEncoder({ menus: this.#loadPageAdapter(), messages, acceptedOperators });
	}

	#note(kind, name) { const key = `${kind} ${name}`; this.report.set(key, (this.report.get(key) ?? 0) + 1); }

	/** Records attributes and child elements of node that the encoders ignore. */
	#unread(node, attributes, children = []) {
		const attrs = new Set(attributes);
		for (const name of Object.keys(node.attributes)) if (!attrs.has(name)) this.#note(`ignored attribute <${node.nodeName}>`, name);
		const kids = new Set(children.map((c) => c.toLowerCase()));
		for (const child of node.childNodes) if (!kids.has(child.nodeName.toLowerCase())) this.#note(`ignored element <${node.nodeName}>`, `<${child.nodeName}>`);
	}

	// ---- menus -------------------------------------------------------------------

	menu(node) {
		if (!node.isNamed('menu')) throw new Error(`Menu file root is <${node.nodeName}>, expected <menu>`);
		return this.menuNode(node);
	}

	menuNode(node) {
		const result = {};
		const rawType = node.getAttribute('type', 'leaf');
		const type = MENU_TYPES[rawType.toLowerCase()] ?? rawType;
		setUnlessDefault(result, 'type', type, 'leaf');
		const description = node.getChildTextContent('description', 'none');
		setUnlessDefault(result, 'description', description, 'none');
		const requires = this.#requires(node);
		if (requires) result.requires = requires;

		const delayLoad = node.getAttribute('delayLoad');
		if (delayLoad !== '') result.delayLoad = delayLoad.toLowerCase();
		if (isTrue(node.getAttribute('reloadOnConnectionChange', 'false'))) result.reloadOnConnectionChange = true;
		if (isTrue(node.getAttribute('replacement', 'false'))) result.replacement = true;
		for (const name of BRANCH_ATTRIBUTES) setUnlessDefault(result, name, node.getAttribute(name).trim());
		setUnlessDefault(result, 'GUID', node.getAttribute('GUID').trim());
		setUnlessDefault(result, 'tag', node.getAttribute('tag'));
		const filter = node.getChildTextContent('filter', null);
		if (filter !== null) result.filter = filter;
		const menuGUID = node.getChildTextContent('menuGUID', null);
		if (menuGUID !== null) result.menuGUID = menuGUID;

		const children = ['description', 'filter', 'menuGUID'];
		switch (type) {
			case 'leaf': this.#leaf(node, result, description); children.push('actionScript', 'tutorial', 'JSAction', 'floatingPanel', 'linkList', 'pageWindow'); break;
			case 'embeddedBranch': result.menus = node.childNodes.filter((c) => c.isNamed('menu')).map((c) => this.menuNode(c)); children.push('menu'); break;
			case 'table': this.#table(node, result); children.push('parameter'); break;
			default: break;
		}
		this.#unread(node, ['type', 'delayLoad', 'reloadOnConnectionChange', 'replacement', 'GUID', 'tag', 'table',
			...BRANCH_ATTRIBUTES, ...Object.keys(VERSION_DEFAULTS)], children);
		return result;
	}

	#requires(node) {
		const version = VersionAttributes.encode(node);
		const requires = {};
		for (const [key, value] of Object.entries(version)) if (value !== VERSION_DEFAULTS[key]) requires[key] = value;
		return Object.keys(requires).length ? requires : null;
	}

	#leaf(node, result, description) {
		const actionNode = node.findChildNode('actionScript');
		if (actionNode) result.actionScript = ScriptDefinition.compact(this.#scripts.fromDOM(actionNode));
		else {
			const tutorial = node.findChildNode('tutorial');
			if (tutorial) result.tutorial = this.#tutorial(tutorial, description);
		}
		const jsAction = node.getChildTextContent('JSAction', null);
		if (jsAction !== null) result.JSAction = jsAction;
		const floating = node.findChildNode('floatingPanel');
		if (floating) result.floatingPanel = this.#floatingPanel(floating);
		const links = this.links(node);
		if (links.length) result.links = links;
		const windows = this.pageWindows(node);
		if (windows.length) result.pageWindows = windows;
	}

	/** Inline tutorials stay XML until tutorials are converted; the menu just carries them. */
	#tutorial(node, description) {
		const name = node.getAttribute('name') || description.replace(/\s(.?)/g, (_, c) => c.toUpperCase());
		const source = node.getAttribute('source');
		return source ? { name, source } : { name, xml: node.toXML() };
	}

	#table(node, result) {
		result.table = node.getAttribute('table').trim();
		const parameters = {};
		for (const p of node.childNodes.filter((c) => c.isNamed('parameter'))) {
			const valueNode = p.childNodes.filter((v) => v.isNamed('value')).at(-1);
			parameters[p.getAttribute('name')] = valueNode ? valueNode.textContent.trim() : p.getAttribute('value');
		}
		result.parameters = parameters;
	}

	#floatingPanel(node) {
		const result = {};
		const content = this.#panelContent(node.childNodes);
		if (content) result.content = content;
		if (isTrue(node.getAttribute('hideMenuBar', 'false'))) result.hideMenuBar = true;
		if (isTrue(node.getAttribute('reloadOnConnectionChange', 'false'))) result.reloadOnConnectionChange = true;
		const headers = this.panelHeaders(node.findChildNode('panelHeaders'));
		if (headers) result.panelHeaders = headers;
		for (const name of ['baseWidth', 'baseHeight']) if (node.hasAttribute(name)) result[name] = node.getAttribute(name);
		if (isTrue(node.getAttribute('loadContentOnShow', 'false'))) result.loadContentOnShow = true;
		if (isTrue(node.getAttribute('reloadContentOnShow', 'false'))) result.reloadContentOnShow = true;
		return result;
	}

	// ---- links -------------------------------------------------------------------

	/** Links of every <linkList> child, in order (non-link entries stay as null, as before). */
	links(node) {
		return node.getElementsByTagName('linkList').flatMap((list) => list.childNodes.map((link) => this.link(link)));
	}

	link(node) {
		if (!node.isNamed('link')) return null;
		const result = {};
		const type = node.getAttribute('type');
		setUnlessDefault(result, 'type', type);
		for (const name of ['target', 'window', 'windowStage']) setUnlessDefault(result, name, node.getAttribute(name));
		const forms = node.getElementsByTagName('formList').flatMap((list) => list.childNodes.map((f) => f.getAttribute('name')));
		if (forms.length) result.forms = forms;
		const upper = type.toUpperCase();
		if (upper === 'RAW') result.raw = node.getChildTextContent('RAW', '');
		else if (upper === 'URL') result.url = node.getChildTextContent('URL', '');
		else if (!node.hasChildNodes()) result.text = node.textContent.trim();
		else {
			let address = null;
			const parameters = {};
			for (const child of node.childNodes) {
				const name = child.nodeName.toLowerCase();
				if (name === 'address') address = child.textContent.trim();
				else if (name === 'parameterlist') for (const p of child.childNodes) this.#parameter(p, parameters);
			}
			if (address !== null) result.address = address;
			if (Object.keys(parameters).length) result.parameters = parameters;
		}
		this.#unread(node, ['type', 'target', 'window', 'windowStage'], ['RAW', 'URL', 'address', 'parameterList', 'formList']);
		return result;
	}

	/** One link parameter: a literal value, or a $-directive resolved per request. */
	#parameter(node, parameters) {
		let name = node.getAttribute('name');
		const attributeValue = node.getAttribute('value');
		let value;
		let set = false;
		if (attributeValue !== '') {
			if (REQUEST_VARIABLES.has(attributeValue)) {
				// unset variables fell back to the element text, so keep it (children still win below)
				const fallback = node.hasChildNodes() ? '' : node.textContent.trim();
				value = fallback === '' ? { $var: attributeValue } : { $var: attributeValue, default: fallback };
				set = true;
			}
			else if (this.configNames?.has(attributeValue)) { value = { $config: attributeValue }; set = true; }
		}
		if (node.hasChildNodes()) {
			const sub = node.childNodes[0];
			set = true;
			switch (sub.nodeName.toLowerCase()) {
				case 'link': value = { $link: this.link(sub) }; break;
				case 'graph': value = GraphEncoder.encode(sub); break;
				case 'pagewindow': value = { $pageWindow: this.pageWindow(sub) }; break;
				case 'keycolumn': name = ''; this.#note('dropped', 'keyColumn parameter (only used with table row data)'); break;
				case 'value': value = sub.hasChildNodes() ? node.arrayEncodeXML() : node.textContent.trim(); break;
				default: value = node.arrayEncodeXML(); break;
			}
		}
		if (!set) value = node.textContent.trim();
		if (name !== '') parameters[name] = value;
	}

	// ---- page layouts --------------------------------------------------------------

	pageWindows(node) {
		return node.getElementsByTagName('pageWindow').filter((w) => w.hasChildNodes()).map((w) => this.pageWindow(w));
	}

	pageWindow(node) {
		if (!node?.hasChildNodes()) return null;
		const result = {};
		setUnlessDefault(result, 'target', node.getAttribute('target'));
		setUnlessDefault(result, 'title', node.getChildTextContent('title'));
		setUnlessDefault(result, 'info', node.getChildTextContent('info'));
		const leftMenu = node.findChildNode('leftMenu');
		if (leftMenu) result.leftMenu = this.menuNode(leftMenu);
		if (node.getAttribute('raiseToTop') === 'false') result.raiseToTop = false;
		setUnlessDefault(result, 'windowStage', node.getAttribute('windowStage'));
		if (node.hasAttribute('windowType') && node.getAttribute('windowType') !== 'NORMAL') result.windowType = node.getAttribute('windowType');
		setUnlessDefault(result, 'windowOptionType', node.getAttribute('windowOptionType'));
		if (isTrue(node.getAttribute('reloadOnConnectionChange', 'false'))) result.reloadOnConnectionChange = true;
		const headers = this.panelHeaders(node.findChildNode('panelHeaders'));
		if (headers) result.panelHeaders = headers;
		result.content = this.container(node);
		this.#unread(node, ['target', 'raiseToTop', 'windowStage', 'windowType', 'windowOptionType', 'reloadOnConnectionChange'],
			['title', 'info', 'leftMenu', 'panelHeaders', 'panel', 'splitPane', 'stage']);
		return result;
	}

	panelHeaders(node) {
		if (!node) return null;
		const result = {};
		setUnlessDefault(result, 'scope', node.getAttribute('scope'));
		if (node.getAttribute('refreshEnabled') === 'false') result.refreshEnabled = false;
		setUnlessDefault(result, 'refreshOptions', node.getAttribute('refreshOptions'));
		const auto = node.findChildNode('autoRefreshControls');
		if (auto) {
			const controls = {};
			const time = auto.getChildTextContent('time', null);
			if (time !== null) controls.time = time;
			if (auto.getChildTextContent('timeVisible') === 'false') controls.timeVisible = false;
			const options = auto.getChildTextContent('timeOptions', null);
			if (options !== null) { try { controls.timeOptions = JSON.parse(options); } catch { controls.timeOptions = null; } }
			if (auto.getChildTextContent('countdownVisible') === 'true') controls.countdownVisible = true;
			result.autoRefreshControls = controls;
		}
		if (node.getAttribute('showRefreshControl') === 'false') result.showRefreshControl = false;
		return result;
	}

	#panelContent(nodes) {
		for (const node of nodes) {
			if (node.isNamed('link')) return { link: this.link(node) };
			if (node.isNamed('raw')) return { raw: node.textContent.trim() };
			if (node.isNamed('url')) return { url: node.textContent.trim() };
		}
		return { raw: '' };
	}

	/** First panel, splitPane or stage child, or null. */
	container(node) {
		for (const child of node.childNodes) {
			switch (child.nodeName.toLowerCase()) {
				case 'panel': return this.#panel(child);
				case 'splitpane': return this.#splitPane(child);
				case 'stage': return this.#stage(child);
				default: break;
			}
		}
		return null;
	}

	#panel(node) {
		const result = { type: 'panel' };
		setUnlessDefault(result, 'name', node.getAttribute('name'));
		if (node.hasChildNodes()) result.content = this.#panelContent(node.childNodes);
		if (isTrue(node.getAttribute('reloadOnConnectionChange', 'false'))) result.reloadOnConnectionChange = true;
		const headers = this.panelHeaders(node.findChildNode('panelHeaders'));
		if (headers) result.panelHeaders = headers;
		setUnlessDefault(result, 'overflow', node.getAttribute('overflow'));
		if (node.getAttribute('delayLoad') === 'true') result.delayLoad = true;
		setUnlessDefault(result, 'panelTitle', node.getAttribute('panelTitle'));
		if (node.getAttribute('PrimaryContainer') === 'true') result.primaryContainer = true;
		this.#unread(node, ['name', 'reloadOnConnectionChange', 'overflow', 'delayLoad', 'panelTitle', 'PrimaryContainer'], ['link', 'raw', 'url', 'panelHeaders']);
		return result;
	}

	#splitPane(node) {
		const result = { type: 'splitPane' };
		if (node.getAttribute('direction').toLowerCase().startsWith('v')) result.direction = 'v';
		setUnlessDefault(result, 'splitPercent', node.getAttribute('splitPercent'));
		if (node.getAttribute('allowResize') === 'false') result.allowResize = false;
		if (node.getAttribute('maxSize') !== '') result.maxSize = PhpCompat.intval(node.getAttribute('maxSize'));
		if (node.hasAttribute('showSplitSpacer')) {
			result.showSplitSpacer = isTrue(node.getAttribute('showSplitSpacer'));
			result.splitSpacerWidth = PhpCompat.intval(node.getAttribute('splitSpacerWidth', 3));
		}
		setUnlessDefault(result, 'styleOverride', node.getAttribute('styleOverride', ''));
		for (const pane of node.childNodes) {
			const name = pane.nodeName.toLowerCase();
			if (['toppane', 'leftpane', 'panela'].includes(name)) result.panelA = this.container(pane);
			else if (['bottompane', 'rightpane', 'panelb'].includes(name)) result.panelB = this.container(pane);
		}
		this.#unread(node, ['direction', 'splitPercent', 'allowResize', 'maxSize', 'showSplitSpacer', 'splitSpacerWidth', 'styleOverride'],
			['topPane', 'leftPane', 'panelA', 'bottomPane', 'rightPane', 'panelB']);
		return result;
	}

	#stage(node) {
		const result = { type: 'stage' };
		for (const name of ['name', 'HasMenuBarContainer', 'titleBarType', 'windowOptionType', 'windowControlTypes', 'sizable'])
			setUnlessDefault(result, name, node.getAttribute(name));
		for (const name of ['top', 'botton', 'left', 'right']) setUnlessDefault(result, name, PhpCompat.intval(node.getAttribute(name)), 0);
		return result;
	}

	// ---- TE scripts and lists ----------------------------------------------------------

	/** A TE script in the JSON the front end runs; loadPage tasks keep links/layouts in definition form. */
	script(node) { return ScriptDefinition.compact(this.#scripts.fromDOM(node)); }

	/** loadPage tasks need per-request link defaults, so they are stored unresolved. */
	#loadPageAdapter() {
		return {
			retrieveLinksFromDOM: (node) => this.links(node),
			encodePageWindowsFromDOM: (node) => this.pageWindows(node),
		};
	}

	actionList(node) {
		if (!node.isNamed('AutoLoadActionList')) throw new Error(`Action list root is <${node.nodeName}>`);
		const entries = [];
		for (const child of node.childNodes) {
			if (child.isNamed('action')) entries.push({ action: child.getAttribute('name'), file: child.getAttribute('file').replace(/\.xml$/i, '.json') });
			else if (child.isNamed('directory')) entries.push({ directory: child.textContent.trim() });
			else this.#note('ignored element <AutoLoadActionList>', `<${child.nodeName}>`);
		}
		return { entries };
	}

	jsList(node) {
		if (!node.isNamed('jsFileList')) throw new Error(`Script list root is <${node.nodeName}>`);
		return { entries: this.#jsEntries(node) };
	}

	#jsEntries(node) {
		const entries = [];
		for (const entry of node.childNodes) {
			const min = entry.getAttribute('min-name', null);
			switch (entry.nodeName.toLowerCase()) {
				case 'file': entries.push({ file: entry.getAttribute('name') || entry.textContent.trim(), ...(min ? { min } : {}) }); break;
				case 'group': entries.push({ group: entry.getAttribute('name', null), ...(min ? { min } : {}), entries: this.#jsEntries(entry) }); break;
				case 'directory': { const folder = entry.getAttribute('name') || entry.textContent.trim(); if (folder) entries.push({ directory: folder }); break; }
				case 'action': entries.push({ action: entry.getAttribute('name') }); break;
				default: this.#note('ignored element <jsFileList>', `<${entry.nodeName}>`); break;
			}
		}
		return entries;
	}
}
