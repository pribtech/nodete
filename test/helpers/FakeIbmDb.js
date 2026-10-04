/**
 * Stand-in for the ibm_db package, following its documented promise API: open(connStr)
 * resolves a Database; queryResult(sql, params) resolves [ODBCResult, outparams]. Every
 * call is recorded so tests can check what the DB2 driver asked for.
 */
export class FakeIbmDb {
	calls = [];
	/** (sql, params) => {columns?, rows?, sets?, outValues?, error?}: the database's answer to a statement */
	answer = () => ({});
	info = { 17: 'DB2/LINUXX8664', 18: '11.05.0900' };
	failOpen = null;

	open = async (connectionString) => {
		this.calls.push(['open', connectionString]);
		if (this.failOpen) throw Object.assign(new Error(this.failOpen), { sqlstate: '08001' });
		return new FakeDatabase(this);
	};
}

class FakeDatabase {
	#fake;

	constructor(fake) { this.#fake = fake; }

	#record(...call) { this.#fake.calls.push(call); }

	async queryResult(sql, params) {
		this.#record('queryResult', sql, params);
		const answer = this.#fake.answer(sql, params) ?? {};
		if (answer.error) throw Object.assign(new Error(answer.error), { sqlstate: answer.sqlstate ?? '42601' });
		const sets = answer.sets ?? [{ columns: answer.columns ?? [], rows: answer.rows ?? [] }];
		return [new FakeResult(sets, (...call) => this.#record(...call)), answer.outValues];
	}

	async setAttr(attribute, value) { this.#record('setAttr', attribute, value); return true; }
	async endTransaction(rollback) { this.#record('endTransaction', rollback); return true; }
	async getInfo(type) { this.#record('getInfo', type); return this.#fake.info[type]; }
	async close() { this.#record('close'); return true; }
}

class FakeResult {
	#sets;
	#set = 0;
	#row = 0;
	#record;

	constructor(sets, record) {
		this.#sets = sets;
		this.#record = record;
	}

	getColumnMetadataSync() {
		return this.#sets[this.#set].columns.map(([name, type, precision = 10, scale = 0]) => ({
			SQL_DESC_NAME: name, SQL_DESC_TYPE_NAME: type, SQL_DESC_PRECISION: precision, SQL_DESC_SCALE: scale,
			SQL_DESC_LENGTH: precision, SQL_DESC_DISPLAY_SIZE: precision + 1,
		}));
	}

	async fetch(option) {
		if (option?.fetchMode !== 3) throw new Error('driver must fetch in array mode');
		return this.#sets[this.#set].rows[this.#row++] ?? null;
	}

	moreResultsSync() {
		if (this.#set + 1 >= this.#sets.length) return false;
		this.#set++;
		this.#row = 0;
		return true;
	}

	closeSync() { this.#record('closeResult'); }
}
