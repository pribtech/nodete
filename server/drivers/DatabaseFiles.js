import path from 'node:path';
import { DatabaseError } from './DatabaseError.js';

/**
 * The folder that holds file databases (SQLite), and the rule for naming them: letters,
 * digits and _ . - / only, and never outside the folder, so a login cannot open or create
 * files elsewhere on the server.
 */
export class DatabaseFiles {
	static #SAFE_NAME = /^[A-Za-z0-9_][A-Za-z0-9_.\-/]*$/;

	#directory;

	constructor(directory) { this.#directory = path.resolve(directory); }

	get directory() { return this.#directory; }

	/** Absolute path of the database file called name. */
	resolve(name) {
		const text = String(name ?? '').trim();
		if (!DatabaseFiles.#SAFE_NAME.test(text) || text.split('/').includes('..'))
			throw new DatabaseError(`Invalid database name "${text}": use letters, digits and _ . - / inside the data folder`);
		return path.join(this.#directory, text);
	}
}
