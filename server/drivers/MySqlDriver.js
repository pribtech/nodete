import { DatabaseDriver } from './DatabaseDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { DatabaseError } from './DatabaseError.js';
import { ResultCursor } from './ResultCursor.js';
import { Placeholders } from './Placeholders.js';

/** Values reach the front end as the server's text, as PHP's mysqli returned them. */
const AS_TEXT = (field) => field.string();

/**
 * MySQL and MariaDB through the mysql2 package, which speaks their protocol in JavaScript
 * (PHP DBConnection_MYSQL). A blank host and port mean this machine and port 3306.
 */
export class MySqlDriver extends DatabaseDriver {
	static DEFAULT_PORT = 3306;

	get id() { return 'MYSQL'; }
	get moduleName() { return 'mysql2'; }

	async open(spec) {
		const mysql = this.module;
		const connection = mysql.createConnection({
			host: spec.hostname || 'localhost',
			port: Number(spec.portnumber) || MySqlDriver.DEFAULT_PORT,
			user: spec.username,
			password: spec.password,
			database: spec.database,
			multipleStatements: false,
			supportBigNumbers: true,
			bigNumberStrings: true,
			dateStrings: true,
		});
		connection.on('error', () => {}); // a lost connection is reported by the next statement
		await new Promise((resolve, reject) => connection.connect((error) => (error ? reject(error) : resolve())));
		return new MySqlConnection(spec, connection, mysql);
	}
}

class MySqlConnection extends DatabaseConnection {
	#connection;
	#mysql;
	#typeNames;

	constructor(spec, connection, mysql) {
		super(spec);
		this.#connection = connection;
		this.#mysql = mysql;
		this.#typeNames = new Map(Object.entries(mysql.Types).map(([name, id]) => [id, name.toLowerCase()]));
	}

	get DBMS() { return 'MYSQL'; }

	/**
	 * Bind values are written into the SQL escaped by mysql2 (as its own query() does), but
	 * with a scanner that knows MySQL quoting, so a ? inside a string is left alone.
	 */
	async run(sql, parameters) {
		const text = parameters.length ? Placeholders.MYSQL.inline(sql, parameters.map((p) => p.value), (value) => this.#mysql.escape(value)) : sql;
		const query = this.#connection.query({ sql: text, rowsAsArray: true, typeCast: AS_TEXT });
		return MySqlCursor.open(this.#connection, query, (type) => this.#typeNames.get(type) ?? String(type));
	}

	/** Runs a statement and returns its rows as arrays of text. */
	async #rows(sql) {
		return new Promise((resolve, reject) => {
			this.#connection.query({ sql, rowsAsArray: true, typeCast: AS_TEXT }, (error, rows) => (error ? reject(error) : resolve(rows)));
		});
	}

	async changeAutoCommit(on) { await this.#rows(`SET autocommit = ${on ? 1 : 0}`); }

	async endUnitOfWork(commit) { await this.#rows(commit ? 'COMMIT' : 'ROLLBACK'); }

	async changeSchema(schema) { await this.#rows(`USE \`${String(schema).replaceAll('`', '``')}\``); }

	async serverInfo() {
		const [[version]] = await this.#rows('SELECT VERSION()');
		const [major = 0, minor = 0, patch = 0] = String(version).split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
		return { dataServerName: /mariadb/i.test(version) ? 'MariaDB' : 'MySQL', dataServerVersion: `${major}.${minor}`, dataServerFixpack: patch, DBMS: this.DBMS };
	}

	async disconnect() {
		await new Promise((resolve) => this.#connection.end(() => resolve()));
	}
}

/**
 * Rows of a running query, read as mysql2 delivers them. Reading from the server pauses
 * once a batch is waiting, so a large result is not held in memory. Rows of further result
 * sets (from a CALL) are not returned.
 */
class MySqlCursor extends ResultCursor {
	static BATCH = 100;

	#connection;
	#columns = [];
	#rows = [];
	#sets = 0;
	#ended = false;
	#paused = false;
	#discard = false;
	#error = null;
	#wake = () => {};

	constructor(connection) {
		super();
		this.#connection = connection;
	}

	/** Starts reading; resolves once the columns are known (or the statement returned no rows). */
	static open(connection, query, typeName) {
		const cursor = new MySqlCursor(connection);
		return new Promise((resolve, reject) => {
			let started = false;
			const start = () => { if (!started) { started = true; resolve(cursor); } };
			query.on('error', (error) => {
				if (started) cursor.#fail(error);
				else { started = true; reject(DatabaseError.from(error)); }
			});
			query.on('fields', (fields) => {
				if (!fields) return; // statements without rows announce no fields, then an OK packet
				if (++cursor.#sets === 1) cursor.#columns = fields.map((f) => ResultCursor.column(f.name, typeName(f.columnType), { precision: f.columnLength, scale: f.decimals }));
				start();
			});
			query.on('result', (row) => {
				if (Array.isArray(row)) cursor.#push(row);
				else start(); // the OK packet of a statement without rows
			});
			query.on('end', () => { cursor.#finish(); start(); });
		});
	}

	#push(row) {
		if (this.#sets > 1 || this.#discard) return;
		this.#rows.push(row);
		if (this.#rows.length >= MySqlCursor.BATCH && !this.#paused) {
			this.#paused = true;
			this.#connection.pause();
		}
		this.#wake();
	}

	#finish() {
		this.#ended = true;
		this.#wake();
	}

	#fail(error) {
		this.#error = DatabaseError.from(error);
		this.#wake();
	}

	#resume() {
		if (!this.#paused) return;
		this.#paused = false;
		this.#connection.resume();
	}

	get columns() { return this.#columns; }

	async next() {
		while (this.#rows.length === 0 && !this.#ended && !this.#error) {
			const arrived = new Promise((resolve) => { this.#wake = resolve; });
			this.#resume();
			await arrived;
		}
		if (this.#error) throw this.#error;
		return this.#rows.shift() ?? null;
	}

	/** Reads and drops what the server still has to send, so the connection can run the next statement. */
	async close() {
		this.#discard = true;
		this.#rows = [];
		while (!this.#ended && !this.#error) {
			const arrived = new Promise((resolve) => { this.#wake = resolve; });
			this.#resume();
			await arrived;
		}
	}
}
