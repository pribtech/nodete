import path from 'node:path';
import { PageBuilder } from './PageBuilder.js';
import { Requirements } from './Requirements.js';
import { ScriptDefinition } from './ScriptDefinition.js';
import { XmlMenuSource, MenuSourceError } from './XmlMenuSource.js';
import { PhpCompat } from '../util/PhpCompat.js';
import { Messages } from '../core/Messages.js';

const MENU_FILE = /^menu_.*\.json$/i;

/**
 * Builds menus from their JSON definitions (menu_*.json) into the form the front end
 * renders. One instance per request: it carries the request's link defaults and the
 * location of the menu file being loaded.
 *
 * A menu definition is {"type": "leaf" | "branch" | "embeddedBranch" | "table" | "line", ...};
 * see README "Definition files" for the fields.
 *
 * Branches made from database queries or XSL transforms need asynchronous work. Building
 * leaves an empty list in their place and queues the work; resolveDeferred() then fills
 * the lists in, so the menu tree itself is built in one synchronous pass.
 */
export class MenuBuilder {
	#files;
	#connections;
	#log;
	#pages;
	#xmlMenus;
	#requestValue;
	#deferred = [];

	/**
	 * @param {object} options
	 * @param {(name: string) => any} [options.requestValue] request parameters, for bind markers in branch queries
	 * @param {XmlMenuSource} [options.xmlMenus] reads database and XSL branches
	 */
	constructor({ files, config, connections, log = console, messages = Messages.for(config.get('TE_LANGUAGE')), requestValue = () => null, xmlMenus = null }) {
		this.#files = files;
		this.#connections = connections;
		this.#log = log;
		this.#requestValue = requestValue;
		this.#pages = new PageBuilder({ config, buildMenu: (definition) => this.node(definition, null, null, null, null) });
		this.#xmlMenus = xmlMenus ?? new XmlMenuSource({ files, connections, config, messages });
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

	/** branchSQLXML: a query (or .sql file) whose XML result branchXSL turns into the branch's menus. */
	sqlBranch(branch, rootNode, menuLocation, filterList = null) {
		let sql;
		try {
			sql = this.#xmlMenus.sqlOf(branch.branchSQLXML);
		} catch (error) {
			return this.menuError(error.message, rootNode, branch.onErrorMenu, menuLocation);
		}
		if (!this.#connections.isConnected()) return this.menuMessage('No connection found');
		return this.#defer({ sql, branch, rootNode, menuLocation, filterList });
	}

	/**
	 * branchXML: an inline menu definition (JSON text); or, with branchXSL, XML (inline or a
	 * file) that the stylesheet turns into the branch's menus.
	 */
	xmlBranch(branch, rootNode, filterList, menuLocation) {
		if (!branch.branchXML) return this.menuError('nil', rootNode, branch.onErrorMenu, menuLocation);
		if (branch.branchXSL) return this.#defer({ xml: branch.branchXML, branch, rootNode, menuLocation, filterList });
		let definition;
		try { definition = JSON.parse(branch.branchXML); } catch { definition = null; }
		const menu = definition ? this.node(definition, menuLocation, rootNode, filterList, null) : {};
		return branch.dropParent === 'true' ? menu : [menu];
	}

	/** Queues a branch made asynchronously; returns the list resolveDeferred() fills. */
	#defer(work) {
		const subNodes = [];
		this.#deferred.push({ ...work, subNodes });
		return subNodes;
	}

	#isDeferred(subNodes) { return this.#deferred.some((work) => work.subNodes === subNodes); }

	/** Runs the queued database queries and transforms, filling in their branches (and any they queue in turn). */
	async resolveDeferred() {
		while (this.#deferred.length) {
			const work = this.#deferred[0];
			const nodes = await this.#build(work);
			this.#deferred.shift();
			work.subNodes.push(...nodes);
		}
	}

	async #build({ sql, xml, branch, rootNode, menuLocation, filterList, subNodes }) {
		try {
			const source = sql === undefined ? xml : await this.#xmlMenus.queryXml(sql, branch.branchSQLPredicate, this.#requestValue);
			const menuXml = branch.branchXSL ? await this.#xmlMenus.transform(source, branch.branchXSL) : source;
			const menu = this.node(this.#xmlMenus.definition(menuXml), menuLocation, rootNode, filterList, null);
			if (branch.dropParent !== 'true') return [menu];
			const children = menu?.elementSubNodes;
			if (!Array.isArray(children) || (children.length === 0 && !this.#isDeferred(children)))
				return this.menuError('Nil', rootNode, branch.onErrorMenu, menuLocation);
			// a dropped parent's own deferred branch fills this branch's list instead
			for (const work of this.#deferred) if (work.subNodes === children) work.subNodes = subNodes;
			return children;
		} catch (error) {
			if (!(error instanceof MenuSourceError)) this.#log.error(error.stack ?? error);
			return this.menuError(error.message, rootNode, branch.onErrorMenu, menuLocation);
		}
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
					else if (branch.branchSQLXML !== '') { nodeType = 'SQL_BRANCH'; subNodes = this.sqlBranch(branch, rootNode, menuLocation, filterList); }
					else if (branch.branchXML !== '') { nodeType = 'XML_BRANCH'; subNodes = this.xmlBranch(branch, rootNode, filterList, menuLocation); }
					if (PhpCompat.isEmpty(subNodes) && !this.#isDeferred(subNodes)) return null;
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
