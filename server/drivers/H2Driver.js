// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { PostgresDriver, PostgresConnection } from './PostgresDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { Placeholders } from './Placeholders.js';

/**
 * Apache H2 through its PostgreSQL protocol server, using the pg package.
 *
 * H2 is a Java database, so Node.js cannot load it directly. Start H2 with its PostgreSQL
 * listener, for example
 *   java -cp h2.jar org.h2.tools.Server -pg -pgAllowOthers -baseDir ./data
 * and log on with the database name, user and password. A blank host means this machine and
 * a blank port H2's default, 5435.
 *
 * H2's PostgreSQL server only partly supports the extended query protocol: after an SQL error
 * the connection is left unusable, and cursors are not supported. Statements therefore go
 * through the simple query protocol, with bind values written into the SQL as literals, and
 * results are read whole.
 */
export class H2Driver extends PostgresDriver {
	static DEFAULT_PORT = '5435';

	get id() { return 'H2'; }

	clientOptions(spec) {
		return super.clientOptions(spec.with({
			hostname: spec.hostname || 'localhost',
			portnumber: spec.portnumber || H2Driver.DEFAULT_PORT,
		}));
	}

	createConnection(spec, client) {
		return new H2Connection(spec, client, this.cursorModule, this.module.types.builtins);
	}
}

export class H2Connection extends PostgresConnection {
	get DBMS() { return 'H2'; }

	async run(sql, parameters) {
		const values = parameters.map((p) => H2Connection.literal(p.value));
		return this.simpleQuery(parameters.length ? Placeholders.STANDARD.inline(sql, values, (value) => value) : sql);
	}

	/** An SQL literal for a bind value: numbers as they are, text quoted with ' doubled (H2 gives \ no meaning). */
	static literal(value) {
		if (value === null || value === undefined) return 'NULL';
		if (typeof value === 'number' && Number.isFinite(value)) return String(value);
		return `'${String(value).replaceAll("'", "''")}'`;
	}

	async changeSchema(schema) {
		await this.query(`SET SCHEMA ${DatabaseConnection.quoteIdentifier(schema)}`);
	}

	async serverInfo() {
		const [row] = await this.query('SELECT H2VERSION() AS v');
		const [major = 0, minor = 0, build = 0] = String(row.v).split('.').map((n) => Number.parseInt(n, 10) || 0);
		return { dataServerName: 'H2', dataServerVersion: `${major}.${minor}`, dataServerFixpack: build, DBMS: this.DBMS };
	}
}
