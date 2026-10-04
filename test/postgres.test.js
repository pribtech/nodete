import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PostgresDriver } from '../server/drivers/PostgresDriver.js';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { BindParameter } from '../server/drivers/BindParameter.js';
import { TestServer } from './helpers/TestServer.js';

/*
 * Runs against a real PostgreSQL server. Set TE_TEST_POSTGRES to "user:password@host:port/database"
 * (default te:te@localhost:5432/tetest); the tests are skipped when it cannot be reached.
 */
const [, user, password, host, port, database] = /^([^:]*):([^@]*)@([^:]*):(\d+)\/(.+)$/.exec(process.env.TE_TEST_POSTGRES ?? 'te:te@localhost:5432/tetest');
const spec = new ConnectionSpec({ databaseDriver: 'PostgreSQL', database, username: user, password, hostname: host, portnumber: port });
const driver = new PostgresDriver();
const unavailable = await driver.test(spec).then(() => false, (error) => `PostgreSQL not reachable (${error.message})`);
const LOGIN = {
	action: 'DBConnectionNewConnection', returntype: 'JSON', TE_DATABASE_LOGIN_DATABASE_DRIVER: 'PostgreSQL', TE_DATABASE_LOGIN_DATABASE: database,
	TE_DATABASE_LOGIN_USERNAME: user, TE_DATABASE_LOGIN_PASSWORD: password, TE_DATABASE_LOGIN_HOSTNAME: host, TE_DATABASE_LOGIN_PORTNUMBER: port,
};

let server;
let name;
const call = async (fields) => JSON.parse(await server.postActionText({ returntype: 'JSON', USE_CONNECTION: name, ...fields }));
before(async () => {
	if (unavailable) return;
	server = await TestServer.start();
	name = JSON.parse(await server.postActionText(LOGIN)).returnValue.description;
	await call({ action: 'executeSQL', SQL: 'drop table if exists te_test', commitPerSTMT: 'true' });
	await call({ action: 'executeSQL', SQL: 'create table te_test(id int, name varchar(20))', commitPerSTMT: 'true' });
});
after(async () => {
	if (unavailable) return;
	await call({ action: 'executeSQL', SQL: 'drop table if exists te_test', commitPerSTMT: 'true' });
	await server.stop();
});

test('driver: rows come back as text in batches, with PostgreSQL type names', { skip: unavailable }, async () => {
	const connection = await driver.connect(spec);
	try {
		const cursor = await connection.execute('select n, n::text || ? as t from generate_series(1, 250) n', [BindParameter.from(1, { value: '!', type: 'IN' })]);
		assert.deepEqual(cursor.columns.map((c) => [c.name, c.type]), [['n', 'int4'], ['t', 'text']]);
		const rows = [];
		for (let row = await cursor.next(); row; row = await cursor.next()) rows.push(row);
		await cursor.close();
		assert.equal(rows.length, 250, 'more than one batch of 100');
		assert.deepEqual(rows.at(-1), ['250', '250!']);
		await assert.rejects(connection.execute('select * from no_such_table'), (error) => error.sqlstate === '42P01');
	} finally {
		await connection.close();
	}
});

test('executeSQL: a failing batch rolls back what it did', { skip: unavailable }, async () => {
	const failed = await call({ action: 'executeSQL', 'SQL[0]': "insert into te_test values (1, 'one')", 'SQL[1]': 'insert into no_such_table values (1)' });
	assert.equal(failed.returnCode, 'false');
	assert.equal(failed.returnValue.STMTReturn[1].STMTError, '42P01');
	const count = await call({ action: 'executeSQL', SQL: 'select count(*) from te_test' });
	assert.deepEqual(count.returnValue.resultSet[0].data, [['0']]);
});

test('executeSQL: a good batch commits; bind markers and paging work', { skip: unavailable }, async () => {
	const inserts = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`SQL[${i}]`, `insert into te_test values (${i}, 'row ${i}')`]));
	assert.equal((await call({ action: 'executeSQL', ...inserts })).returnCode, 'true');
	const page = await call({ action: 'executeSQL', SQL: 'select id, name from te_test where id >= ?!name=low&dataType=int? order by id', low: '2', maxRowReturn: '5', returnFromRow: '3' });
	const set = page.returnValue.resultSet[0];
	assert.deepEqual(set.data.map((row) => row[0]), ['5', '6', '7', '8', '9']);
	assert.deepEqual(set.rowsInSet, { rowsFound: 10, endFound: true });
	assert.deepEqual(page.returnValue.parameters, { low: '2' });
});

test('menus: a branchSQLXML query result is turned into menus by its stylesheet', { skip: unavailable }, async () => {
	const rootCallBack = JSON.stringify({ branchSQLXML: "select '<databases><database DB_NAME=@@@'||current_database()||'@@@/></databases>'", branchXSL: 'XSL/object2Menu', menulocation: '/developer' });
	const menu = JSON.parse((await server.postActionText({ rootCallBack, returntype: 'JSON', USE_CONNECTION: name }, '?action=menu')).slice(1, -1));
	assert.equal(menu[0].elementValue, 'Databases PostgreSQL', 'stylesheet parameters come from the connection');
	assert.equal(menu[0].elementSubNodes[0].elementValue, database);
});
