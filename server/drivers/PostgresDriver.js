import { DatabaseDriver } from './DatabaseDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { Placeholders } from './Placeholders.js';
import { ResultCursor, ArrayCursor } from './ResultCursor.js';

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
		const client = new this.module.Client(this.clientOptions(spec));
		// a connection lost between requests is reported by the next statement; unhandled, the event would end the process
		client.on('error', () => {});
		await client.connect();
		return this.createConnection(spec, client);
	}

	/** pg Client settings for a connection; without host and port, pg's defaults (local server) apply. */
	clientOptions(spec) {
		return {
			database: spec.database,
			user: spec.username,
			password: spec.password,
			...(spec.isCataloged ? {} : { host: spec.hostname, port: Number(spec.portnumber) }),
			application_name: 'Technology Explorer',
		};
	}

	/** The connection object for an open pg client; subclasses for servers that speak the PostgreSQL protocol return their own. */
	createConnection(spec, client) {
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

	/** TE SQL marks parameters with "?" (the DB2 style); PostgreSQL numbers them $1, $2... */
	static numberPlaceholders(sql) {
		return Placeholders.STANDARD.replace(sql, (position) => `$${position}`);
	}

	async run(sql, parameters) {
		if (parameters.length) sql = PostgresConnection.numberPlaceholders(sql);
		const cursor = this.#client.query(new this.#Cursor(sql, parameters.map((p) => p.value), { rowMode: 'array', types: AS_TEXT }));
		return PostgresCursor.open(cursor, (oid) => this.typeName(oid));
	}

	/** Runs a statement outside the cursor machinery and returns its rows as objects of text values. */
	async query(text) {
		return (await this.#client.query({ text, types: AS_TEXT })).rows;
	}

	/**
	 * Runs SQL text through the simple query protocol and returns every result set read into
	 * memory, as an ArrayCursor. For servers whose extended protocol support is incomplete.
	 */
	async simpleQuery(text) {
		const results = [await this.#client.query({ text, rowMode: 'array', types: AS_TEXT })].flat();
		return new ArrayCursor(results.map((result) => ({
			columns: (result.fields ?? []).map((field) => ResultCursor.column(field.name, this.typeName(field.dataTypeID))),
			rows: result.rows ?? [],
		})));
	}

	/** PostgreSQL type name of a type id, e.g. 23 is int4. */
	typeName(oid) { return this.#typeNames.get(oid) ?? String(oid); }

	async changeAutoCommit(on) { await this.#client.query(on ? 'COMMIT' : 'BEGIN'); }

	async endUnitOfWork(commit) {
		await this.#client.query(commit ? 'COMMIT' : 'ROLLBACK');
		await this.#client.query('BEGIN');
	}

	async changeSchema(schema) {
		await this.query(`SET search_path TO ${DatabaseConnection.quoteIdentifier(schema)}, public`);
	}

	async serverInfo() {
		const [row] = await this.query('SELECT current_setting(\'server_version_num\')::int AS v');
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
