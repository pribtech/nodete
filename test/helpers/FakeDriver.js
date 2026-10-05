// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { DatabaseDriver } from '../../server/drivers/DatabaseDriver.js';
import { DatabaseConnection } from '../../server/drivers/DatabaseConnection.js';
import { DatabaseError } from '../../server/drivers/DatabaseError.js';
import { ArrayCursor, ResultCursor } from '../../server/drivers/ResultCursor.js';

/**
 * An in-memory database driver: accepts the password "secret", and answers statements
 * through `answer(sql, parameters)`, which returns rows ({columns, rows}) or throws.
 * Records statements and transaction calls in `log`.
 */
export class FakeDriver extends DatabaseDriver {
	log = [];
	answer = () => ({ columns: [], rows: [] });

	constructor({ id = 'FAKE', DBMS = 'DB2' } = {}) {
		super({ loadModule: () => ({}) });
		this.fakeId = id;
		this.DBMSName = DBMS;
	}

	get id() { return this.fakeId; }
	get moduleName() { return 'fake'; }

	async open(spec) {
		this.log.push(['open', spec.name]);
		if (spec.password !== 'secret') throw new DatabaseError('password invalid', '08001');
		return new FakeConnection(spec, this);
	}
}

/** Column description helper for answers. */
export const column = (name, type = 'varchar') => ResultCursor.column(name, type);

class FakeConnection extends DatabaseConnection {
	#driver;

	constructor(spec, driver) {
		super(spec);
		this.#driver = driver;
	}

	get DBMS() { return this.#driver.DBMSName; }

	async run(sql, parameters) {
		this.#driver.log.push(['run', sql, parameters.map((p) => p.value)]);
		const answer = await this.#driver.answer(sql, parameters);
		return new ArrayCursor(answer.sets ?? [{ columns: answer.columns ?? [], rows: answer.rows ?? [] }], answer.outParameters ?? {});
	}

	async changeAutoCommit(on) { this.#driver.log.push(['autoCommit', on]); }
	async endUnitOfWork(commit) { this.#driver.log.push([commit ? 'commit' : 'rollback']); }
	async changeSchema(schema) { this.#driver.log.push(['schema', schema]); }
	async serverInfo() { return { dataServerName: 'FAKE', dataServerVersion: '11.5', dataServerFixpack: 9, DBMS: this.DBMS }; }
	async features() { return { monitor: true }; }
	async disconnect() { this.#driver.log.push(['close', this.spec.name]); }
}
