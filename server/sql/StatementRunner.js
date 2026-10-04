import { SqlText } from './SqlText.js';

/**
 * Runs one statement of an executeSQL request and describes the outcome in the shape the
 * front end reads (PHP extractResults):
 *   {STMT, TotalRunDuration, runDuration, parameters, resultSet: [{rowsReturned, data, columnsInfo, rowsInSet}],
 *    numOfResultSet, STMTError, STMTMSG, statementSucceed}
 */
export class StatementRunner {
	#connection;
	#formatter;
	#lookAhead;
	#requestValue;

	/**
	 * @param {object} options
	 * @param {import('../drivers/DatabaseConnection.js').DatabaseConnection} options.connection
	 * @param {import('./ResultFormatter.js').ResultFormatter} options.formatter
	 * @param {number} options.lookAhead rows read past the last one returned to count the result (SQL_MAX_ROW_LOOK_AHEAD)
	 * @param {(name: string) => any} options.requestValue request parameters, for bind markers without a value
	 */
	constructor({ connection, formatter, lookAhead, requestValue }) {
		this.#connection = connection;
		this.#formatter = formatter;
		this.#lookAhead = lookAhead;
		this.#requestValue = requestValue;
	}

	/**
	 * @param {string} sql
	 * @param {object} options substitutions (?key?), bindParameters, maxRows, fromRow, countRows, hideSQL, earlierResults
	 */
	async run(sql, { substitutions = null, bindParameters = null, maxRows = 100, fromRow = 0, countRows = true, hideSQL = false, earlierResults = [] } = {}) {
		const started = performance.now();
		let text = new SqlText(String(sql ?? '').trim()).substitute(substitutions);
		let binds = bindParameters;
		if (!binds) ({ sql: text, parameters: binds } = text.extractBindMarkers(this.#connection.DBMS, this.#requestValue));
		binds = SqlText.resolveInlineBinds(binds, earlierResults);

		const outcome = {
			STMT: hideSQL ? '' : text.text, TotalRunDuration: 0, runDuration: 0, parameters: null,
			resultSet: [], numOfResultSet: 0, STMTError: '', STMTMSG: '', statementSucceed: true,
		};
		try {
			const parameters = SqlText.bindParameters(binds);
			const cursor = await this.#connection.execute(text.text, parameters);
			outcome.runDuration = (performance.now() - started) / 1000;
			try {
				if (parameters.length) outcome.parameters = StatementRunner.#parameterValues(parameters, cursor.outParameters);
				do outcome.resultSet.push(await this.#readResultSet(cursor, Number(maxRows), Number(fromRow), countRows));
				while (await cursor.nextResultSet());
				outcome.numOfResultSet = outcome.resultSet.length;
			} finally {
				await cursor.close();
			}
		} catch (error) {
			Object.assign(outcome, { statementSucceed: false, STMTError: error.sqlstate ?? '99999', STMTMSG: error.message });
		}
		outcome.TotalRunDuration = (performance.now() - started) / 1000;
		return outcome;
	}

	/** Values of all bound parameters after the call: OUT values the database returned, otherwise the values sent. */
	static #parameterValues(parameters, outValues) {
		return Object.fromEntries(parameters.map((p) => [p.name, p.present(p.isOutput && Object.hasOwn(outValues, p.name) ? outValues[p.name] : p.value)]));
	}

	async #readResultSet(cursor, maxRows, fromRow, countRows) {
		const columns = cursor.columns;
		const result = { rowsReturned: 0, data: [], columnsInfo: StatementRunner.#columnsInfo(columns) };
		if (columns.length === 0) return result;
		const types = columns.map((c) => c.type);
		let read = 0;
		let row = await cursor.next();
		for (; row !== null && read < fromRow; row = await cursor.next()) read++;
		for (; row !== null && result.rowsReturned < maxRows; row = await cursor.next()) {
			read++;
			result.rowsReturned++;
			result.data.push(this.#formatter.row(row, types));
		}
		result.rowsInSet = countRows && row !== null ? await this.#countRest(cursor, read + 1) : { rowsFound: read, endFound: row === null };
		return result;
	}

	/** Counts on past the rows returned, at most lookAhead more, to tell the user how big the result is. */
	async #countRest(cursor, read) {
		const limit = read + this.#lookAhead;
		while (read < limit && await cursor.next() !== null) read++;
		return { rowsFound: read, endFound: read < limit };
	}

	static #columnsInfo(columns) {
		const info = { num: columns.length, name: [], precision: [], scale: [], type: [], width: [], displaySize: [] };
		for (const column of columns) for (const field of ['name', 'precision', 'scale', 'type', 'width', 'displaySize']) info[field].push(column[field]);
		return info;
	}
}
