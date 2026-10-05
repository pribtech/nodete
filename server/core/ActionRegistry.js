// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { readdirSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { Action } from './Action.js';

const ACTIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'actions');

/**
 * Finds the class for an action name, the way action.php looked for
 * actions/<scope>/<returnType>/<name>.php.
 *
 * Scope is "activeConnection" (needs a database connection) or "noConnection".
 * Action files are discovered once at startup and imported on first use.
 */
export class ActionRegistry {
	static SCOPES = Object.freeze(['activeConnection', 'noConnection']);

	#files = new Map();
	#classes = new Map();
	#legacyRoot;

	/**
	 * @param {string} actionsDir folder of ported actions
	 * @param {string|null} legacyRoot the PHP app's actions folder, used only to report
	 *        actions that exist in PHP but have not been ported yet
	 */
	constructor(actionsDir = ACTIONS_DIR, legacyRoot = null) {
		this.#legacyRoot = legacyRoot;
		for (const scope of ActionRegistry.SCOPES)
			for (const returnType of ['JSON', 'HTML'])
				this.#scan(path.join(actionsDir, scope, returnType), scope, returnType, '');
	}

	static key(scope, returnType, name) { return `${scope}/${returnType}/${name}`; }

	#scan(dir, scope, returnType, prefix) {
		if (!existsSync(dir)) return;
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) this.#scan(path.join(dir, entry.name), scope, returnType, `${prefix}${entry.name}/`);
			else if (entry.name.endsWith('.js'))
				this.#files.set(ActionRegistry.key(scope, returnType, prefix + entry.name.slice(0, -3)), path.join(dir, entry.name));
		}
	}

	has(scope, returnType, name) { return this.#files.has(ActionRegistry.key(scope, returnType, name)); }

	/** All registered keys, e.g. "noConnection/JSON/menu". */
	get names() { return [...this.#files.keys()].sort(); }

	async load(scope, returnType, name) {
		const key = ActionRegistry.key(scope, returnType, name);
		if (!this.#classes.has(key)) {
			const file = this.#files.get(key);
			if (!file) return null;
			const { default: ActionClass } = await import(pathToFileURL(file).href);
			if (!(ActionClass?.prototype instanceof Action))
				throw new Error(`${key} must default-export a subclass of Action`);
			this.#classes.set(key, ActionClass);
		}
		return this.#classes.get(key);
	}

	/** True when the PHP version has this action but it has not been ported yet. */
	isUnported(returnType, name) {
		if (!this.#legacyRoot) return false;
		return ActionRegistry.SCOPES.some((scope) =>
			existsSync(path.join(this.#legacyRoot, scope, returnType, `${name}.php`)) && !this.has(scope, returnType, name));
	}
}
