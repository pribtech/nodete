import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Application settings: the constants the PHP version defined in config.php.
 *
 * Defaults come from config/defaults.json (generated from the PHP constants, so
 * the values match exactly). Any setting can be overridden with an environment
 * variable of the form TE_<NAME>, e.g. TE_SESSION_TIMEOUT_IN_MIN=30. Values are
 * JSON-parsed when possible so booleans and numbers keep their type.
 *
 * Instances are frozen: settings are read-only once the server starts.
 */
export class Config {
	#values;
	#appRoot;

	constructor(values, appRoot) {
		this.#values = Object.freeze({ ...values });
		this.#appRoot = appRoot;
		Object.freeze(this);
	}

	static load({ env = process.env, appRoot = path.resolve(SERVER_ROOT, '..', 'db2te'), overrides = {} } = {}) {
		const defaults = JSON.parse(readFileSync(path.join(SERVER_ROOT, 'config', 'defaults.json'), 'utf8'));
		const values = { ...defaults };
		for (const name of Object.keys(defaults)) {
			const raw = env[`TE_${name}`];
			if (raw !== undefined) values[name] = Config.#parseEnvValue(raw);
		}
		return new Config({ ...values, ...overrides }, appRoot);
	}

	static #parseEnvValue(raw) {
		try { return JSON.parse(raw); } catch { return raw; }
	}

	/** The db2te folder holding the front end, menus, tutorials and XML content. */
	get appRoot() { return this.#appRoot; }

	has(name) { return Object.hasOwn(this.#values, name); }

	get(name) {
		if (!this.has(name)) throw new Error(`Unknown config setting: ${name}`);
		return this.#values[name];
	}

	/** Like get() but returns fallback for unknown names (PHP constant() semantics on optional settings). */
	getOptional(name, fallback = null) {
		return this.has(name) ? this.#values[name] : fallback;
	}

	/** Version string as the PHP version formatted it, e.g. "5.0.1953". */
	get versionString() {
		return `${this.get('MAJOR_VERSION')}.${this.get('MINOR_VERSION')}.${this.get('SUB_VERSION')}`;
	}
}
