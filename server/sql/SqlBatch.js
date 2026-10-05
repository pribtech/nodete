import { StatementRunner } from './StatementRunner.js';
import { ResultFormatter } from './ResultFormatter.js';
import { RunConditions } from './RunConditions.js';
import { PhpCompat } from '../util/PhpCompat.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * One executeSQL request: a single statement, or a batch SQL[0], SQL[1]... run as one unit
 * of work unless each statement is committed (PHP executeSQL.php). Reply shape:
 *   {returnCode: "true"|"false", returnValue, returnMessage}
 */
export class SqlBatch {
	#connection;
	#options;
	#runner;

	/**
	 * @param {import('../drivers/DatabaseConnection.js').DatabaseConnection} connection
	 * @param {ReturnType<typeof SqlBatch.optionsFrom>} options
	 * @param {{lookAhead: number, requestValue: (name: string) => any}} context
	 */
	constructor(connection, options, { lookAhead, requestValue }) {
		this.#connection = connection;
		this.#options = options;
		this.#runner = new StatementRunner({ connection, formatter: new ResultFormatter(options.display), lookAhead, requestValue });
	}

	/** Reads executeSQL's request parameters. */
	static optionsFrom(request) {
		const flag = (name, fallback) => String(request.getParameter(name, fallback)).toLowerCase() === 'true';
		const decoded = (name) => {
			const value = request.getParameter(name);
			return typeof value === 'string' && flag(`${name}Encoded`, 'false') ? JSON.parse(value) : value;
		};
		const commitEach = flag('commitPerSTMT', 'false');
		const getRowCount = request.getParameter('getRowCount', ';');
		return {
			sql: request.getParameter('SQL'),
			hideSQL: flag('doNotReturnSQL', 'false'),
			bindParameters: decoded('bindParameters'),
			conditions: decoded('conditions'),
			exitSQL: request.getParameter('exitSQL'),
			queryOptimization: request.getParameter('queryOpt'),
			substitutions: request.getParameter('parameter'),
			maxRows: request.getParameter('maxRowReturn', 100),
			fromRow: request.getParameter('returnFromRow', 0),
			countRows: getRowCount !== '0' && getRowCount !== false,
			commitEach,
			abortOnFailure: flag('abortOnFailure', commitEach ? 'false' : 'true'),
			abortOnWarning: flag('abortOnWarning', 'false'),
			display: Object.fromEntries(['displayXML', 'displayCLOB', 'displayXMLinline', 'displayCLOBinline', 'displayBLOB', 'displayDBCLOB'].map((name) => [name, flag(name, 'false')])),
		};
	}

	async run() {
		let reply = { returnCode: 'true', returnValue: '', returnMessage: '' };
		try {
			await this.#connection.setAutoCommit(this.#options.commitEach);
			await this.#setQueryOptimization();
			const { sql } = this.#options;
			if (sql === null || sql === undefined || sql === '') throw new Error('No SQL received');
			const { commit } = typeof sql === 'object' ? await this.#runMany(reply, sql) : await this.#runOne(reply, sql);
			await this.#endUnitOfWork(reply.returnCode === 'false' ? commit : true);
		} catch (error) {
			reply = { ...reply, returnCode: 'false', success: false, returnValue: `Failed: ${error.message}`, message: `Failed: ${error.message}` };
		}
		await this.#runExitSQL(reply);
		return reply;
	}

	async #setQueryOptimization() {
		const level = this.#options.queryOptimization;
		if (level === null || level === undefined) return;
		if (!/^\d+$/.test(String(level))) throw new Error(`Set current query optimization failed, error invalid level ${level}`);
		try {
			await this.#connection.rows(`SET CURRENT QUERY OPTIMIZATION = ${level}`);
		} catch (error) {
			throw new Error(`Set current query optimization failed, error${error.message}`, { cause: error });
		}
	}

	#perStatement(value, key) { return value !== null && typeof value === 'object' && Object.hasOwn(value, key) ? value[key] : value; }

	async #runOne(reply, sql) {
		const o = this.#options;
		const outcome = await this.#runner.run(sql, {
			substitutions: o.substitutions, bindParameters: o.bindParameters, maxRows: o.maxRows, fromRow: o.fromRow, countRows: o.countRows, hideSQL: o.hideSQL,
		});
		reply.returnValue = outcome;
		if (!outcome.statementSucceed) Object.assign(reply, { returnCode: 'false', returnMessage: outcome.STMTMSG });
		return this.#applyConditions(reply, this.#perStatement(o.conditions, 0), outcome);
	}

	async #runMany(reply, statements) {
		const o = this.#options;
		const started = performance.now();
		const summary = {
			RunTime: SqlBatch.#runTime(new Date()), TotalRunDuration: 0, AutoCommit: o.commitEach ? 'true' : 'false',
			STMTReceived: Object.keys(statements).length, STMTRun: 0, STMTErrorCount: 0, STMTWarningCount: 0, STMTReturn: [],
		};
		reply.returnValue = summary;
		const results = [];
		let commit = false;
		let position = 1;
		for (const [key, sql] of PhpCompat.ksort(statements)) {
			const outcome = await this.#runner.run(sql, {
				substitutions: this.#perStatement(o.substitutions, key),
				bindParameters: o.bindParameters?.[key] ?? null,
				maxRows: Array.isArray(o.maxRows) || typeof o.maxRows === 'object' ? o.maxRows?.[key] ?? 100 : o.maxRows,
				fromRow: Array.isArray(o.fromRow) || typeof o.fromRow === 'object' ? o.fromRow?.[key] ?? 0 : o.fromRow,
				countRows: o.countRows, hideSQL: o.hideSQL,
				earlierResults: results.map(([, r]) => r),
			});
			summary.STMTRun++;
			results.push([key, outcome]);
			summary.STMTReturn = PhpCompat.array(results);
			if (!o.abortOnWarning && outcome.STMTError.startsWith('01')) {
				outcome.statementSucceed = true;
				summary.STMTWarningCount++;
			}
			if (!outcome.statementSucceed) {
				summary.STMTErrorCount++;
				reply.returnCode = 'false';
				if (o.abortOnFailure) {
					Object.assign(summary, { STMT: outcome.STMT, STMTMSG: outcome.STMTMSG });
					break;
				}
			}
			const check = await this.#applyConditions(reply, o.conditions?.[position], outcome);
			if (check.stop) { commit = check.commit; break; }
			position++;
		}
		summary.TotalRunDuration = (performance.now() - started) / 1000;
		return { commit };
	}

	/** Applies a statement's run conditions; commits now when they say so and the batch continues. */
	async #applyConditions(reply, conditions, outcome) {
		if (conditions === undefined || conditions === null) return { stop: false, commit: false };
		const check = new RunConditions(conditions).check(outcome);
		if (check.returnValue === false) {
			Object.assign(reply, { returnCode: check.returnCode, returnMessage: check.returnMessage });
			return { stop: true, commit: check.commit };
		}
		if (check.commit && !this.#options.commitEach) await this.#connection.commit();
		return { stop: false, commit: false };
	}

	async #endUnitOfWork(commit) {
		if (this.#options.commitEach) return;
		if (commit) await this.#connection.commit();
		else await this.#connection.rollback();
	}

	async #runExitSQL(reply) {
		const sql = this.#options.exitSQL;
		if (!sql) return;
		try {
			await this.#connection.rows(sql);
		} catch {
			const message = `Exit SQL Failed, Statement: ${sql}`;
			Object.assign(reply, { returnCode: 'false', success: false, returnValue: message, message });
		}
	}

	/** PHP date('H:i:s l, M j'). */
	static #runTime(date) {
		const two = (n) => String(n).padStart(2, '0');
		return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())} ${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
	}
}
