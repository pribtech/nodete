// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Action } from '../../../core/Action.js';
import { MenuBuilder } from '../../../definitions/MenuBuilder.js';

/**
 * Menu JSON for the front end's menus (PHP actions/noConnection/JSON/menu.php).
 * Answers as "(<json>)", which the front end evaluates.
 *
 * Three ways in:
 *  - baseMenuFolder: every menu_*.json in a folder
 *  - rootCallBack = path of a delay-loaded menu file: expand that branch
 *  - rootCallBack = JSON branch description: expand an inline or database branch
 */
export default class MenuAction extends Action {
	async run() {
		const builder = MenuBuilder.forContext(this.context);
		builder.defaultStage = this.param('defaultStage', builder.defaultStage);
		builder.defaultTarget = this.param('defaultPanel', '_self');
		builder.defaultWindow = this.param('defaultWindow', '_self');
		const menu = this.#build(builder);
		await builder.resolveDeferred();
		this.response.send(`(${JSON.stringify(menu)})`);
	}

	#build(builder) {
		const rootCallBack = this.param('rootCallBack');
		const mainMenu = this.config.get('MAIN_MENU_ROOT_DIRECTORY');
		if (rootCallBack === null) return builder.folder('.', this.param('baseMenuFolder', mainMenu), this.#requestFilters());

		const branch = this.#readBranch(rootCallBack, builder);
		if (branch === null) return builder.folder('.', mainMenu, this.#requestFilters());
		let menuRoot = mainMenu;
		if (branch.rootDirectory) menuRoot = branch.rootDirectory;
		else if (branch.branchDirectory) menuRoot = `${rootCallBack.slice(0, rootCallBack.lastIndexOf('/'))}/${branch.branchDirectory}`;
		// The PHP version replaced the request's filter list with the branch filter (an `=` vs `==` slip); kept for identical menus.
		const filterList = branch.filter ? [branch.filter] : this.#requestFilters();

		if (branch.branchXML) return builder.xmlBranch(branch, menuRoot, filterList, branch.menulocation);
		if (branch.branchSQLXML) return builder.sqlBranch(branch, menuRoot, branch.menulocation, filterList);
		return builder.folder('.', menuRoot, filterList);
	}

	#requestFilters() {
		const filters = this.param('filterList');
		if (filters === null) return null;
		return Array.isArray(filters) ? filters : [filters];
	}

	/** Branch settings from a JSON callback or from a delay-loaded menu file. */
	#readBranch(rootCallBack, builder) {
		if (rootCallBack.startsWith('{')) {
			const branch = JSON.parse(rootCallBack);
			return { ...MenuBuilder.branchOf(branch), filter: branch.filter ?? '', menulocation: branch.menulocation,
				branchSQLXML: String(branch.branchSQLXML ?? '').replaceAll('@@@', '"') };
		}
		const definition = builder.readDefinition(rootCallBack);
		if (!definition) return null;
		return {
			...MenuBuilder.branchOf(definition),
			filter: '',
			menulocation: MenuBuilder.menuLocationOf(rootCallBack, this.config.get('MAIN_MENU_ROOT_DIRECTORY')),
		};
	}
}
