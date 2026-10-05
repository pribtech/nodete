// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { DatabaseError } from './DatabaseError.js';

/**
 * One statement parameter as the front end describes it, e.g. from "?!name=x&dataType=int?"
 * in a TE SQL definition: its name, value, data type and direction (IN, OUT, INOUT).
 */
export class BindParameter {
	static #NAME = /^[a-zA-Z0-9_]+$/;
	static #DIRECTIONS = new Map([
		['DB2_PARAM_IN', 'IN'], ['IN', 'IN'], ['TE_INLINE_BIND', 'IN'],
		['DB2_PARAM_INOUT', 'INOUT'], ['INOUT', 'INOUT'],
		['DB2_PARAM_OUT', 'OUT'], ['OUT', 'OUT'], ['', 'OUT'],
	]);
	static #TYPES = new Map([
		['smallint', 'integer'], ['int', 'integer'], ['integer', 'integer'],
		['real', 'double'], ['float', 'double'], ['double', 'double'],
		['bigint', 'bigint'], ['long', 'bigint'],
		['null', 'null'], ['blob', 'blob'],
		['string', 'string'], ['date', 'string'], ['time', 'string'], ['timestamp', 'string'],
	]);
	static #CONVERSIONS = new Set(['bin2hex', 'hex2bin', 'hex2string']);

	constructor({ position, name, value = null, dataType = 'string', direction = 'OUT', precision = null, scale = null, conversion = null }) {
		this.position = position;
		this.name = name;
		this.value = value;
		this.dataType = dataType;
		this.direction = direction;
		this.precision = precision;
		this.scale = scale;
		this.conversion = conversion;
		Object.freeze(this);
	}

	/**
	 * Builds a parameter from the front end's options, as DBStatement_IBM_DB2 did:
	 * unsafe names become p<position>, "null" means SQL NULL, numbers lose thousands separators.
	 */
	static from(position, options = {}) {
		const name = BindParameter.#NAME.test(options.name ?? '') ? options.name : `p${position}`;
		const dataType = BindParameter.#TYPES.get(String(options.dataType ?? 'string').toLowerCase());
		if (dataType === undefined) throw new DatabaseError(`Invalid data type for parameter ${position} name: ${name} data type: ${options.dataType}`);
		const rawType = options.type === undefined ? 'OUT' : (BindParameter.#NAME.test(options.type) ? String(options.type).toUpperCase() : 'DB2_PARAM_OUT');
		const direction = BindParameter.#DIRECTIONS.get(rawType);
		if (direction === undefined) throw new DatabaseError(`Invalid type for parameter ${position} name: ${name} type: ${options.type}`);
		if (options.conversion !== undefined && !BindParameter.#CONVERSIONS.has(options.conversion))
			throw new DatabaseError(`Unknown conversion ${options.conversion}`);
		const digits = (text) => (/^[0-9]+$/.test(text ?? '') ? Number(text) : null);
		return new BindParameter({
			position, name, dataType, direction,
			value: BindParameter.#convertValue(options.value, dataType),
			precision: digits(options.precision),
			scale: digits(options.scale),
			conversion: options.conversion ?? null,
		});
	}

	static #convertValue(value, dataType) {
		if (value === undefined || value === null || String(value).toLowerCase() === 'null' || dataType === 'null') return null;
		const text = String(value);
		if (text === '') return dataType === 'string' || dataType === 'blob' ? '' : null;
		switch (dataType) {
			case 'integer':
			case 'bigint': return Number.parseInt(text.replaceAll(',', ''), 10) || 0;
			case 'double': return Number.parseFloat(text.replaceAll(',', '')) || 0;
			default: return BindParameter.#decode(text);
		}
	}

	static #decode(text) {
		try { return decodeURIComponent(text); } catch { return text; }
	}

	/** Parameters in position order from the front end's {1: {...}, 2: {...}} map or array. */
	static listFrom(options) {
		if (!options) return [];
		const entries = Array.isArray(options) ? options.map((o, i) => [i + 1, o]) : Object.entries(options).map(([k, o]) => [Number(k), o]);
		return entries.filter(([, o]) => o && typeof o === 'object').sort(([a], [b]) => a - b).map(([position, o]) => BindParameter.from(position, o));
	}

	get isOutput() { return this.direction !== 'IN'; }

	/** An OUT value as returned to the front end, after the requested conversion. */
	present(value) {
		if (value === null || value === undefined) return '';
		switch (this.conversion) {
			case 'bin2hex': return Buffer.from(String(value), 'latin1').toString('hex');
			case 'hex2bin': return Buffer.from(String(value), 'hex').toString('latin1');
			case 'hex2string': return BindParameter.#html(Buffer.from(String(value), 'hex').toString('utf8').replaceAll('�', ''));
			default: return BindParameter.#html(String(value));
		}
	}

	static #html(text) {
		return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
	}
}
