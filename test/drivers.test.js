import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { BindParameter } from '../server/drivers/BindParameter.js';
import { DatabaseError } from '../server/drivers/DatabaseError.js';
import { Db2Driver } from '../server/drivers/Db2Driver.js';
import { PostgresConnection } from '../server/drivers/PostgresDriver.js';
import { DriverCatalog } from '../server/drivers/DriverCatalog.js';
import { FakeIbmDb } from './helpers/FakeIbmDb.js';
import { FakeDriver } from './helpers/FakeDriver.js';

const db2Spec = (fields = {}) => new ConnectionSpec({ databaseDriver: 'IBM_DB2', database: 'SAMPLE', username: 'db2inst1', password: 'pw', hostname: 'db.example', portnumber: '50000', ...fields });

// ---- value classes ---------------------------------------------------------------------

test('ConnectionSpec names connections as the PHP version did', () => {
	assert.equal(db2Spec().name, 'IBM_DB2:db2inst1@SAMPLE.db.example:50000');
	assert.equal(db2Spec({ hostname: '' }).name, 'IBM_DB2:db2inst1@SAMPLE');
	assert.equal(db2Spec({ portnumber: '' }).isCataloged, true);
	assert.equal(db2Spec().isCataloged, false);
	assert.equal(db2Spec({ database: ' ' }).validate(), 'No database specified!');
	assert.equal(db2Spec({ username: '' }).validate(), 'No username specified!');
	assert.ok(Object.isFrozen(db2Spec()));
});

test('ConnectionSpec reads the login form, trimming all but password and comment', () => {
	const values = { TE_DATABASE_LOGIN_DATABASE: ' SAMPLE ', TE_DATABASE_LOGIN_USERNAME: 'u ', TE_DATABASE_LOGIN_PASSWORD: ' p ', TE_DATABASE_LOGIN_COMMENT: ' c' };
	const spec = ConnectionSpec.fromLogin({ getParameter: (name, fallback) => values[name] ?? fallback }, 'IBM_DB2');
	assert.deepEqual([spec.databaseDriver, spec.database, spec.username, spec.password, spec.comment], ['IBM_DB2', 'SAMPLE', 'u', ' p ', ' c']);
});

test('BindParameter converts values by data type and guards names and types', () => {
	assert.equal(BindParameter.from(1, { name: 'n', value: '1,234', dataType: 'int' }).value, 1234);
	assert.equal(BindParameter.from(1, { value: '2.5', dataType: 'double' }).value, 2.5);
	assert.equal(BindParameter.from(1, { value: 'NULL' }).value, null);
	assert.equal(BindParameter.from(1, { value: 'a%20b' }).value, 'a b');
	assert.equal(BindParameter.from(3, { name: 'bad name;' }).name, 'p3');
	assert.equal(BindParameter.from(1, {}).direction, 'OUT', 'no type means OUT, as in PHP');
	assert.equal(BindParameter.from(1, { type: 'DB2_PARAM_IN' }).direction, 'IN');
	assert.equal(BindParameter.from(1, { type: 'x y' }).direction, 'OUT', 'unsafe type falls back to OUT');
	assert.throws(() => BindParameter.from(1, { dataType: 'clob' }), DatabaseError);
	assert.throws(() => BindParameter.from(1, { type: 'SIDEWAYS' }), /Invalid type/);
	assert.throws(() => BindParameter.from(1, { conversion: 'rot13' }), /Unknown conversion/);
	assert.deepEqual(BindParameter.listFrom({ 2: { name: 'b' }, 1: { name: 'a' } }).map((p) => p.name), ['a', 'b']);
});

test('BindParameter presents values HTML-escaped or converted', () => {
	assert.equal(BindParameter.from(1, {}).present('<a & b>'), '&lt;a &amp; b&gt;');
	assert.equal(BindParameter.from(1, { conversion: 'bin2hex' }).present('AB'), '4142');
	assert.equal(BindParameter.from(1, { conversion: 'hex2string' }).present('3c41'), '&lt;A');
	assert.equal(BindParameter.from(1, {}).present(null), '');
});

test('DatabaseError keeps the SQLSTATE of ibm_db and pg errors', () => {
	assert.equal(DatabaseError.from(Object.assign(new Error('x'), { sqlstate: '42704' })).sqlstate, '42704');
	assert.equal(DatabaseError.from(Object.assign(new Error('x'), { code: '42P01' })).sqlstate, '42P01');
	assert.equal(DatabaseError.from(Object.assign(new Error('x'), { code: 'ECONNREFUSED' })).sqlstate, '99999');
});

// ---- DB2 through a stand-in ibm_db ------------------------------------------------------

const db2 = () => {
	const ibmdb = new FakeIbmDb();
	return { ibmdb, driver: new Db2Driver({ loadModule: (name) => { assert.equal(name, 'ibm_db'); return ibmdb; } }) };
};

test('DB2 connection strings: TCP/IP with host and port, catalog name otherwise, values with ; braced', () => {
	assert.equal(Db2Driver.connectionString(db2Spec()), 'DATABASE=SAMPLE;HOSTNAME=db.example;PORT=50000;PROTOCOL=TCPIP;UID=db2inst1;PWD=pw;');
	assert.equal(Db2Driver.connectionString(db2Spec({ hostname: '' })), 'DATABASE=SAMPLE;UID=db2inst1;PWD=pw;');
	assert.equal(Db2Driver.connectionString(db2Spec({ password: 'a;b}c' })).split('PWD=')[1], '{a;b}}c};');
});

test('DB2 test() reports the server like PHP testConnection and closes the connection', async () => {
	const { ibmdb, driver } = db2();
	assert.deepEqual(await driver.test(db2Spec()), { dataServerName: 'DB2/LINUXX8664', dataServerVersion: '11.5', dataServerFixpack: 900, feature: [], DBMS: 'DB2' });
	assert.deepEqual(ibmdb.calls.at(-1), ['close']);
	ibmdb.info[17] = 'DB2';
	assert.equal((await driver.test(db2Spec())).DBMS, 'DB2Z', 'a server named plain DB2 is z/OS');
});

test('DB2 sets a schema other than the user name with quoted identifiers', async () => {
	const { ibmdb, driver } = db2();
	await (await driver.connect(db2Spec({ schema: 'my"schema' }))).close();
	const statements = ibmdb.calls.filter(([call]) => call === 'queryResult').map(([, sql]) => sql);
	assert.deepEqual(statements, ['SET CURRENT PATH "my""schema", USER, SYSTEM PATH', 'SET CURRENT SCHEMA "my""schema"']);
	ibmdb.calls.length = 0;
	await (await driver.connect(db2Spec({ schema: 'DB2INST1' }))).close();
	assert.equal(ibmdb.calls.filter(([call]) => call === 'queryResult').length, 0, 'schema equal to the user is the default already');
});

test('DB2 open failures become DatabaseErrors with the SQLSTATE', async () => {
	const { ibmdb, driver } = db2();
	ibmdb.failOpen = 'SQL30081N A communication error';
	await assert.rejects(driver.connect(db2Spec()), (error) => error instanceof DatabaseError && error.sqlstate === '08001');
	await assert.rejects(driver.connect(db2Spec({ username: '' })), /No username specified/);
});

test('DB2 statements: columns, rows across result sets, IN binds outside CALL, OUT values from CALL', async () => {
	const { ibmdb, driver } = db2();
	ibmdb.answer = (sql) => (sql.startsWith('CALL')
		? { sets: [{ columns: [['A', 'INTEGER']], rows: [[1], [2]] }, { columns: [['B', 'VARCHAR', 20]], rows: [['x']] }], outValues: ['out!'] }
		: { columns: [['N', 'INTEGER']], rows: [[7]] });
	const connection = await driver.connect(db2Spec());

	const select = await connection.execute('SELECT ? FROM T', [BindParameter.from(1, { value: '5', dataType: 'int' })]);
	assert.deepEqual(ibmdb.calls.at(-1)[2], [{ ParamType: 'INPUT', DataType: 'INTEGER', Data: 5 }]);
	assert.deepEqual(select.columns[0], { name: 'N', type: 'integer', precision: 10, scale: 0, width: 10, displaySize: 11 });
	assert.deepEqual(await select.next(), [7]);
	assert.equal(await select.next(), null);
	await select.close();

	const call = await connection.execute('CALL P(?, ?)', [BindParameter.from(1, { name: 'i', type: 'IN', value: 'a' }), BindParameter.from(2, { name: 'o', precision: '30' })]);
	assert.deepEqual(ibmdb.calls.at(-1)[2], [{ ParamType: 'INPUT', DataType: 'CHAR', Data: 'a' }, { ParamType: 'OUTPUT', DataType: 'CHAR', Data: null, Length: 30 }]);
	assert.deepEqual(call.outParameters, { o: 'out!' });
	assert.deepEqual([await call.next(), await call.next(), await call.next()], [[1], [2], null]);
	assert.equal(await call.nextResultSet(), true);
	assert.equal(call.columns[0].name, 'B');
	assert.deepEqual(await call.next(), ['x']);
	assert.equal(await call.nextResultSet(), false);
	await call.close();
	assert.deepEqual(ibmdb.calls.at(-1), ['closeResult']);
	await connection.close();
});

test('DB2 transactions: autocommit through the CLI attribute, commit keeps manual mode', async () => {
	const { ibmdb, driver } = db2();
	const connection = await driver.connect(db2Spec());
	await connection.commit();
	assert.equal(ibmdb.calls.filter(([c]) => c === 'endTransaction').length, 0, 'commit is a no-op under autocommit');
	await connection.setAutoCommit(false);
	await connection.commit();
	await connection.rollback();
	assert.deepEqual(ibmdb.calls.filter(([c]) => c === 'setAttr' || c === 'endTransaction').map((c) => c.slice(0, 3)), [
		['setAttr', 102, 0], ['endTransaction', false], ['setAttr', 102, 0], ['endTransaction', true], ['setAttr', 102, 0],
	]);
	await connection.close();
	await assert.rejects(connection.execute('SELECT 1'), (error) => error.sqlstate === '08003');
});

test('DB2 features: TE feature checks plus licensed features', async () => {
	const { ibmdb, driver } = db2();
	ibmdb.answer = (sql) => {
		if (sql.includes('ENV_FEATURE_INFO')) return { columns: [['FEATURE_NAME'], ['FEATURE_FULLNAME']], rows: [['DPF', 'Database Partitioning']] };
		return { columns: [['1', 'INTEGER']], rows: sql.includes("'ASN'") ? [[1]] : [] };
	};
	const connection = await driver.connect(db2Spec());
	const features = await connection.features();
	assert.equal(features.asn, true);
	assert.equal(features.hadr, false);
	assert.equal(features.DPF, 'Database Partitioning');
	ibmdb.answer = () => ({ error: 'SQL0204N', sqlstate: '42704' });
	await assert.rejects(connection.features(), /Error Set feature monitor sqlstate: 42704/);
});

// ---- PostgreSQL and the catalog ------------------------------------------------------------

test('PostgreSQL numbers ? markers, leaving quoted text and comments alone', () => {
	assert.equal(PostgresConnection.numberPlaceholders("select ?, '?', \"a?\", $$x?$$, $q$?$q$, ? -- ?\n, /* ? */ ?"),
		"select $1, '?', \"a?\", $$x?$$, $q$?$q$, $2 -- ?\n, /* ? */ $3");
});

test('DriverCatalog reports ported, missing and unported drivers', () => {
	const installed = new FakeDriver({ id: 'AAA' });
	const missing = new (class extends FakeDriver { get isInstalled() { return false; } })({ id: 'BBB' });
	const catalog = new DriverCatalog([installed, missing]);
	assert.equal(catalog.driver('AAA'), installed);
	assert.throws(() => catalog.driver('BBB'), /needs npm package fake/);
	assert.throws(() => catalog.driver('NOPE'), /Connect driver NOPE not found/);
	const status = Object.fromEntries(catalog.status().map((d) => [d.name, d.level]));
	assert.deepEqual(status, { AAA: 'I', BBB: 'E', MYSQL: 'W', ODBC_SolidDB: 'W', ORACLE: 'W', SSH: 'W' });
	assert.deepEqual(catalog.available().map((d) => d.id), ['AAA']);
});
