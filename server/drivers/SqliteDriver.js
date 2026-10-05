// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { DatabaseDriver } from './DatabaseDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { DatabaseError } from './DatabaseError.js';
import { ResultCursor, ArrayCursor } from './ResultCursor.js';

/**
 * SQLite through Node.js's built-in node:sqlite (Node 22.13 or later). The database name is
 * a file in the data folder (DatabaseFiles); host, port, user and password are not used.
 * node:sqlite runs statements synchronously, which suits local files of modest size.
 */
export class SqliteDriver extends DatabaseDriver {
	#files;

	/** @param {{files: import('./DatabaseFiles.js').DatabaseFiles}} options */
	constructor({ files, ...options }) {
		super(options);
		this.#files = files;
	}

	get id() { return 'SQLite'; }
	get moduleName() { return 'node:sqlite'; }
	get installAdvice() { return `node:sqlite needs Node.js 22.13 or later (this is ${process.version})`; }

	/** SQLite has no users: only the database file name is needed. */
	validate(spec) { return String(spec.database).trim() === '' ? 'No database specified!' : null; }

	async open(spec) {
		const { DatabaseSync } = this.module;
		try {
			return new SqliteConnection(spec, new DatabaseSync(this.#files.resolve(spec.database)));
		} catch (error) {
			throw SqliteConnection.error(error);
		}
	}
}

class SqliteConnection extends DatabaseConnection {
	#database;

	constructor(spec, database) {
		super(spec);
		this.#database = database;
	}

	get DBMS() { return 'SQLite'; }

	/** node:sqlite errors carry SQLite's message in errstr and no SQLSTATE. */
	static error(error) {
		return new DatabaseError(error.errstr && !error.message.includes(error.errstr) ? `${error.errstr}: ${error.message}` : error.message, undefined, { cause: error });
	}

	/** A value as the front end receives it: text, as the other drivers send; BLOBs as Buffers. */
	static text(value, type) {
		if (value === null || value === undefined) return null;
		if (value instanceof Uint8Array) return /blob/i.test(type) ? Buffer.from(value) : Buffer.from(value).toString('hex');
		return String(value);
	}

	async run(sql, parameters) {
		try {
			const statement = this.#database.prepare(sql);
			const values = parameters.map((p) => p.value ?? null);
			const columns = statement.columns().map((c) => ResultCursor.column(c.name, c.type ?? ''));
			if (columns.length === 0) {
				statement.run(...values);
				return new ArrayCursor([]);
			}
			statement.setReturnArrays(true);
			return new SqliteCursor(columns, statement.iterate(...values));
		} catch (error) {
			throw SqliteConnection.error(error);
		}
	}

	async changeAutoCommit(on) { this.#database.exec(on ? 'COMMIT' : 'BEGIN'); }

	async endUnitOfWork(commit) {
		this.#database.exec(commit ? 'COMMIT' : 'ROLLBACK');
		this.#database.exec('BEGIN');
	}

	async changeSchema(schema) {
		throw new DatabaseError(`SQLite has no schemas to switch to ("${schema}")`);
	}

	async serverInfo() {
		const version = this.#database.prepare('select sqlite_version() v').get().v;
		const [major = 0, minor = 0, patch = 0] = String(version).split('.').map(Number);
		return { dataServerName: 'SQLite', dataServerVersion: `${major}.${minor}`, dataServerFixpack: patch, DBMS: this.DBMS };
	}

	async disconnect() { this.#database.close(); }
}

/** Rows read one at a time from a node:sqlite statement iterator. */
class SqliteCursor extends ResultCursor {
	#columns;
	#iterator;

	constructor(columns, iterator) {
		super();
		this.#columns = columns;
		this.#iterator = iterator;
	}

	get columns() { return this.#columns; }

	async next() {
		let step;
		try {
			step = this.#iterator.next();
		} catch (error) {
			throw SqliteConnection.error(error);
		}
		if (step.done) return null;
		return step.value.map((value, i) => SqliteConnection.text(value, this.#columns[i].type));
	}

	async close() { this.#iterator.return?.(); }
}
