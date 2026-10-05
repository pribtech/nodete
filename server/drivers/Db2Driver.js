import { DatabaseDriver } from './DatabaseDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { ResultCursor } from './ResultCursor.js';

/** CLI constants (ibm_db lib/climacros.js). */
const CLI = Object.freeze({ SQL_DBMS_NAME: 17, SQL_DBMS_VER: 18, SQL_ATTR_AUTOCOMMIT: 102, FETCH_ARRAY: 3 });

/** TE feature keywords and the SQL that finds them on a DB2 server (PHP Connection_IBM_DB2::$features). */
const FEATURE_QUERIES = Object.freeze({
	monitor: "SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'mon_act_metrics' and value <> ''",
	baseMonitors: "SELECT 1 FROM (values(1)) where not exists(SELECT 1 FROM SYSIBMADM.DBMCFG  WHERE NAME LIKE 'dft_mon%' and Value='OFF')",
	hadr: "SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'hadr_local_host' and value <> ''",
	asn: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'ASN'",
	mq: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'DB2MQ'    AND TABNAME = 'MQHOST'",
	optProfile: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'SYSTOOLS' AND TABNAME = 'OPT_PROFILE'",
	TEMon: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 's#db2mc'  AND TABNAME = 'MONITOR_CONTROL'",
});
const LICENSED_FEATURES = "SELECT FEATURE_NAME,FEATURE_FULLNAME FROM SYSIBMADM.ENV_FEATURE_INFO where LICENSE_INSTALLED='Y' FOR READ ONLY";

/** IBM DB2 (LUW and z/OS) through the ibm_db package (PHP DBConnection_IBM_DB2). */
export class Db2Driver extends DatabaseDriver {
	get id() { return 'IBM_DB2'; }
	get moduleName() { return 'ibm_db'; }
	get isDefault() { return true; }

	/** CLI connection string: a cataloged database by name, otherwise TCP/IP to host and port. */
	static connectionString(spec) {
		const value = (text) => (/[;{}]/.test(text) || /^\s|\s$/.test(text) ? `{${String(text).replaceAll('}', '}}')}}` : text);
		const parts = [['DATABASE', spec.database]];
		if (!spec.isCataloged) parts.push(['HOSTNAME', spec.hostname], ['PORT', spec.portnumber], ['PROTOCOL', 'TCPIP']);
		parts.push(['UID', spec.username], ['PWD', spec.password]);
		return parts.map(([key, text]) => `${key}=${value(String(text))};`).join('');
	}

	async open(spec) {
		const database = await this.module.open(Db2Driver.connectionString(spec));
		return new Db2Connection(spec, database);
	}
}

class Db2Connection extends DatabaseConnection {
	#database;
	#DBMS = 'DB2';

	constructor(spec, database) {
		super(spec);
		this.#database = database;
	}

	/** DB2 for LUW, or DB2Z when the server reports itself as plain "DB2" (z/OS). */
	get DBMS() { return this.#DBMS; }

	async run(sql, parameters) {
		// OUT and INOUT only mean something for a procedure CALL; elsewhere every marker is an input
		const isCall = /^\s*CALL\b/i.test(sql);
		const [result, outValues] = await this.#database.queryResult(sql, parameters.map((p) => Db2Connection.#bind(p, isCall)));
		const outputs = isCall ? parameters.filter((p) => p.isOutput) : [];
		const outParameters = Object.fromEntries(outputs.map((p, i) => [p.name, outValues?.[i] ?? null]));
		return new Db2Cursor(result, outParameters);
	}

	static #DATA_TYPES = Object.freeze({ integer: 'INTEGER', bigint: 'BIGINT', double: 'DOUBLE', blob: 'BLOB', string: 'CHAR', null: 'CHAR' });

	/** ibm_db bind object for a parameter. */
	static #bind(parameter, isCall) {
		const direction = isCall ? parameter.direction : 'IN';
		const bind = { ParamType: { IN: 'INPUT', OUT: 'OUTPUT', INOUT: 'INOUT' }[direction], DataType: Db2Connection.#DATA_TYPES[parameter.dataType], Data: parameter.value };
		if (direction !== 'IN') bind.Length = parameter.precision ?? 32672;
		return bind;
	}

	async changeAutoCommit(on) { await this.#database.setAttr(CLI.SQL_ATTR_AUTOCOMMIT, on ? 1 : 0); }

	async endUnitOfWork(commit) {
		// endTransaction switches autocommit back on, so turn it off again for the next unit of work
		await this.#database.endTransaction(!commit);
		await this.#database.setAttr(CLI.SQL_ATTR_AUTOCOMMIT, 0);
	}

	async changeSchema(schema) {
		const name = DatabaseConnection.quoteIdentifier(schema);
		await this.rows(`SET CURRENT PATH ${name}, USER, SYSTEM PATH`);
		await this.rows(`SET CURRENT SCHEMA ${name}`);
	}

	async serverInfo() {
		const name = String(await this.#database.getInfo(CLI.SQL_DBMS_NAME)).trim();
		const [major = 0, minor = 0, fixpack = 0] = String(await this.#database.getInfo(CLI.SQL_DBMS_VER)).split('.').map((n) => Number.parseInt(n, 10) || 0);
		this.#DBMS = name === 'DB2' ? 'DB2Z' : 'DB2';
		return { dataServerName: name, dataServerVersion: `${major}.${minor}`, dataServerFixpack: fixpack, feature: [], DBMS: this.#DBMS };
	}

	/** Features present on the server, plus licensed product features by name. */
	async features() {
		const features = {};
		for (const [keyword, sql] of Object.entries(FEATURE_QUERIES)) {
			try {
				features[keyword] = (await this.rows(sql)).length > 0;
			} catch (error) {
				throw new Error(`Error Set feature ${keyword} sqlstate: ${error.sqlstate} error: ${error.message} sql: ${sql}`, { cause: error });
			}
		}
		for (const [key, fullName] of await this.rows(LICENSED_FEATURES)) features[key] = fullName;
		return features;
	}

	async disconnect() { await this.#database.close(); }
}

/** Reads an ibm_db ODBCResult row by row, across result sets. */
class Db2Cursor extends ResultCursor {
	#result;
	#columns = null;
	#outParameters;

	constructor(result, outParameters) {
		super();
		this.#result = result;
		this.#outParameters = outParameters;
	}

	get columns() {
		this.#columns ??= (this.#result?.getColumnMetadataSync() ?? []).map((c) => ResultCursor.column(c.SQL_DESC_NAME, c.SQL_DESC_TYPE_NAME, {
			precision: c.SQL_DESC_PRECISION, scale: c.SQL_DESC_SCALE, width: c.SQL_DESC_LENGTH, displaySize: c.SQL_DESC_DISPLAY_SIZE,
		}));
		return this.#columns;
	}

	async next() {
		if (!this.#result || this.columns.length === 0) return null;
		return (await this.#result.fetch({ fetchMode: CLI.FETCH_ARRAY })) ?? null;
	}

	async nextResultSet() {
		if (!this.#result?.moreResultsSync()) return false;
		this.#columns = null;
		return true;
	}

	get outParameters() { return this.#outParameters; }

	async close() { this.#result?.closeSync(); }
}
