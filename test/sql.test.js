import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SqlText } from '../server/sql/SqlText.js';
import { RunConditions } from '../server/sql/RunConditions.js';
import { ResultFormatter } from '../server/sql/ResultFormatter.js';
import { SqlBatch } from '../server/sql/SqlBatch.js';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { DatabaseError } from '../server/drivers/DatabaseError.js';
import { FakeDriver, column } from './helpers/FakeDriver.js';

// ---- SQL text ------------------------------------------------------------------------------

test('SqlText substitutes ?name? templates', () => {
	assert.equal(new SqlText('select * from ?schema?.T where a = ?schema?').substitute({ schema: 'APP' }).text, 'select * from APP.T where a = APP');
});

test('SqlText turns ?!...? markers into bind parameters with the DBMS marker', () => {
	const { sql, parameters } = new SqlText('select * from T where a = ?!name=a&dataType=int? and b = ?!value=x? and c = ?!name=c?')
		.extractBindMarkers('DB2', (name) => (name === 'c' ? 'from request' : null));
	assert.equal(sql.text, 'select * from T where a = ? and b = ? and c = ?');
	assert.deepEqual(parameters, {
		1: { name: 'a', dataType: 'int', value: null },
		2: { name: 'p2', value: 'x' },
		3: { name: 'c', value: 'from request' },
	});
	assert.equal(new SqlText('x = ?!name=a?').extractBindMarkers('ORACLE', () => 1).sql.text, 'x = :a ');
	assert.equal(new SqlText('echo ?!name=a?').extractBindMarkers('ssh', () => 1).sql.text, 'echo ${a}');
});

test('TE_INLINE_BIND values come from an earlier statement of the batch', () => {
	const earlier = [{ resultSet: [{ data: [['r0c0', 'r0c1'], ['r1c0', 'r1c1']] }] }];
	const resolved = SqlText.resolveInlineBinds({ 1: { type: 'TE_INLINE_BIND', value: '0.0.1.1' }, 2: { type: 'TE_INLINE_BIND', value: '5.0.0.0' }, 3: { value: 'kept' } }, earlier);
	assert.deepEqual(resolved, { 1: { type: 'DB2_PARAM_IN', value: 'r1c1' }, 2: { type: 'DB2_PARAM_IN', value: null }, 3: { value: 'kept' } });
});

test('ResultFormatter leaves out large objects unless asked, base64 or inline', () => {
	const types = ['integer', 'xml', 'clob', 'blob'];
	assert.deepEqual(new ResultFormatter().row([1, '<a/>', 'text', 'bin'], types), [1, '', '', '']);
	assert.deepEqual(new ResultFormatter({ displayXML: true, displayXMLinline: true, displayCLOB: true, displayBLOB: true }).row([1, '<a/>', 'text', Buffer.from('bin')], types),
		[1, '<a/>', 'dGV4dA==', 'Ymlu']);
});

test('RunConditions: rowsReturned comparisons with onTrue / onFalse actions', () => {
	const result = { resultSet: [{ rowsReturned: 3 }] };
	assert.deepEqual(new RunConditions({ rowsReturned: { operator: '>', condition: '2' } }).check(result), { returnValue: true, returnCode: 'true', returnMessage: '', commit: false });
	assert.deepEqual(new RunConditions({ rowsReturned: { operator: '=', condition: 0, onFalse: { nextAction: 'endRun', setrunmessage: 'none found' } } }).check(result),
		{ returnValue: false, returnCode: 'false', returnMessage: 'none found', commit: true });
	assert.deepEqual(new RunConditions({ rowsReturned: { operator: '>', condition: 0, onTrue: { nextAction: 'commit' } } }).check(result),
		{ returnValue: false, returnCode: 'true', returnMessage: '', commit: true });
	assert.match(new RunConditions({ rowsReturned: { operator: '~', condition: 0 } }).check(result).returnMessage, /Could not evaluate expression/);
	assert.match(new RunConditions({ rowsReturned: { operator: '=', condition: 0 } }).check({ resultSet: [] }).returnMessage, /No data returned/);
	assert.match(new RunConditions({ values: {} }).check(result).returnMessage, /Could not evaluate condition type : values/);
});

// ---- executeSQL batches against the in-memory driver ------------------------------------------

const ROWS = Array.from({ length: 10 }, (_, i) => [String(i), `name ${i}`]);

async function batch(parameters, answer = () => ({ columns: [column('ID', 'integer'), column('NAME')], rows: ROWS })) {
	const driver = new FakeDriver();
	driver.answer = answer;
	const connection = await driver.connect(new ConnectionSpec({ databaseDriver: 'FAKE', database: 'D', username: 'u', password: 'secret' }));
	driver.log.length = 0;
	const request = { getParameter: (name, fallback = null) => parameters[name] ?? fallback };
	const reply = await new SqlBatch(connection, SqlBatch.optionsFrom(request), { lookAhead: 3, requestValue: () => null }).run();
	return { reply, log: driver.log };
}

test('one statement: rows from returnFromRow, at most maxRowReturn, counted a little further', async () => {
	const { reply, log } = await batch({ SQL: ' select * from T ', maxRowReturn: '4', returnFromRow: '2' });
	assert.equal(reply.returnCode, 'true');
	const set = reply.returnValue.resultSet[0];
	assert.deepEqual(set.data.map((row) => row[0]), ['2', '3', '4', '5']);
	assert.equal(set.rowsReturned, 4);
	assert.deepEqual(set.rowsInSet, { rowsFound: 10, endFound: false }, '6 read and 1 held, plus 3 more looked at; the end is not seen');
	assert.deepEqual(set.columnsInfo.name, ['ID', 'NAME']);
	assert.equal(reply.returnValue.STMT, 'select * from T');
	assert.deepEqual(log.map(([call]) => call), ['autoCommit', 'run', 'commit']);
});

test('one statement: the whole result counted when it ends within the look ahead', async () => {
	const { reply } = await batch({ SQL: 'select', maxRowReturn: '8' });
	assert.deepEqual(reply.returnValue.resultSet[0].rowsInSet, { rowsFound: 10, endFound: true });
	const { reply: small } = await batch({ SQL: 'select', maxRowReturn: '100' });
	assert.deepEqual(small.returnValue.resultSet[0].rowsInSet, { rowsFound: 10, endFound: true });
});

test('one failing statement rolls back and reports the SQLSTATE', async () => {
	const { reply, log } = await batch({ SQL: 'bad' }, () => { throw new DatabaseError('SQL0104N', '42601'); });
	assert.equal(reply.returnCode, 'false');
	assert.equal(reply.returnMessage, 'SQL0104N');
	assert.deepEqual([reply.returnValue.STMTError, reply.returnValue.statementSucceed], ['42601', false]);
	assert.deepEqual(log.at(-1), ['rollback']);
});

test('a batch stops at the first failure and rolls back', async () => {
	const { reply, log } = await batch({ SQL: ['select 1', 'bad', 'select 3'] }, (sql) => {
		if (sql === 'bad') throw new DatabaseError('broken', '42601');
		return { columns: [column('A')], rows: [['1']] };
	});
	const value = reply.returnValue;
	assert.equal(reply.returnCode, 'false');
	assert.deepEqual([value.STMTReceived, value.STMTRun, value.STMTErrorCount, value.AutoCommit], [3, 2, 1, 'false']);
	assert.ok(Array.isArray(value.STMTReturn), 'statements 0..n-1 are a list, as PHP json_encode made them');
	assert.deepEqual([value.STMT, value.STMTMSG], ['bad', 'broken']);
	assert.match(value.RunTime, /^\d\d:\d\d:\d\d \w+day, \w{3} \d{1,2}$/);
	assert.deepEqual(log.filter(([call]) => call !== 'run').map(([call]) => call), ['autoCommit', 'rollback']);
});

test('commitPerSTMT runs on after failures and leaves commits to the database', async () => {
	const { reply, log } = await batch({ SQL: { 2: 'bad', 1: 'ok' }, commitPerSTMT: 'true' }, (sql) => {
		if (sql === 'bad') throw new DatabaseError('broken');
		return {};
	});
	assert.deepEqual([reply.returnValue.STMTRun, reply.returnValue.STMTErrorCount], [2, 1]);
	assert.deepEqual(Object.keys(reply.returnValue.STMTReturn), ['1', '2'], 'keys other than 0..n-1 stay an object');
	assert.deepEqual(log.map(([call, value]) => [call, value]), [['run', 'ok'], ['run', 'bad']], 'autocommit is already on: no transaction calls');
});

test('warnings (SQLSTATE 01xxx) count as success unless abortOnWarning', async () => {
	const warn = () => { throw new DatabaseError('truncated', '01004'); };
	assert.equal((await batch({ SQL: ['w'] }, warn)).reply.returnValue.STMTWarningCount, 1);
	assert.equal((await batch({ SQL: ['w'] }, warn)).reply.returnCode, 'true');
	assert.equal((await batch({ SQL: ['w'], abortOnWarning: 'true' }, warn)).reply.returnCode, 'false');
});

test('batch conditions can end the run and commit', async () => {
	const conditions = JSON.stringify({ 1: { rowsReturned: { operator: '=', condition: 0, onFalse: { nextAction: 'endRun', setrunreturn: 'false', setrunmessage: 'already there' } } } });
	const { reply, log } = await batch({ SQL: ['select', 'insert'], conditions, conditionsEncoded: 'true' });
	assert.deepEqual([reply.returnCode, reply.returnMessage, reply.returnValue.STMTRun], ['false', 'already there', 1]);
	assert.deepEqual(log.at(-1), ['commit'], 'endRun commits what ran');
});

test('bind parameters are bound and reported back', async () => {
	const bindParameters = JSON.stringify({ 1: { name: 'id', value: '7', dataType: 'int', type: 'IN' } });
	const { reply, log } = await batch({ SQL: 'select * from T where ID = ?', bindParameters, bindParametersEncoded: 'true' });
	assert.deepEqual(log.find(([call]) => call === 'run'), ['run', 'select * from T where ID = ?', [7]]);
	assert.deepEqual(reply.returnValue.parameters, { id: '7' });
});

test('missing SQL, bad query optimization and failing exit SQL are reported', async () => {
	assert.equal((await batch({})).reply.returnValue, 'Failed: No SQL received');
	assert.match((await batch({ SQL: 'x', queryOpt: '5; drop table T' })).reply.returnValue, /invalid level/);
	const { log } = await batch({ SQL: 'x', queryOpt: '5' });
	assert.equal(log.find(([call]) => call === 'run')[1], 'SET CURRENT QUERY OPTIMIZATION = 5');
	const { reply } = await batch({ SQL: 'x', exitSQL: 'boom' }, (sql) => { if (sql === 'boom') throw new Error('no'); return {}; });
	assert.deepEqual([reply.returnCode, reply.returnValue], ['false', 'Exit SQL Failed, Statement: boom']);
});

test('doNotReturnSQL hides the statement text', async () => {
	assert.equal((await batch({ SQL: 'select', doNotReturnSQL: 'true' })).reply.returnValue.STMT, '');
});
