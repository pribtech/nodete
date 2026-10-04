import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'php-reference');

/**
 * Outputs recorded from the original PHP application (PHP 8.3, same db2te/ content),
 * used to prove the Node.js port answers the front end identically.
 */
export class PhpReference {
	static text(name) { return readFileSync(path.join(FIXTURES, name), 'utf8'); }

	static json(name) { return JSON.parse(PhpReference.text(name)); }

	/** Menu responses are "(<json>)", evaluated by the front end. */
	static unwrapMenu(text) { return JSON.parse(text.trim().replace(/^\(/, '').replace(/\)$/, '')); }

	static menu(name) { return PhpReference.unwrapMenu(PhpReference.text(name)); }

	/** GLOBAL_TE_SCRIPT_STORE.set('name', {...}); lines as a name -> script map. */
	static teScripts(text) {
		return Object.fromEntries([...text.matchAll(/GLOBAL_TE_SCRIPT_STORE\.set\('([^']*)',(.*)\);\n/g)].map((m) => [m[1], JSON.parse(m[2])]));
	}

	/**
	 * Removes differences that do not reach the front end: random uniqid() panel names,
	 * and JSON-in-a-string menu callbacks whose escaping differs (PHP writes \/).
	 */
	static normalise(value, key = null) {
		if (Array.isArray(value)) return value.map((item) => PhpReference.normalise(item));
		if (value && typeof value === 'object')
			return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, PhpReference.normalise(v, k)]));
		if (key === 'name' && typeof value === 'string' && /^[0-9a-f]{13}$/.test(value)) return '<uniqid>';
		if (key === 'rootCallBack' && typeof value === 'string') {
			if (value.startsWith('{')) return JSON.parse(value);
			return value.replace(/\.xml$/, '.json'); // menu definitions are JSON now; the callback names the file
		}
		return value;
	}
}
