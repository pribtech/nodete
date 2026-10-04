import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * The database drivers the Node.js server supports, each backed by an npm package.
 * Replaces the PHP DBConnection_*.php scan. Drivers that only worked through the
 * PHP-Java bridge (Derby, Hadoop, JDBC_DB2, MQ, JSON_NOSQL_DB2) are not carried over.
 */
const DRIVERS = Object.freeze([
	{ name: 'IBM_DB2', module: 'ibm_db', isDefault: true },
	{ name: 'MYSQL', module: 'mysql2' },
	{ name: 'ODBC_SolidDB', module: 'odbc' },
	{ name: 'ORACLE', module: 'oracledb' },
	{ name: 'PostgreSQL', module: 'pg' },
	{ name: 'SSH', module: 'ssh2' },
]);

export class DriverCatalog {
	#implemented;

	/** @param {Set<string>} implemented names of drivers whose connection classes exist (step 2 onwards) */
	constructor(implemented = new Set()) {
		this.#implemented = implemented;
	}

	static isInstalled(module) {
		try { require.resolve(module); return true; } catch { return false; }
	}

	/** Status of every driver: level I (ready), W or E, and a message, as the welcome page lists them. */
	status() {
		return DRIVERS.map(({ name, module, isDefault = false }) => {
			if (!this.#implemented.has(name)) return { name, module, isDefault, level: 'W', message: 'Not yet ported to Node.js' };
			if (!DriverCatalog.isInstalled(module)) return { name, module, isDefault, level: 'E', message: `npm package ${module} not installed` };
			return { name, module, isDefault, level: 'I', message: 'OK' };
		});
	}

	/** Drivers that can be used now. */
	available() { return this.status().filter((driver) => driver.level === 'I'); }
}
