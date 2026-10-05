import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DriverCatalog } from '../server/drivers/DriverCatalog.js';
import { DatabaseFiles } from '../server/drivers/DatabaseFiles.js';
import { Placeholders } from '../server/drivers/Placeholders.js';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { BindParameter } from '../server/drivers/BindParameter.js';
import { TestServer } from './helpers/TestServer.js';

/*
 * Every vendor driver extends the same generic classes, so one scenario runs against each:
 * SQLite always (a file in a temporary folder), and PostgreSQL, H2 and MySQL/MariaDB when a
 * server answers, and Derby (over DRDA, the protocol DB2 speaks) likewise. Set TE_TEST_POSTGRES,
 * TE_TEST_H2, TE_TEST_MYSQL, TE_TEST_DERBY to
 * "user:password@host:port/database" to point at other servers.
 */
const dataDirectory = mkdtempSync(path.join(tmpdir(), 'te-data-'));
const catalog = new DriverCatalog(DriverCatalog.standardDrivers({ files: new DatabaseFiles(dataDirectory) }));
const server = (variable, fallback) => {
	const [, username, password, hostname, portnumber, database] = /^([^:]*):([^@]*)@([^:]*):(\d+)\/(.+)$/.exec(process.env[variable] ?? fallback);
	return { username, password, hostname, portnumber, database };
};
const DATABASES = {
	SQLite: { database: 'vendor.db', username: '', password: '' },
	PostgreSQL: server('TE_TEST_POSTGRES', 'te:te@localhost:5432/tetest'),
	H2: server('TE_TEST_H2', 'sa:sa@localhost:5435/tetest'),
	MYSQL: server('TE_TEST_MYSQL', 'te:te@localhost:3306/tetest'),
	Derby: server('TE_TEST_DERBY', 'te:te@localhost:1527/tetest'),
};
const specOf = (id) => new ConnectionSpec({ databaseDriver: id, ...DATABASES[id] });
const skip = Object.fromEntries(await Promise.all(Object.keys(DATABASES).map(async (id) => [id,
	catalog.isAvailable(id) ? await catalog.driver(id).test(specOf(id)).then(() => false, (error) => `cannot connect: ${error.message.slice(0, 100)}`) : 'driver not installed'])));
const IN = (position, value, dataType = 'string') => BindParameter.from(position, { value, dataType, type: 'IN' });

// ---- shared pieces ---------------------------------------------------------------------------------

test('placeholders are found outside quotes and comments, by dialect', () => {
	const mark = (scanner, sql) => scanner.replace(sql, (n) => `$${n}`);
	assert.equal(mark(Placeholders.STANDARD, "select ?, 'a?''?', \"?\" -- ?\n /* ? */ ?"), "select $1, 'a?''?', \"?\" -- ?\n /* ? */ $2");
	assert.equal(mark(Placeholders.MYSQL, "select ?, 'it\\'s ?', `col?`, \"x\\\"?\" # ?\n, ?"), "select $1, 'it\\'s ?', `col?`, \"x\\\"?\" # ?\n, $2");
	assert.equal(Placeholders.STANDARD.inline('a = ? and b = ?', ["'x'"], (v) => v), "a = 'x' and b = ?", 'missing values leave the marker');
});

test('file databases stay inside the data folder', () => {
	const files = new DatabaseFiles('/srv/te/data');
	assert.equal(files.resolve('sales/q1.db'), '/srv/te/data/sales/q1.db');
	for (const bad of ['../etc/passwd', 'a/../../x', '/etc/passwd', 'x;y', '', '.hidden'])
		assert.throws(() => files.resolve(bad), /Invalid database name/, bad);
});

// ---- the same scenario on every vendor -----------------------------------------------------------------

for (const id of Object.keys(DATABASES))
	test(`${id}: transactions, binds, errors, large results`, { skip: skip[id] }, async () => {
		const connection = await catalog.driver(id).connect(specOf(id));
		try {
			assert.match((await connection.serverInfo()).dataServerVersion, /^\d+\.\d+$/);
			try { await connection.rows('drop table te_vendor'); } catch { /* not there yet */ }
			await connection.rows('create table te_vendor (id integer, name varchar(40))');

			await connection.setAutoCommit(false);
			await connection.rows('insert into te_vendor values (?, ?)', [IN(1, '1', 'int'), IN(2, 'gone')]);
			await connection.rollback();
			assert.deepEqual(await connection.rows('select count(*) from te_vendor'), [['0']], 'rolled back');
			await connection.rows(`insert into te_vendor values ${Array.from({ length: 1200 }, (_, i) => `(${i}, 'row ${i}')`).join(', ')}`);
			await connection.commit();
			await connection.setAutoCommit(true);

			const tricky = "it's ? -- \\ not a comment";
			await connection.rows('insert into te_vendor values (?, ?)', [IN(1, '9999', 'int'), IN(2, tricky)]);
			assert.deepEqual(await connection.rows('select id, name from te_vendor where name = ? and id > ?', [IN(1, tricky), IN(2, '0', 'int')]), [['9999', tricky]]);
			assert.deepEqual(await connection.rows("select count(*) from te_vendor where name = '?' or id = ?", [IN(1, '9999', 'int')]), [['1']], 'a ? in a string is not a marker');

			const cursor = await connection.execute('select id, name from te_vendor where id < 1200 order by id');
			assert.deepEqual(cursor.columns.map((c) => c.name.toLowerCase()), ['id', 'name']);
			let count = 0;
			for (let row = await cursor.next(); row; row = await cursor.next()) count++;
			await cursor.close();
			assert.equal(count, 1200);

			const early = await connection.execute('select id from te_vendor order by id');
			assert.deepEqual(await early.next(), ['0']);
			await early.close();
			assert.deepEqual(await connection.rows('select count(*) from te_vendor'), [['1201']], 'usable after closing a result part way');

			await assert.rejects(connection.execute('select * from no_such_table'), (error) => error.name === 'DatabaseError');
			assert.deepEqual(await connection.rows('select count(*) from te_vendor where id = 9999'), [['1']], 'usable after an error');
			await connection.rows('drop table te_vendor');
		} finally {
			await connection.close();
		}
	});

test('SQLite: BLOBs come back as bytes, other binary as hex; no schemas', { skip: skip.SQLite }, async () => {
	const connection = await catalog.driver('SQLite').connect(specOf('SQLite'));
	try {
		await connection.rows('create table if not exists te_blob (b blob)');
		await connection.rows("insert into te_blob values (x'00ff')");
		const [[blob]] = await connection.rows('select b from te_blob');
		assert.deepEqual(blob, Buffer.from([0, 255]));
		assert.deepEqual(await connection.rows("select x'0aff' x"), [['0aff']]);
		await assert.rejects(connection.setSchema('other'), /SQLite has no schemas/);
	} finally {
		await connection.close();
	}
	assert.ok(readdirSync(dataDirectory).includes('vendor.db'), 'the database is a file in the data folder');
	await assert.rejects(catalog.driver('SQLite').connect(specOf('SQLite').with({ database: '../escape.db' })), /Invalid database name/);
});

test('MYSQL: server information names MariaDB or MySQL', { skip: skip.MYSQL }, async () => {
	const info = await catalog.driver('MYSQL').test(specOf('MYSQL'));
	assert.equal(info.DBMS, 'MYSQL');
	assert.match(info.dataServerName, /^(MariaDB|MySQL)$/);
});

// ---- through the console -----------------------------------------------------------------------------------

test('the console on SQLite: log on, a batch that rolls back, connection status', { skip: skip.SQLite }, async () => {
	const console = await TestServer.start({ DATABASE_DATA_DIRECTORY: dataDirectory });
	try {
		const call = async (fields) => JSON.parse(await console.postActionText({ returntype: 'JSON', ...fields }));
		const logon = await call({ action: 'DBConnectionNewConnection', TE_DATABASE_LOGIN_DATABASE_DRIVER: 'SQLite', TE_DATABASE_LOGIN_DATABASE: 'console.db', TE_DATABASE_LOGIN_USERNAME: 'me' });
		assert.equal(logon.returnCode, 'true', JSON.stringify(logon));
		const USE_CONNECTION = logon.returnValue.description;
		await call({ action: 'executeSQL', USE_CONNECTION, SQL: 'create table if not exists t (a int)', commitPerSTMT: 'true' });
		const failed = await call({ action: 'executeSQL', USE_CONNECTION, 'SQL[0]': 'insert into t values (1)', 'SQL[1]': 'insert into nope values (1)' });
		assert.equal(failed.returnCode, 'false');
		const count = await call({ action: 'executeSQL', USE_CONNECTION, SQL: 'select count(*) from t where a > ?!name=min&dataType=int?', min: '0' });
		assert.deepEqual(count.returnValue.resultSet[0].data, [['0']], 'rolled back');
		assert.equal((await call({ action: 'DBConnectionCheck', USE_CONNECTION })).connectionStatus, 'true');
	} finally {
		await console.stop();
	}
});
