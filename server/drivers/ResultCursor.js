/**
 * The rows produced by one executed statement, read forwards, possibly over several
 * result sets (stored procedure calls). Subclasses wrap a driver's result object.
 */
export class ResultCursor {
	/** Column descriptions of the current result set; [] when it returns no rows. */
	get columns() { throw new Error(`${this.constructor.name} does not implement columns`); }

	/** Next row of the current result set as an array of column values, or null at the end. */
	async next() { throw new Error(`${this.constructor.name} does not implement next()`); }

	/** Moves to the next result set; false when there is none. */
	async nextResultSet() { return false; }

	/** Values of OUT and INOUT parameters, by parameter name. */
	get outParameters() { return {}; }

	async close() {}

	/** A column description in the shape the front end expects. */
	static column(name, type, { precision = -1, scale = -1, width = -1, displaySize = -1 } = {}) {
		return { name, type: String(type).toLowerCase(), precision, scale, width, displaySize };
	}
}

/** A cursor over rows already in memory. */
export class ArrayCursor extends ResultCursor {
	#sets;
	#set = 0;
	#row = 0;
	#outParameters;

	/** @param {{columns: object[], rows: any[][]}[]} sets */
	constructor(sets = [], outParameters = {}) {
		super();
		this.#sets = sets.length ? sets : [{ columns: [], rows: [] }];
		this.#outParameters = outParameters;
	}

	get columns() { return this.#sets[this.#set].columns; }

	async next() { return this.#sets[this.#set].rows[this.#row++] ?? null; }

	async nextResultSet() {
		if (this.#set + 1 >= this.#sets.length) return false;
		this.#set++;
		this.#row = 0;
		return true;
	}

	get outParameters() { return this.#outParameters; }
}
