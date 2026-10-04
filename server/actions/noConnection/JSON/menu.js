import { Action } from '../../../core/Action.js';
import { MenuEncoder } from '../../../encoders/MenuEncoder.js';
import { XmlNode } from '../../../xml/XmlNode.js';

/**
 * Menu JSON for the front end's menus (PHP actions/noConnection/JSON/menu.php).
 * Answers as "(<json>)", which the front end evaluates.
 *
 * Three ways in:
 *  - baseMenuFolder: every menu_*.xml in a folder
 *  - rootCallBack = path of a delay-loaded menu file: expand that branch
 *  - rootCallBack = JSON branch description: expand an XML or database branch
 */
export default class MenuAction extends Action {
	async run() {
		const encoder = new MenuEncoder({ files: this.files, config: this.config, messages: this.messages, connections: this.connections });
		encoder.defaultStage = this.param('defaultStage', encoder.defaultStage);
		encoder.defaultTarget = this.param('defaultPanel', encoder.defaultTarget);
		encoder.defaultWindow = this.param('defaultWindow', encoder.defaultWindow);
		this.response.send(`(${JSON.stringify(this.#encode(encoder))})`);
	}

	#encode(encoder) {
		const rootCallBack = this.param('rootCallBack');
		let menuRoot = this.config.get('MAIN_MENU_ROOT_DIRECTORY');
		if (rootCallBack === null)
			return encoder.encodeMenuFolder('.', this.param('baseMenuFolder', menuRoot), this.#requestFilters());

		const branch = this.#readBranch(rootCallBack);
		if (branch === null) return encoder.encodeMenuFolder('.', menuRoot, this.#requestFilters());
		if (branch.rootDirectory) menuRoot = branch.rootDirectory;
		else if (branch.branchDirectory) menuRoot = `${rootCallBack.slice(0, rootCallBack.lastIndexOf('/'))}/${branch.branchDirectory}`;
		// The PHP code replaced the request's filter list with the branch filter (an `=` vs `==` slip); kept for identical menus.
		const filterList = branch.filter ? [branch.filter] : this.#requestFilters();

		if (branch.branchXML)
			return encoder.encodeMenuXML(branch.branchXML, menuRoot, filterList, branch.branchXSL, branch.dropParent, branch.onErrorMenu, branch.menulocation);
		if (branch.branchSQLXML)
			return encoder.encodeMenuSQLXML(branch.branchSQLXML, menuRoot, filterList, branch.branchXSL, branch.branchSQLPredicate, branch.dropParent, branch.onErrorMenu, branch.menulocation);
		return encoder.encodeMenuFolder('.', menuRoot, filterList);
	}

	#requestFilters() {
		const filters = this.param('filterList');
		if (filters === null) return null;
		return Array.isArray(filters) ? filters : [filters];
	}

	/** Branch settings from a JSON callback or from the root element of a menu file. */
	#readBranch(rootCallBack) {
		if (rootCallBack.startsWith('{')) {
			const branch = JSON.parse(rootCallBack);
			branch.branchSQLXML = String(branch.branchSQLXML ?? '').replaceAll('@@@', '"');
			return branch;
		}
		const node = XmlNode.parse(this.files.tryReadText(rootCallBack));
		if (!node) return null;
		const attr = (name) => node.getAttribute(name).trim();
		return {
			rootDirectory: attr('rootDirectory'), branchDirectory: attr('branchDirectory'), branchSQLXML: attr('branchSQLXML'),
			branchSQLPredicate: attr('branchSQLPredicate'), branchXML: attr('branchXML'), branchXSL: attr('branchXSL'),
			onErrorMenu: attr('onErrorMenu'), dropParent: attr('dropParent'), filter: attr('filter'), DBMS: attr('DBMS'),
			menulocation: MenuEncoder.menuLocationOf(rootCallBack, this.config.get('MAIN_MENU_ROOT_DIRECTORY')),
		};
	}
}
