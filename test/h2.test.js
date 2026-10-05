// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { H2Driver, H2Connection } from '../server/drivers/H2Driver.js';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { BindParameter } from '../server/drivers/BindParameter.js';
import { TestServer } from './helpers/TestServer.js';

/*
 * Apache H2 through its PostgreSQL protocol server. Start one with
 *   java -cp h2.jar org.h2.tools.Server -pg -ifNotExists -baseDir <folder>
 * and set TE_TEST_H2 to "user:password@host:port/database" (default sa:sa@localhost:5435/tetest).
 * The server tests are skipped when it cannot be reached.
 */
const [, user, password, host, port, database] = /^([^:]*):([^@]*)@([^:]*):(\d+)\/(.+)$/.exec(process.env.TE_TEST_H2 ?? 'sa:sa@localhost:5435/tetest');
const spec = new ConnectionSpec({ databaseDriver: 'H2', database, username: user, password, hostname: host, portnumber: port });
const driver = new H2Driver();
const unavailable = await driver.test(spec).then(() => false, (error) => `H2 not reachable (${error.message})`);
const IN = (position, value, dataType = 'string') => BindParameter.from(position, { value, dataType, type: 'IN' });

test('bind values become SQL literals, quotes doubled', () => {
	assert.equal(H2Connection.literal("it's \\ here"), "'it''s \\ here'");
	assert.equal(H2Connection.literal(42), '42');
	assert.equal(H2Connection.literal(null), 'NULL');
	assert.equal(H2Connection.literal(Number.NaN), "'NaN'");
});

test('a blank host and port mean H2 on this machine at 5435', () => {
	const options = driver.clientOptions(spec.with({ hostname: '', portnumber: '' }));
	assert.deepEqual([options.host, options.port], ['localhost', 5435]);
});

test('driver: server information, binds, errors that leave the connection usable', { skip: unavailable }, async () => {
	assert.equal((await driver.test(spec)).DBMS, 'H2');
	const connection = await driver.connect(spec);
	try {
		const rows = await connection.rows('select ? s, ? n, \'?\' q', [IN(1, "a'b; drop table x --"), IN(2, '7', 'int')]);
		assert.deepEqual(rows, [["a'b; drop table x --", '7', '?']]);
		await assert.rejects(connection.execute('select * from no_such_table'), (error) => error.sqlstate === '42S02');
		assert.deepEqual(await connection.rows('select 1'), [['1']], 'still usable after an error');
		const cursor = await connection.execute('select 1 a; select 2 b');
		assert.deepEqual([cursor.columns[0].name, await cursor.next(), await cursor.nextResultSet(), cursor.columns[0].name, await cursor.next()], ['a', ['1'], true, 'b', ['2']]);
	} finally {
		await connection.close();
	}
});

let server;
let name;
const call = async (fields) => JSON.parse(await server.postActionText({ returntype: 'JSON', USE_CONNECTION: name, ...fields }));
before(async () => {
	if (unavailable) return;
	server = await TestServer.start();
	const logon = JSON.parse(await server.postActionText({
		action: 'DBConnectionNewConnection', returntype: 'JSON', TE_DATABASE_LOGIN_DATABASE_DRIVER: 'H2', TE_DATABASE_LOGIN_DATABASE: database,
		TE_DATABASE_LOGIN_USERNAME: user, TE_DATABASE_LOGIN_PASSWORD: password, TE_DATABASE_LOGIN_HOSTNAME: host, TE_DATABASE_LOGIN_PORTNUMBER: port,
	}));
	assert.equal(logon.returnCode, 'true', JSON.stringify(logon));
	name = logon.returnValue.description;
	await call({ action: 'executeSQL', SQL: 'drop table if exists te_test', commitPerSTMT: 'true' });
	await call({ action: 'executeSQL', SQL: 'create table te_test(id int, name varchar(20))', commitPerSTMT: 'true' });
});
after(async () => {
	if (unavailable) return;
	await call({ action: 'executeSQL', SQL: 'drop table if exists te_test', commitPerSTMT: 'true' });
	await server.stop();
});

test('executeSQL on H2: a failing batch rolls back, a good one commits, paging and binds work', { skip: unavailable }, async () => {
	const failed = await call({ action: 'executeSQL', 'SQL[0]': "insert into te_test values (1, 'one')", 'SQL[1]': 'insert into no_such_table values (1)' });
	assert.equal(failed.returnCode, 'false');
	assert.deepEqual((await call({ action: 'executeSQL', SQL: 'select count(*) from te_test' })).returnValue.resultSet[0].data, [['0']]);

	const inserts = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`SQL[${i}]`, `insert into te_test values (${i}, 'row ${i}')`]));
	assert.equal((await call({ action: 'executeSQL', ...inserts })).returnCode, 'true');
	const page = await call({ action: 'executeSQL', SQL: 'select id, name from te_test where id >= ?!name=low&dataType=int? order by id', low: '2', maxRowReturn: '5', returnFromRow: '3' });
	const set = page.returnValue.resultSet[0];
	assert.deepEqual(set.data.map((row) => row[0]), ['5', '6', '7', '8', '9']);
	assert.deepEqual(set.rowsInSet, { rowsFound: 10, endFound: true });
	assert.deepEqual(set.columnsInfo.type, ['int4', 'varchar']);
});

test('connection status and database menus on H2', { skip: unavailable }, async () => {
	const check = await call({ action: 'DBConnectionCheck' });
	assert.equal(check.connectionStatus, 'true');
	assert.equal(check.activeConnection.find((c) => c.description === name).dataServerInfo.dataServerName, 'H2');
	const rootCallBack = JSON.stringify({ branchSQLXML: "select '<databases><database DB_NAME=@@@' || database() || '@@@/></databases>'", branchXSL: 'XSL/object2Menu', menulocation: '/developer' });
	const menu = JSON.parse((await server.postActionText({ rootCallBack, returntype: 'JSON', USE_CONNECTION: name }, '?action=menu')).slice(1, -1));
	assert.equal(menu[0].elementValue, 'Databases H2');
	assert.equal(menu[0].elementSubNodes[0].elementValue.toLowerCase(), database.toLowerCase());
});
