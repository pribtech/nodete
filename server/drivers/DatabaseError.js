/** A failure reported by a database, carrying its SQLSTATE (99999 when the driver gave none). */
export class DatabaseError extends Error {
	static UNKNOWN_STATE = '99999';

	#sqlstate;

	constructor(message, sqlstate = DatabaseError.UNKNOWN_STATE, options = undefined) {
		super(message, options);
		this.name = 'DatabaseError';
		this.#sqlstate = sqlstate || DatabaseError.UNKNOWN_STATE;
	}

	get sqlstate() { return this.#sqlstate; }

	/** Wraps any error a driver module throws; its SQLSTATE is read from `sqlstate` (ibm_db) or `code` (pg). */
	static from(error) {
		if (error instanceof DatabaseError) return error;
		const state = error?.sqlstate ?? (/^[0-9A-Z]{5}$/.test(error?.code ?? '') ? error.code : undefined);
		return new DatabaseError(error?.message ?? String(error), state, { cause: error });
	}
}
