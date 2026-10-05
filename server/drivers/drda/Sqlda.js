// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Sqlca } from './Sqlca.js';

/**
 * Column descriptions from an SQLDARD (the reply to PRPSQLSTT with RTNSQLDA): the SQLCA,
 * then for each column its SQL type, length, precision, scale and name.
 */
export class Sqlda {
	/** DB2 SQLTYPE numbers (even; odd means nullable) and their names. */
	static #TYPES = new Map([
		[384, 'date'], [388, 'time'], [392, 'timestamp'], [396, 'datalink'], [400, 'cstr'],
		[404, 'blob'], [408, 'clob'], [412, 'dbclob'], [448, 'varchar'], [452, 'char'], [456, 'long varchar'],
		[460, 'cstr'], [464, 'vargraphic'], [468, 'graphic'], [472, 'long vargraphic'], [476, 'lstr'],
		[480, 'double'], [484, 'decimal'], [488, 'numeric'], [492, 'bigint'], [496, 'integer'], [500, 'smallint'],
		[904, 'rowid'], [908, 'varbinary'], [912, 'binary'], [916, 'blob locator'], [920, 'clob locator'],
		[924, 'dbclob locator'], [960, 'blob locator'], [964, 'clob locator'], [968, 'dbclob locator'],
		[972, 'result set locator'], [988, 'xml'], [996, 'decfloat'], [2436, 'boolean'], [2448, 'timestamp with time zone'],
	]);

	/** Type name of a DB2 SQLTYPE; 480 with length 4 is REAL. */
	static typeName(sqlType, length) {
		const base = sqlType & ~1;
		if (base === 480 && length === 4) return 'real';
		return Sqlda.#TYPES.get(base) ?? `sqltype ${base}`;
	}

	/** @returns {{sqlca: Sqlca|null, columns: object[]}} */
	static read(reader) {
		const sqlca = Sqlca.read(reader);
		if (sqlca?.isError) return { sqlca, columns: [] };
		Sqlda.#skipHeader(reader);
		const count = reader.int16();
		const columns = [];
		for (let i = 0; i < count; i++) columns.push(Sqlda.#column(reader));
		return { sqlca, columns };
	}

	/** SQLDHGRP: cursor holdability and the like; not needed. */
	static #skipHeader(reader) {
		if (reader.uint8() === 0xFF) return;
		for (let i = 0; i < 6; i++) reader.int16();
		reader.vcs();
		reader.vcmOrVcs();
	}

	static #column(reader) {
		const precision = reader.int16();
		const scale = reader.int16();
		const length = Number(reader.int64());
		const sqlType = reader.int16();
		const ccsid = reader.uint16();
		let name = '';
		if (reader.uint8() !== 0xFF) { // SQLDOPTGRP
			reader.int16(); // unnamed
			name = reader.vcmOrVcs();
			reader.vcmOrVcs(); // label
			reader.vcmOrVcs(); // comments
			if (reader.uint8() !== 0xFF) { // SQLUDTGRP
				reader.int32();
				reader.vcs();
				reader.vcmOrVcs();
				reader.vcmOrVcs();
			}
			if (reader.uint8() !== 0xFF) { // SQLDXGRP
				for (let i = 0; i < 4; i++) reader.int16();
				reader.vcs();
				for (let i = 0; i < 4; i++) reader.vcmOrVcs();
			}
		}
		return { name, type: Sqlda.typeName(sqlType, length), sqlType, nullable: (sqlType & 1) === 1, length, precision, scale, ccsid };
	}
}
