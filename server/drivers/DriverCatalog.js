import { Db2Driver } from './Db2Driver.js';
import { PostgresDriver } from './PostgresDriver.js';
import { DatabaseError } from './DatabaseError.js';

/**
 * The database drivers the Node.js server knows, in the order the login form lists them.
 * Replaces the PHP DBConnection_*.php scan. Drivers still to be ported are listed so the
 * welcome page can say so; those that only worked through the PHP-Java bridge (Derby,
 * Hadoop, JDBC_DB2, MQ, JSON_NOSQL_DB2) are not carried over.
 */
const NOT_YET_PORTED = Object.freeze([
	{ id: 'MYSQL', moduleName: 'mysql2' },
	{ id: 'ODBC_SolidDB', moduleName: 'odbc' },
	{ id: 'ORACLE', moduleName: 'oracledb' },
	{ id: 'SSH', moduleName: 'ssh2' },
]);

export class DriverCatalog {
	#drivers;

	/** @param {import('./DatabaseDriver.js').DatabaseDriver[]} drivers */
	constructor(drivers = DriverCatalog.standardDrivers()) {
		this.#drivers = new Map(drivers.map((driver) => [driver.id, driver]));
	}

	static standardDrivers(options = {}) { return [new Db2Driver(options), new PostgresDriver(options)]; }

	/** The driver called id; throws when it is unknown or its npm package is missing. */
	driver(id) {
		const driver = this.#drivers.get(id);
		if (!driver) throw new DatabaseError(`Connect driver ${id} not found`);
		if (!driver.isInstalled) throw new DatabaseError(`Connect driver ${id} needs npm package ${driver.moduleName}, which is not installed`);
		return driver;
	}

	isAvailable(id) { return this.#drivers.get(id)?.isInstalled === true; }

	/** Status of every driver: level I (ready), W (not ported) or E (package missing), as the welcome page lists them. */
	status() {
		const ported = [...this.#drivers.values()].map((driver) => ({
			name: driver.id, module: driver.moduleName, isDefault: driver.isDefault,
			...(driver.isInstalled ? { level: 'I', message: 'OK' } : { level: 'E', message: `npm package ${driver.moduleName} not installed (run: npm install ${driver.moduleName})` }),
		}));
		const pending = NOT_YET_PORTED.map(({ id, moduleName }) => ({ name: id, module: moduleName, isDefault: false, level: 'W', message: 'Not yet ported to Node.js' }));
		return [...ported, ...pending].sort((a, b) => a.name.localeCompare(b.name));
	}

	/** Drivers that can be used now. */
	available() { return [...this.#drivers.values()].filter((driver) => driver.isInstalled).sort((a, b) => a.id.localeCompare(b.id)); }
}
