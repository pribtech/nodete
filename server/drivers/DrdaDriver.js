// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { DatabaseDriver } from './DatabaseDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { ResultCursor, ArrayCursor } from './ResultCursor.js';
import { DrdaConnection } from './drda/DrdaConnection.js';

/**
 * Databases that speak DRDA, IBM's distributed database protocol, through the JavaScript
 * client in ./drda: no native module, no Java. Vendor subclasses say how their servers
 * expect a client to identify itself and what differs in their SQL.
 */
export class DrdaDriver extends DatabaseDriver {
	constructor(options = {}) {
		super({ ...options, loadModule: () => ({}) });
	}

	get moduleName() { return 'drda'; }
	get isInstalled() { return true; }

	/** The port when the login form leaves it blank. */
	get defaultPort() { throw new Error(`${this.constructor.name} does not implement defaultPort`); }

	/** PRDID and dynamic SQL package the server expects of clients. */
	get dialect() { throw new Error(`${this.constructor.name} does not implement dialect`); }

	async open(spec) {
		const drda = await DrdaConnection.open({
			host: spec.hostname || 'localhost',
			port: Number(spec.portnumber) || this.defaultPort,
			database: spec.database,
			user: spec.username,
			password: spec.password,
			dialect: this.dialect,
		});
		return this.createConnection(spec, drda);
	}

	/** The DatabaseConnection for an open DRDA connection; subclasses add vendor behaviour. */
	createConnection(spec, drda) { return new DrdaDatabaseConnection(spec, drda); }
}

/**
 * A DRDA connection seen through the generic DatabaseConnection. DRDA has no autocommit:
 * in autocommit mode a statement is committed when it ends (a query when it is closed).
 */
export class DrdaDatabaseConnection extends DatabaseConnection {
	#drda;

	constructor(spec, drda) {
		super(spec);
		this.#drda = drda;
	}

	get drda() { return this.#drda; }

	/** The server's product: prefix (SQL: DB2 for LUW, DSN: DB2 for z/OS, QSQ: DB2 for i, CSS: Derby), version, fix pack. */
	get product() {
		const [, prefix = '', version = '00', release = '00', modification = '0'] = /^([A-Z]{3})(\d{2})(\d{2})(\d)/.exec(this.#drda.server.productId ?? '') ?? [];
		return { prefix, version: Number(version), release: Number(release), modification: Number(modification) };
	}

	get DBMS() {
		return { SQL: 'DB2', DSN: 'DB2Z', QSQ: 'DB2', CSS: 'Derby' }[this.product.prefix] ?? 'DRDA';
	}

	async run(sql, parameters) {
		const statement = await this.#drda.prepare(sql);
		if (statement.columns.length > 0) {
			let query;
			try {
				query = await this.#drda.openQuery(statement, parameters);
			} catch (error) {
				this.#drda.release(statement.section);
				throw error;
			}
			return new DrdaCursor(query, () => this.#endOfStatement());
		}
		try {
			await this.#drda.execute(statement, parameters);
			await this.#endOfStatement();
			return new ArrayCursor([]);
		} finally {
			this.#drda.release(statement.section);
		}
	}

	async #endOfStatement() {
		if (this.autoCommit) await this.#drda.commit();
	}

	async changeAutoCommit(on) { if (on) await this.#drda.commit(); }

	async endUnitOfWork(commit) {
		if (commit) await this.#drda.commit();
		else await this.#drda.rollback();
	}

	async changeSchema(schema) {
		await this.#drda.executeImmediate(`SET SCHEMA ${DatabaseConnection.quoteIdentifier(schema)}`);
	}

	async serverInfo() {
		const { version, release, modification } = this.product;
		const server = this.#drda.server;
		return {
			dataServerName: (server.className || server.productId).replace(/^Q(?=DB2)/, ''),
			dataServerVersion: `${version}.${release}`,
			dataServerFixpack: modification,
			feature: [],
			DBMS: this.DBMS,
		};
	}

	async disconnect() {
		try {
			await this.#drda.rollback();
		} finally {
			this.#drda.close();
		}
	}
}

/** Rows of a DRDA query, with column descriptions from the prepared statement. */
class DrdaCursor extends ResultCursor {
	#query;
	#columns;
	#ended;

	constructor(query, ended) {
		super();
		this.#query = query;
		this.#ended = ended;
		this.#columns = query.columns.map((c) => ResultCursor.column(c.name, c.type, { precision: c.precision, scale: c.scale, width: c.length, displaySize: c.length }));
	}

	get columns() { return this.#columns; }

	next() { return this.#query.next(); }

	async close() {
		await this.#query.close();
		await this.#ended();
	}
}
