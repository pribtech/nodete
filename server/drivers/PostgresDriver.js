import { DatabaseDriver } from './DatabaseDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { ResultCursor } from './ResultCursor.js';

/** Values are passed to the front end as the server's text, as PHP's pg_* functions did. */
const AS_TEXT = Object.freeze({ getTypeParser: () => (value) => value });

/** PostgreSQL through the pg package (PHP DBConnection_PostgreSQL). */
export class PostgresDriver extends DatabaseDriver {
	#cursorModule;

	get id() { return 'PostgreSQL'; }
	get moduleName() { return 'pg'; }

	/** pg-cursor, which reads results in batches instead of all at once. */
	get cursorModule() { return (this.#cursorModule ??= this.load('pg-cursor')); }

	async open(spec) {
		const { Client } = this.module;
		const client = new Client({
			database: spec.database,
			user: spec.username,
			password: spec.password,
			...(spec.isCataloged ? {} : { host: spec.hostname, port: Number(spec.portnumber) }),
			application_name: 'Technology Explorer',
		});
		await client.connect();
		return new PostgresConnection(spec, client, this.cursorModule, this.module.types.builtins);
	}
}

export class PostgresConnection extends DatabaseConnection {
	#client;
	#Cursor;
	#typeNames;

	constructor(spec, client, Cursor, builtins) {
		super(spec);
		this.#client = client;
		this.#Cursor = Cursor;
		this.#typeNames = new Map(Object.entries(builtins).map(([name, oid]) => [oid, name.toLowerCase()]));
	}

	get DBMS() { return 'postgreSQL'; }

	/**
	 * TE SQL marks parameters with "?" (the DB2 style); PostgreSQL numbers them $1, $2...
	 * Question marks inside quotes, comments and dollar-quoted strings are left alone.
	 */
	static numberPlaceholders(sql) {
		let position = 0;
		return sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/|(\$[A-Za-z_]*\$)[\s\S]*?\1|\?/g,
			(match) => (match === '?' ? `$${++position}` : match));
	}

	async run(sql, parameters) {
		if (parameters.length) sql = PostgresConnection.numberPlaceholders(sql);
		const cursor = this.#client.query(new this.#Cursor(sql, parameters.map((p) => p.value), { rowMode: 'array', types: AS_TEXT }));
		return PostgresCursor.open(cursor, (oid) => this.#typeNames.get(oid) ?? String(oid));
	}

	async changeAutoCommit(on) { await this.#client.query(on ? 'COMMIT' : 'BEGIN'); }

	async endUnitOfWork(commit) {
		await this.#client.query(commit ? 'COMMIT' : 'ROLLBACK');
		await this.#client.query('BEGIN');
	}

	async changeSchema(schema) {
		await this.#client.query(`SET search_path TO ${DatabaseConnection.quoteIdentifier(schema)}, public`);
	}

	async serverInfo() {
		const { rows: [row] } = await this.#client.query({ text: 'SELECT current_setting(\'server_version_num\')::int AS v', types: AS_TEXT });
		const number = Number(row.v);
		const major = Math.floor(number / 10000);
		const minor = major >= 10 ? number % 10000 : Math.floor(number / 100) % 100;
		return { dataServerName: 'PostgreSQL', dataServerVersion: `${major}.${minor}`, dataServerFixpack: major >= 10 ? 0 : number % 100, DBMS: this.DBMS };
	}

	async disconnect() { await this.#client.end(); }
}

/** Reads a pg-cursor in batches; PostgreSQL statements return a single result set. */
class PostgresCursor extends ResultCursor {
	static BATCH = 100;

	#cursor;
	#columns;
	#rows;
	#done;

	constructor(cursor, columns, rows, done) {
		super();
		this.#cursor = cursor;
		this.#columns = columns;
		this.#rows = rows;
		this.#done = done;
	}

	/** Reads the first batch, which also gives the column descriptions. */
	static async open(cursor, typeName) {
		const { rows, result } = await PostgresCursor.#read(cursor);
		const columns = (result?.fields ?? []).map((field) => ResultCursor.column(field.name, typeName(field.dataTypeID)));
		return new PostgresCursor(cursor, columns, rows, rows.length < PostgresCursor.BATCH);
	}

	static #read(cursor) {
		return new Promise((resolve, reject) => {
			cursor.read(PostgresCursor.BATCH, (error, rows, result) => (error ? reject(error) : resolve({ rows, result })));
		});
	}

	get columns() { return this.#columns; }

	async next() {
		if (this.#rows.length === 0 && !this.#done) {
			const { rows } = await PostgresCursor.#read(this.#cursor);
			this.#rows = rows;
			this.#done = rows.length < PostgresCursor.BATCH;
		}
		return this.#rows.shift() ?? null;
	}

	async close() { await this.#cursor.close(); }
}
