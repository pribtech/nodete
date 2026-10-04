import { BindParameter } from '../drivers/BindParameter.js';

/**
 * The SQL of one statement as the front end sends it, before it reaches the database:
 *  - "?name?" is replaced by the text of parameter[name] (a template substitution)
 *  - "?!name=x&dataType=int?" marks a bind parameter, replaced by the DBMS's marker
 */
export class SqlText {
	static #BIND_MARKER = /\?!(?:\w+=[^?&]*&?)*\?/g;

	#text;

	constructor(text) { this.#text = String(text ?? '').trim(); }

	get text() { return this.#text; }

	/** Replaces each ?key? with its value. */
	substitute(values) {
		if (!values || typeof values !== 'object') return this;
		let text = this.#text;
		for (const [key, value] of Object.entries(values)) text = text.replaceAll(`?${key}?`, String(value ?? ''));
		return new SqlText(text);
	}

	/**
	 * Turns ?!...? markers into bind parameters. A marker without value= takes the request
	 * parameter of its name.
	 * @param {string} DBMS decides the marker written in their place
	 * @param {(name: string) => any} requestValue
	 * @returns {{sql: SqlText, parameters: object}} parameters keyed 1, 2, ... as the front end would send them
	 */
	extractBindMarkers(DBMS, requestValue) {
		const parameters = {};
		let position = 0;
		const text = this.#text.replace(SqlText.#BIND_MARKER, (marker) => {
			position++;
			const options = Object.fromEntries(new URLSearchParams(marker.slice(2, -1)));
			const name = /^[a-zA-Z0-9_]+$/.test(options.name ?? '') ? options.name : `p${position}`;
			parameters[position] = { ...options, name, value: options.value ?? requestValue(name) };
			return SqlText.#placeholder(DBMS, name);
		});
		return { sql: new SqlText(text), parameters };
	}

	static #placeholder(DBMS, name) {
		switch (DBMS) {
			case 'ORACLE': return `:${name} `;
			case 'ssh': return `\${${name}}`;
			case 'MQ': return ' ';
			default: return '?';
		}
	}

	/**
	 * Values of "TE_INLINE_BIND" parameters come from an earlier statement's result:
	 * "statement.resultSet.row.column".
	 */
	static resolveInlineBinds(parameters, earlierResults) {
		if (!earlierResults?.length) return parameters;
		const resolved = {};
		for (const [key, options] of Object.entries(parameters)) {
			if (String(options?.type ?? '').toUpperCase() !== 'TE_INLINE_BIND') { resolved[key] = options; continue; }
			const [statement, set, row, column] = String(options.value ?? '').split('.');
			const value = earlierResults[statement]?.resultSet?.[set]?.data?.[row]?.[column];
			resolved[key] = { ...options, type: 'DB2_PARAM_IN', value: value ?? null };
		}
		return resolved;
	}

	/** Bind parameters in position order. */
	static bindParameters(parameters) { return BindParameter.listFrom(parameters); }
}
