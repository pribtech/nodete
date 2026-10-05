// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { BindParameter } from '../server/drivers/BindParameter.js';
import { DatabaseError } from '../server/drivers/DatabaseError.js';
import { Db2Features } from '../server/drivers/Db2Features.js';
import { PostgresConnection } from '../server/drivers/PostgresDriver.js';
import { DriverCatalog } from '../server/drivers/DriverCatalog.js';
import { FakeDriver, column } from './helpers/FakeDriver.js';

const spec = (fields = {}) => new ConnectionSpec({ databaseDriver: 'IBM_DB2', database: 'SAMPLE', username: 'db2inst1', password: 'pw', hostname: 'db.example', portnumber: '50000', ...fields });

// ---- value classes ---------------------------------------------------------------------

test('ConnectionSpec names connections as the PHP version did', () => {
	assert.equal(spec().name, 'IBM_DB2:db2inst1@SAMPLE.db.example:50000');
	assert.equal(spec({ hostname: '' }).name, 'IBM_DB2:db2inst1@SAMPLE');
	assert.equal(spec({ portnumber: '' }).isCataloged, true);
	assert.equal(spec().isCataloged, false);
	assert.equal(spec({ database: ' ' }).validate(), 'No database specified!');
	assert.equal(spec({ username: '' }).validate(), 'No username specified!');
	assert.ok(Object.isFrozen(spec()));
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

test('DatabaseError keeps the SQLSTATE of driver errors', () => {
	assert.equal(DatabaseError.from(Object.assign(new Error('x'), { sqlstate: '42704' })).sqlstate, '42704');
	assert.equal(DatabaseError.from(Object.assign(new Error('x'), { code: '42P01' })).sqlstate, '42P01');
	assert.equal(DatabaseError.from(Object.assign(new Error('x'), { code: 'ECONNREFUSED' })).sqlstate, '99999');
});

// ---- DB2 feature checks ---------------------------------------------------------------------

test('Db2Features: TE feature checks plus licensed features', async () => {
	const driver = new FakeDriver();
	driver.answer = (sql) => {
		if (sql.includes('ENV_FEATURE_INFO')) return { columns: [column('FEATURE_NAME'), column('FEATURE_FULLNAME')], rows: [['DPF', 'Database Partitioning']] };
		return { columns: [column('1', 'integer')], rows: sql.includes("'ASN'") ? [['1']] : [] };
	};
	const connection = await driver.connect(new ConnectionSpec({ databaseDriver: 'FAKE', database: 'D', username: 'u', password: 'secret' }));
	const features = await Db2Features.read(connection);
	assert.deepEqual([features.asn, features.hadr, features.DPF], [true, false, 'Database Partitioning']);
	driver.answer = () => { throw new DatabaseError('SQL0204N', '42704'); };
	await assert.rejects(Db2Features.read(connection), /Error Set feature monitor sqlstate: 42704/);
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
	assert.throws(() => catalog.driver('BBB'), /BBB is not usable: npm package fake not installed/);
	assert.throws(() => catalog.driver('NOPE'), /Connect driver NOPE not found/);
	const status = Object.fromEntries(catalog.status().map((d) => [d.name, d.level]));
	assert.deepEqual(status, { AAA: 'I', BBB: 'E', ODBC_SolidDB: 'W', ORACLE: 'W', SSH: 'W' });
	assert.deepEqual(catalog.available().map((d) => d.id), ['AAA']);
});
