// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/**
 * Finds the "?" parameter markers in SQL text, skipping those inside string literals,
 * quoted identifiers and comments. Dialects differ in how a quote is escaped inside a
 * string, so each vendor driver picks the scanner that fits its SQL.
 */
export class Placeholders {
	/** Standard SQL: '' inside strings, "" inside identifiers, -- and block comments, PostgreSQL $tag$ strings. */
	static STANDARD = new Placeholders(/'(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/|(\$[A-Za-z_]*\$)[\s\S]*?\1|\?/g);

	/** MySQL: backslash escapes in strings, `backquoted` identifiers, # comments. */
	static MYSQL = new Placeholders(/'(?:[^'\\]|\\[\s\S]|'')*'|"(?:[^"\\]|\\[\s\S]|"")*"|`(?:[^`]|``)*`|(?:--\s|#)[^\n]*|\/\*[\s\S]*?\*\/|\?/g);

	#pattern;

	constructor(pattern) { this.#pattern = pattern; }

	/** Replaces each marker with replacement(position), counting from 1. */
	replace(sql, replacement) {
		let position = 0;
		return sql.replace(this.#pattern, (match) => (match === '?' ? replacement(++position) : match));
	}

	/** Writes the values into the SQL as literals made by literal(value). */
	inline(sql, values, literal) {
		return this.replace(sql, (position) => (position <= values.length ? literal(values[position - 1]) : '?'));
	}
}
