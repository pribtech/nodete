// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/**
 * PHP value conversions the builders need so their JSON matches the PHP version's.
 * Kept in one place so they can be dropped once the front end no longer relies on them.
 */
export class PhpCompat {
	static #lastUniqueId = 0;

	/** floatval(): leading number of a string, else 0. */
	static floatval(value) {
		const number = Number.parseFloat(String(value ?? '').trim());
		return Number.isFinite(number) ? number : 0;
	}

	/** intval(): leading integer of a string, else 0. */
	static intval(value) {
		if (typeof value === 'number') return Math.trunc(value);
		const number = Number.parseInt(String(value ?? '').trim(), 10);
		return Number.isFinite(number) ? number : 0;
	}

	/** strtolower() that, like PHP, turns null into "". */
	static lower(value) { return String(value ?? '').toLowerCase(); }

	/**
	 * A PHP associative array json_encode()s as [] when empty and as an object otherwise.
	 * Use for maps the front end receives in that shape.
	 */
	static assoc(object) { return Object.keys(object).length === 0 ? [] : object; }

	/**
	 * json_encode() of a PHP array: a list when its keys are 0, 1, 2... in order, otherwise an object.
	 * @param {[string|number, any][]} entries
	 */
	static array(entries) {
		return entries.every(([key], i) => String(key) === String(i)) ? entries.map(([, value]) => value) : Object.fromEntries(entries);
	}

	/** ksort(): keys in PHP order, numbers numerically before other keys. */
	static ksort(object) {
		const numeric = (key) => /^-?\d+$/.test(key);
		return Object.entries(object).sort(([a], [b]) => (numeric(a) && numeric(b) ? Number(a) - Number(b) : numeric(a) ? -1 : numeric(b) ? 1 : a < b ? -1 : a > b ? 1 : 0));
	}

	/** PHP loose `$value == null`: true for null, undefined, "", false, 0 and empty arrays. */
	static isEmpty(value) {
		return value === null || value === undefined || value === '' || value === false || value === 0
			|| (Array.isArray(value) && value.length === 0);
	}

	/** uniqid(): 13 hex characters from the current time, unique within this process. */
	static uniqid() {
		const micro = Math.max(Date.now() * 1000, PhpCompat.#lastUniqueId + 1);
		PhpCompat.#lastUniqueId = micro;
		return Math.floor(micro / 1e6).toString(16).padStart(8, '0') + (micro % 1e6).toString(16).padStart(5, '0');
	}
}
