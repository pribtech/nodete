// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/**
 * How column values are returned: large objects and XML are left out unless asked for,
 * and then sent inline or base64 encoded (the display* options of executeSQL).
 */
export class ResultFormatter {
	#show;

	/** @param {{displayXML, displayXMLinline, displayCLOB, displayCLOBinline, displayBLOB, displayDBCLOB}} options booleans */
	constructor(options = {}) {
		this.#show = {
			xml: options.displayXML ? (options.displayXMLinline ? 'inline' : 'base64') : 'none',
			clob: options.displayCLOB ? (options.displayCLOBinline ? 'inline' : 'base64') : 'none',
			blob: options.displayBLOB ? 'base64' : 'none',
			dbclob: options.displayDBCLOB ? 'base64' : 'none',
		};
	}

	/** Values of one row, per the column types. */
	row(values, types) { return values.map((value, i) => this.#value(value, types[i])); }

	#value(value, type) {
		const how = this.#show[type];
		if (how === undefined) return value;
		if (how === 'none' || value === null || value === undefined) return '';
		return how === 'inline' ? String(value) : (Buffer.isBuffer(value) ? value : Buffer.from(String(value))).toString('base64');
	}
}
