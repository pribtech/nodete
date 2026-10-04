import { DatabaseError } from './DatabaseError.js';

/**
 * An open connection to a database (the PHP Connection class). Subclasses wrap a driver
 * module's connection object and implement the protected #-free hooks below; callers use
 * execute(), the transaction methods and close().
 */
export class DatabaseConnection {
	#spec;
	#autoCommit = true;
	#closed = false;

	constructor(spec) {
		if (new.target === DatabaseConnection) throw new TypeError('DatabaseConnection is abstract');
		this.#spec = spec;
	}

	get spec() { return this.#spec; }
	get autoCommit() { return this.#autoCommit; }
	get isClosed() { return this.#closed; }

	/** The DBMS family the TE menus test with requires.DBMS, e.g. DB2, postgreSQL. */
	get DBMS() { throw new Error(`${this.constructor.name} does not implement DBMS`); }

	/**
	 * Runs one statement and returns a ResultCursor over its rows.
	 * @param {string} sql
	 * @param {import('./BindParameter.js').BindParameter[]} parameters
	 */
	async execute(sql, parameters = []) {
		this.#assertOpen();
		try {
			return await this.run(sql, parameters);
		} catch (error) {
			throw DatabaseError.from(error);
		}
	}

	/** Runs a statement and returns all rows of its first result set. */
	async rows(sql, parameters = []) {
		const cursor = await this.execute(sql, parameters);
		try {
			const rows = [];
			for (let row = await cursor.next(); row !== null; row = await cursor.next()) rows.push(row);
			return rows;
		} finally {
			await cursor.close();
		}
	}

	async setAutoCommit(on) {
		this.#assertOpen();
		if (on === this.#autoCommit) return;
		await this.changeAutoCommit(on);
		this.#autoCommit = on;
	}

	async commit() { if (!this.#autoCommit) await this.endUnitOfWork(true); }

	async rollback() { if (!this.#autoCommit) await this.endUnitOfWork(false); }

	/** Makes schema the default for unqualified names. */
	async setSchema(schema) {
		this.#assertOpen();
		await this.changeSchema(schema);
	}

	/** Facts about the server for the session: version, fix pack, DBMS. */
	async serverInfo() { throw new Error(`${this.constructor.name} does not implement serverInfo()`); }

	/** Optional features the server has, by TE feature keyword (menus test with requires.feature). */
	async features() { return {}; }

	async close() {
		if (this.#closed) return;
		this.#closed = true;
		await this.disconnect();
	}

	#assertOpen() {
		if (this.#closed) throw new DatabaseError('Connection is closed', '08003');
	}

	/** Quotes an SQL identifier for statements built here (schema names). */
	static quoteIdentifier(name) { return `"${String(name).replaceAll('"', '""')}"`; }

	// ---- hooks for subclasses -------------------------------------------------------------

	/** @returns {Promise<import('./ResultCursor.js').ResultCursor>} */
	async run(_sql, _parameters) { throw new Error(`${this.constructor.name} does not implement run()`); }
	async changeAutoCommit(_on) { throw new Error(`${this.constructor.name} does not implement changeAutoCommit()`); }
	async endUnitOfWork(_commit) { throw new Error(`${this.constructor.name} does not implement endUnitOfWork()`); }
	async changeSchema(_schema) { throw new Error(`${this.constructor.name} does not implement changeSchema()`); }
	async disconnect() {}
}
