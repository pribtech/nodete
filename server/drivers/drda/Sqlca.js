import { DatabaseError } from '../DatabaseError.js';

/**
 * The SQL communications area a DRDA server returns with each statement: SQLCODE, SQLSTATE,
 * message tokens and row counts. Absent (null) means success with nothing to report.
 */
export class Sqlca {
	constructor({ sqlcode, sqlstate, procedure, rowCount = 0, tokens = [], warnings = '', rdbName = '' }) {
		this.sqlcode = sqlcode;
		this.sqlstate = sqlstate;
		this.procedure = procedure;
		this.rowCount = rowCount;
		this.tokens = tokens;
		this.warnings = warnings;
		this.rdbName = rdbName;
		Object.freeze(this);
	}

	/** Reads an SQLCAGRP (DRDA SQLAM 7): null indicator, then the SQLCA; null when absent. */
	static read(reader) {
		if (reader.uint8() === 0xFF) return null;
		const sqlcode = reader.int32();
		const sqlstate = reader.text(5, 'sbc');
		const procedure = reader.text(8, 'sbc').trim();
		let rowCount = 0;
		let tokens = [];
		let warnings = '';
		let rdbName = '';
		if (reader.uint8() !== 0xFF) { // SQLCAXGRP
			const sqlerrd = Array.from({ length: 6 }, () => reader.int32());
			rowCount = sqlerrd[2];
			warnings = reader.text(11, 'sbc');
			rdbName = reader.vcs().trim();
			const mixed = reader.ld();
			const single = reader.ld();
			const message = mixed ? reader.types.decode(mixed, 'mbc') : (single ? reader.types.decode(single, 'sbc') : '');
			tokens = message === '' ? [] : message.split(/[\u0014ÿ�]/);
		}
		if (reader.uint8() !== 0xFF) throw new Error('SQLDIAGGRP diagnostics are not supported'); // never requested
		return new Sqlca({ sqlcode, sqlstate, procedure, rowCount, tokens, warnings, rdbName });
	}

	get isError() { return this.sqlcode < 0; }
	get isEndOfData() { return this.sqlcode === 100; }
	get isWarning() { return this.sqlcode > 0 && this.sqlcode !== 100; }

	/** A DatabaseError for this SQLCA, in DB2's message style. */
	toError() {
		const detail = this.tokens.filter(Boolean).join(', ');
		return new DatabaseError(`SQLCODE=${this.sqlcode}, SQLSTATE=${this.sqlstate}${detail ? `: ${detail}` : ''}`, this.sqlstate);
	}
}
