import { DrdaDriver, DrdaDatabaseConnection } from './DrdaDriver.js';
import { DatabaseConnection } from './DatabaseConnection.js';
import { Db2Features } from './Db2Features.js';

/**
 * IBM DB2 (for Linux, UNIX and Windows; for z/OS; for i) over DRDA, in JavaScript. Uses the
 * dynamic SQL package NULLID.SYSSH200 that DB2's own drivers use; a blank port means 50000.
 */
export class Db2Driver extends DrdaDriver {
	get id() { return 'IBM_DB2'; }
	get isDefault() { return true; }
	get defaultPort() { return 50000; }
	get dialect() { return { productId: 'JCC04330', packageName: 'SYSSH200' }; }

	createConnection(spec, drda) { return new Db2Connection(spec, drda); }
}

class Db2Connection extends DrdaDatabaseConnection {
	/** DB2 looks up functions and procedures along the path as well as in the schema. */
	async changeSchema(schema) {
		const name = DatabaseConnection.quoteIdentifier(schema);
		await this.drda.executeImmediate(`SET CURRENT PATH ${name}, USER, SYSTEM PATH`);
		await this.drda.executeImmediate(`SET CURRENT SCHEMA ${name}`);
	}

	async features() { return Db2Features.read(this); }
}
