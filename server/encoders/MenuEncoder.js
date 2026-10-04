import path from 'node:path';
import { XmlNode } from '../xml/XmlNode.js';
import { ActionEncoder } from './ActionEncoder.js';
import { GraphEncoder } from './GraphEncoder.js';
import { VersionAttributes } from './VersionAttributes.js';
import { PhpCompat } from '../util/PhpCompat.js';
import { Escape } from '../util/Escape.js';

const NO_CONTENT_PANEL = "<div id='title'>No content given!</div><table style='width:100%;height:100%'><tr><td align='center'><h2>No content was specified for the panel</h2></td></tr></table>'";
const SQL_PREFIXES = ['select ', 'xquery ', 'values(', 'values ', 'with '];
const lowerEquals = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const isTrue = (value) => String(value ?? '').toLowerCase() === 'true';
/** PHP `$v == "" ? fallback : $v` (unlike ||, keeps "0"). */
const orIfEmpty = (value, fallback) => (value === '' || value === null ? fallback : value);

/**
 * Turns the TE's menu and page-layout XML into the JSON the front end renders
 * (PHP JSONEncodeMenu). One instance per request: the PHP version kept this state
 * (default target/window/stage, current menu location) in statics.
 *
 * Menus read from files; database-driven menus (branchSQLXML) and XSL-transformed
 * menus need a connection and arrive with the database drivers in step 2.
 */
export class MenuEncoder {
	defaultTarget = '_self';
	defaultWindow = '_self';
	defaultStage = null;

	#files;
	#config;
	#connections;
	#log;
	#actions;
	#variables = new Map();

	constructor({ files, config, messages, connections, log = console }) {
		this.#files = files;
		this.#config = config;
		this.#connections = connections;
		this.#log = log;
		this.#actions = new ActionEncoder({ menus: this, messages, acceptedOperators: config.get('ACCEPTED_OPERATORS') });
	}

	get actions() { return this.#actions; }

	/** Values XML can reference by name in <parameter value="NAME"> (the PHP globals). */
	setVariable(name, value) { this.#variables.set(name, value); }

	#logMessage(message) { this.#log.warn(`MenuEncoder ${message}`); }

	// ---- loading -------------------------------------------------------------

	loadFile(filename, menuLocation, rootNode, filterList) {
		const location = `${rootNode}/${menuLocation}`;
		this.setVariable('CURRENT_MENU_LOCATION', location);
		const xml = this.#files.tryReadText(`${location}/${filename}`);
		if (xml === null) return this.menuError(`loadFile fail as not found, file: ${location}/${filename}`, rootNode, null, menuLocation);
		return this.loadString(xml, menuLocation, rootNode, filterList, filename);
	}

	loadString(xml, menuLocation, rootNode, filterList, currentFile, isErrorMenu = false) {
		if (xml === '' || xml === null) return null;
		const node = XmlNode.parse(xml);
		if (!node) return isErrorMenu ? null : {}; // PHP returned an Exception object, which json_encode()s as {}
		return this.loadDom(node, menuLocation, rootNode, filterList, currentFile);
	}

	loadDom(node, menuLocation, rootNode, filterList, currentFile) {
		if (node.isNamed('menu')) return this.encodeMenuNode(node, menuLocation, rootNode, filterList, currentFile);
		return this.menuError(`Encode menu loadDom node name not menu, found ${node.nodeName}`, rootNode, null, menuLocation);
	}

	loadEmbededMenu(node, menuLocation, rootNode, filterList, currentFile) {
		return node.childNodes.filter((child) => child.isNamed('menu'))
			.map((child) => this.encodeMenuNode(child, menuLocation, rootNode, filterList, currentFile));
	}

	encodeMenuFolder(menuLocation, rootNode, filterList) {
		const folder = `${rootNode}/${menuLocation}`;
		if (!this.#files.isDirectory(folder)) return '';
		return this.#files.listMatching(folder, /^menu_.*\.xml$/i)
			.map((file) => this.loadFile(file, menuLocation, rootNode, filterList));
	}

	// ---- messages and errors -------------------------------------------------

	#leaf(text, menuLocation, rootNode) {
		const node = XmlNode.parse(`<menu type="leaf"><description>${Escape.html(text)}</description></menu>`)
			?? XmlNode.parse('<menu type="leaf"><description>Menu error, see server log</description></menu>');
		return this.encodeMenuNode(node, menuLocation, rootNode, null, null);
	}

	menuMessage(message, rootNode, onErrorMenu, menuLocation) {
		return [this.#leaf(message, menuLocation, rootNode)];
	}

	menuError(message, rootNode, onErrorMenu, menuLocation) {
		this.#logMessage(`root node: ${rootNode} menu location: ${menuLocation} error: ${message}`);
		if (!onErrorMenu) return [this.#leaf(message, menuLocation, rootNode)];
		const file = `${rootNode}${menuLocation}/${onErrorMenu}.xml`;
		const xml = this.#files.tryReadText(file);
		return [xml === null
			? this.#leaf(`error menu not found : ${file}`, menuLocation, rootNode)
			: this.loadString(xml, menuLocation, rootNode, null, file, true)];
	}

	// ---- database and XML branches ---------------------------------------------

	encodeMenuSQLXML(branchSQLXML, rootNode, filterList, branchXSL, branchSQLPredicate, dropParent, onErrorMenu, menuLocation) {
		const lower = branchSQLXML.toLowerCase();
		const isSQL = SQL_PREFIXES.some((prefix) => lower.startsWith(prefix)) || branchSQLXML.startsWith('(');
		if (!isSQL && !this.#files.isFile(`${branchSQLXML}.sql`) && !this.#files.isFile(branchSQLXML))
			return this.menuError(`branchSQLXML "${branchSQLXML}" not found`, rootNode, onErrorMenu, menuLocation);
		if (!this.#connections.isConnected())
			return this.menuMessage('No connection found', rootNode, onErrorMenu, menuLocation);
		return this.menuError('Database menus are not available yet in the Node.js server', rootNode, onErrorMenu, menuLocation);
	}

	encodeMenuXML(xml, rootNode, filterList, branchXSL, dropParent, onErrorMenu, menuLocation) {
		if (xml === '' || xml === null) return this.menuError('nil', rootNode, onErrorMenu, menuLocation);
		if (branchXSL === '' || branchXSL === null || branchXSL === undefined) {
			const menu = this.loadString(xml, menuLocation, rootNode, filterList, null);
			return dropParent === 'true' ? menu : [menu];
		}
		return this.menuError('XSL menu transforms are not available yet in the Node.js server', rootNode, onErrorMenu, menuLocation);
	}

	// ---- menu nodes -------------------------------------------------------------

	encodeMenuNode(node, menuLocation, rootNode, filterList, currentFile) {
		if (!node) return null;
		const attr = (name, fallback) => String(node.getAttribute(name, fallback) ?? '').trim();
		let nodeType = node.getAttribute('type', 'leaf').toUpperCase();
		const delayLoadAttribute = node.getAttribute('delayLoad');
		const delayLoad = delayLoadAttribute === '' ? 'false' : delayLoadAttribute.toLowerCase();
		const reloadOnConnectionChange = isTrue(node.getAttribute('reloadOnConnectionChange', 'false'));
		const branch = {
			rootDirectory: attr('rootDirectory'), branchDirectory: attr('branchDirectory'), branchSQLXML: attr('branchSQLXML'),
			branchSQLPredicate: attr('branchSQLPredicate'), branchXML: attr('branchXML'), branchXSL: attr('branchXSL'),
			onErrorMenu: attr('onErrorMenu'), dropParent: attr('dropParent'),
		};
		const replacement = isTrue(node.getAttribute('replacement', 'false'));
		const GUID = attr('GUID');
		const result = VersionAttributes.encode(node);
		const tag = node.getAttribute('tag');

		if (!(tag === '' && nodeType === 'BRANCH') && filterList)
			for (const filter of filterList) if (!new RegExp(filter).test(tag)) return null;

		const description = node.getChildTextContent('description', 'none');
		const filter = node.getChildTextContent('filter', null);
		if (filter !== null) filterList = filterList ? [...filterList, filter] : [filter];

		const elementID = node.getChildTextContent('menuGUID', null);
		let elementAction = null, subNodes = null, rootCallBack = null, localFilterList = null;
		let actionJSON = null, linkList = null, pageWindow = null, floatingPanel = null;

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
					if (branch.rootDirectory !== '')
						subNodes = this.encodeMenuFolder(menuLocation, branch.rootDirectory, filterList);
					else if (branch.branchDirectory !== '')
						subNodes = this.encodeMenuFolder(`${menuLocation}/${branch.branchDirectory}`, rootNode, filterList);
					else if (branch.branchSQLXML !== '') {
						nodeType = 'SQL_BRANCH';
						subNodes = this.encodeMenuSQLXML(branch.branchSQLXML, rootNode, filterList, branch.branchXSL, branch.branchSQLPredicate, branch.dropParent, branch.onErrorMenu, menuLocation);
					} else if (branch.branchXML !== '') {
						nodeType = 'XML_BRANCH';
						subNodes = this.encodeMenuXML(branch.branchXML, rootNode, filterList, branch.branchXSL, branch.dropParent, branch.onErrorMenu, menuLocation);
					}
					if (PhpCompat.isEmpty(subNodes)) return null;
				}
				break;
			case 'LEAF': {
				const actionNode = node.findChildNode('actionScript');
				if (!actionNode) pageWindow = this.#tutorialPageWindow(node.findChildNode('tutorial'), description);
				elementAction = node.getChildTextContent('JSAction', null);
				if (actionNode) actionJSON = this.#actions.fromDOM(actionNode);
				floatingPanel = this.#floatingPanel(node.findChildNode('floatingPanel'));
				linkList = this.retrieveLinksFromDOM(node);
				if (pageWindow === null) pageWindow = this.encodePageWindowsFromDOM(node);
				break;
			}
			case 'EMBEDDEDBRANCH':
				nodeType = 'BRANCH';
				subNodes = this.loadEmbededMenu(node, menuLocation, rootNode, filterList, null);
				break;
			case 'TABLE':
				result.table = attr('table');
				result.parameters = PhpCompat.assoc(Object.fromEntries(node.childNodes.filter((c) => c.isNamed('parameter')).map((p) => {
					const valueNode = p.childNodes.filter((v) => v.isNamed('value')).at(-1);
					return [p.getAttribute('name'), valueNode ? valueNode.textContent.trim() : p.getAttribute('value')];
				})));
				break;
			case 'LINE':
				break;
			default:
				return this.menuError(`Encode menu node failed as type: "${nodeType}" not known`, rootNode, null, menuLocation);
		}

		return Object.assign(result, {
			nodeType, delayLoad, GUID, reloadOnConnectionChange, replacement, tag, elementID,
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
		});
	}

	/** A <tutorial> menu leaf opens the tutorial action in a page layout. */
	#tutorialPageWindow(tutorial, description) {
		if (!tutorial) return null;
		const name = orIfEmpty(tutorial.getAttribute('name'), null) ?? description.replace(/\s(.?)/g, (_, c) => c.toUpperCase());
		const cdata = (text) => `<![CDATA[${text.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
		const source = tutorial.getAttribute('source');
		let sourceParameter;
		if (!source) sourceParameter = `<parameter name="script">${cdata(tutorial.toXML())}</parameter>`;
		else if (this.#files.isFile(source)) sourceParameter = `<parameter name="script">${cdata(this.#files.readText(source))}</parameter>`;
		else sourceParameter = `<parameter name="CurrentMenuLocation">${source}</parameter>`;
		const window = this.encodePageWindowFromString(`<?xml version="1.0" encoding="UTF-8"?>
			<pageWindow target="_final"><panel name="Tutorial" PrimaryContainer="true">
				<link connectionRequired="y" target="_self" type="action" window="_self"><parameterList>
					<parameter name="action">tutorial</parameter>
					<parameter name="tutorialName">${name}</parameter>
					${sourceParameter}
				</parameterList></link>
			</panel></pageWindow>`);
		if (window === null) this.#logMessage(`encodeMenuXML tutorial "${description}" encodePageWindow failed`);
		return window;
	}

	#floatingPanel(node) {
		if (!node) return null;
		return {
			...this.getPanelContent(node.childNodes),
			hideMenuBar: isTrue(node.getAttribute('hideMenuBar', 'false')),
			reloadOnConnectionChange: isTrue(node.getAttribute('reloadOnConnectionChange', 'false')),
			panelHeaders: this.encodePanelHeaders(node.findChildNode('panelHeaders')),
			baseWidth: node.getAttribute('baseWidth', null),
			baseHeight: node.getAttribute('baseHeight', null),
			loadContentOnShow: isTrue(node.getAttribute('loadContentOnShow', 'false')),
			reloadContentOnShow: isTrue(node.getAttribute('reloadContentOnShow', 'false')),
		};
	}

	// ---- links -----------------------------------------------------------------

	retrieveLinksFromDOM(node) {
		return node.getElementsByTagName('linkList').flatMap((list) => list.childNodes.map((link) => this.encodeTopLinkNodeToURL(link)));
	}

	encodeTopLinkNodeToURL(link, rowData = null, fieldLookUp = null) {
		if (!link.isNamed('link')) return null;
		const type = orIfEmpty(link.getAttribute('type').toUpperCase(), 'LINK');
		const result = {
			target: orIfEmpty(link.getAttribute('target'), this.defaultTarget),
			window: orIfEmpty(link.getAttribute('window'), this.defaultWindow),
			windowStage: orIfEmpty(link.getAttribute('windowStage'), this.defaultStage),
			formList: this.#encodeFormList(link),
			type,
		};
		if (type === 'RAW') result.data = link.getChildTextContent('RAW', '');
		else if (type === 'URL') result.data = link.getChildTextContent('URL', '');
		else result.data = this.encodeLinkNode(link, rowData, fieldLookUp);
		return result;
	}

	#encodeFormList(link) {
		return link.getElementsByTagName('formList').flatMap((list) => list.childNodes.map((form) => form.getAttribute('name')));
	}

	encodeLinkNode(link, rowData = null, fieldLookUp = null) {
		if (!link?.isNamed('link')) return '';
		if (!link.hasChildNodes()) return link.textContent.trim();
		const result = { baseDirectory: link.getAttribute('type') === 'html' ? this.#config.get('HTML_BASE_DIRECTORY') : null, address: null, parameters: {} };
		for (const child of link.childNodes) {
			const name = child.nodeName.toLowerCase();
			if (name === 'address') result.address = child.textContent.trim();
			else if (name === 'parameterlist')
				for (const parameter of child.childNodes) this.#encodeLinkParameter(parameter, result.parameters, rowData, fieldLookUp);
		}
		result.parameters = PhpCompat.assoc(result.parameters);
		return result;
	}

	#encodeLinkParameter(parameter, parameters, rowData, fieldLookUp) {
		let name = parameter.getAttribute('name');
		let value = parameter.getAttribute('value');
		let valueWasSet = false;
		if (value !== '') {
			if (this.#variables.has(value)) { value = this.#variables.get(value); valueWasSet = true; }
			else if (this.#config.has(value)) { value = this.#config.get(value); valueWasSet = true; }
		}
		if (parameter.hasChildNodes()) {
			const sub = parameter.childNodes[0];
			valueWasSet = true;
			switch (sub.nodeName.toLowerCase()) {
				case 'link': value = this.encodeTopLinkNodeToURL(sub, rowData, fieldLookUp); break;
				case 'graph': value = GraphEncoder.encode(sub); break;
				case 'pagewindow': value = this.encodePageWindow(sub); break;
				case 'keycolumn':
					if (rowData !== null && fieldLookUp !== null) {
						const column = sub.textContent.trim();
						value = Object.hasOwn(fieldLookUp, column) ? rowData[fieldLookUp[column]] : sub.getAttribute('defaultValue');
					} else { name = ''; valueWasSet = false; }
					break;
				case 'value':
					value = sub.hasChildNodes() ? parameter.arrayEncodeXML() : parameter.textContent.trim();
					break;
				default: value = parameter.arrayEncodeXML(); break;
			}
		}
		if (!valueWasSet) value = parameter.textContent.trim();
		if (name !== '') parameters[name] = value;
	}

	// ---- page layouts ------------------------------------------------------------

	encodePageWindowFromFile(file) {
		const xml = this.#files.tryReadText(file);
		if (xml === null) { this.#logMessage(`encodePageWindowFromFile not readable file: ${file}`); return null; }
		return this.encodePageWindowFromString(xml);
	}

	encodePageWindowFromString(xml) {
		const node = XmlNode.parse(xml);
		if (!node) { this.#logMessage('encodePageWindowFromString failed: XML not well formed'); return null; }
		return node.isNamed('pageWindow') ? this.encodePageWindow(node) : null;
	}

	encodePageWindowsFromDOM(node) {
		return node.getElementsByTagName('pageWindow').filter((w) => w.hasChildNodes()).map((w) => this.encodePageWindow(w));
	}

	encodePageWindow(window) {
		if (!window?.hasChildNodes()) return null;
		const panelHeaders = this.encodePanelHeaders(window.findChildNode('panelHeaders'));
		return {
			reloadOnConnectionChange: isTrue(window.getAttribute('reloadOnConnectionChange', 'false')),
			target: window.getAttribute('target'),
			title: window.getChildTextContent('title'),
			info: window.getChildTextContent('info'),
			leftMenu: this.encodeMenuNode(window.findChildNode('leftMenu'), null, null, null, null),
			raiseToTop: window.getAttribute('raiseToTop') !== 'false',
			windowStage: orIfEmpty(window.getAttribute('windowStage'), this.defaultStage),
			windowType: window.getAttribute('windowType', 'NORMAL'),
			windowOptionType: window.getAttribute('windowOptionType'),
			panelHeaders,
			content: this.encodeContainerNode(window, panelHeaders),
		};
	}

	encodePanelHeaders(node) {
		if (!node) return null;
		return {
			scope: node.getAttribute('scope'),
			refreshEnabled: node.getAttribute('refreshEnabled') !== 'false',
			refreshOptions: node.getAttribute('refreshOptions'),
			autoRefreshControls: this.#autoRefresh(node.findChildNode('autoRefreshControls')),
			showRefreshControl: node.getAttribute('showRefreshControl') !== 'false',
		};
	}

	#autoRefresh(node) {
		if (!node) return null;
		let timeOptions;
		try { timeOptions = JSON.parse(node.getChildTextContent('timeOptions', 'true')); } catch { timeOptions = null; }
		return {
			time: node.getChildTextContent('time', -1),
			timeVisible: node.getChildTextContent('timeVisible') !== 'false',
			timeOptions,
			countdownVisible: node.getChildTextContent('countdownVisible') === 'true',
		};
	}

	getPanelContent(nodes) {
		for (const node of nodes) {
			if (node.isNamed('link')) return { ContentType: 'LINK', data: this.encodeTopLinkNodeToURL(node) };
			if (node.isNamed('raw')) return { ContentType: 'RAW', data: node.textContent.trim() };
			if (node.isNamed('url')) return { ContentType: 'URL', data: node.textContent.trim() };
		}
		return { ContentType: 'RAW', data: '' };
	}

	/** First panel, splitPane or stage child of a layout container. */
	encodeContainerNode(container, parentPanelHeaders) {
		for (const child of container.childNodes) {
			switch (child.nodeName.toLowerCase()) {
				case 'panel': return this.#panel(child, parentPanelHeaders);
				case 'splitpane': return this.#splitPane(child, parentPanelHeaders);
				case 'stage': return this.#stage(child);
				default: break;
			}
		}
		return null;
	}

	#panel(node, parentPanelHeaders) {
		const content = node.hasChildNodes() ? this.getPanelContent(node.childNodes) : { ContentType: null, data: null };
		const delayLoad = node.getAttribute('delayLoad');
		return {
			type: 'panel',
			name: orIfEmpty(node.getAttribute('name'), PhpCompat.uniqid()),
			ContentType: content.ContentType,
			data: content.data,
			reloadOnConnectionChange: isTrue(node.getAttribute('reloadOnConnectionChange', 'false')),
			panelHeaders: this.encodePanelHeaders(node.findChildNode('panelHeaders')) ?? parentPanelHeaders,
			overflow: orIfEmpty(node.getAttribute('overflow'), 'auto'),
			delayLoad: delayLoad === 'true',
			panelTitle: orIfEmpty(node.getAttribute('panelTitle'), null),
			PrimaryContainer: node.getAttribute('PrimaryContainer') === 'true',
		};
	}

	#splitPane(node, parentPanelHeaders) {
		const empty = () => ({ type: 'panel', name: PhpCompat.uniqid(), ContentType: 'RAW', data: NO_CONTENT_PANEL });
		const result = {
			type: 'splitPane',
			panelA: empty(),
			panelB: empty(),
			direction: node.getAttribute('direction').toLowerCase().startsWith('v') ? 'v' : 'h',
			splitPercent: orIfEmpty(node.getAttribute('splitPercent'), null),
			allowResize: node.getAttribute('allowResize') !== 'false',
			maxSize: node.getAttribute('maxSize') === '' ? null : PhpCompat.intval(node.getAttribute('maxSize')),
		};
		if (node.hasAttribute('showSplitSpacer')) {
			result.showSplitSpacer = isTrue(node.getAttribute('showSplitSpacer'));
			result.splitSpacerWidth = PhpCompat.intval(node.getAttribute('splitSpacerWidth', 3));
		}
		result.styleOverride = node.getAttribute('styleOverride', '');
		for (const pane of node.childNodes) {
			const name = pane.nodeName.toLowerCase();
			if (['toppane', 'leftpane', 'panela'].includes(name)) result.panelA = this.encodeContainerNode(pane, parentPanelHeaders);
			else if (['bottompane', 'rightpane', 'panelb'].includes(name)) result.panelB = this.encodeContainerNode(pane, parentPanelHeaders);
		}
		return result;
	}

	#stage(node) {
		const attr = (name) => node.getAttribute(name);
		return {
			type: 'stage', name: attr('name'), HasMenuBarContainer: attr('HasMenuBarContainer'),
			top: PhpCompat.intval(attr('top')), botton: PhpCompat.intval(attr('botton')),
			left: PhpCompat.intval(attr('left')), right: PhpCompat.intval(attr('right')),
			titleBarType: attr('titleBarType'), windowOptionType: attr('windowOptionType'),
			windowControlTypes: attr('windowControlTypes'), sizable: attr('sizable'),
		};
	}

	/** Directory part of a menu callback path relative to the menu root (PHP dirname + substr). */
	static menuLocationOf(callbackPath, menuRoot) {
		return path.posix.dirname(callbackPath).slice(menuRoot.length);
	}
}
