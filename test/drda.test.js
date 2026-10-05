// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DdmRequest, DdmReply, DdmObject } from '../server/drivers/drda/Ddm.js';
import { Ccsid } from '../server/drivers/drda/Ccsid.js';
import { TypeDefinition } from '../server/drivers/drda/TypeDefinition.js';
import { ByteReader } from '../server/drivers/drda/ByteReader.js';
import { Sqlca } from '../server/drivers/drda/Sqlca.js';
import { RowDecoder, QueryDescriptor } from '../server/drivers/drda/QueryData.js';
import { DriverCatalog } from '../server/drivers/DriverCatalog.js';
import { ConnectionSpec } from '../server/drivers/ConnectionSpec.js';
import { BindParameter } from '../server/drivers/BindParameter.js';
import { TestServer } from './helpers/TestServer.js';

/*
 * The DRDA client (DB2's protocol, in JavaScript). Protocol pieces are tested on their own;
 * the rest runs against Apache Derby's network server, which speaks the same protocol:
 *   java -cp derby.jar:derbyshared.jar:derbytools.jar:derbynet.jar \
 *     org.apache.derby.drda.NetworkServerControl start -p 1527
 * with BUILTIN users (see README). TE_TEST_DERBY gives "user:password@host:port/database"
 * (default te:te@localhost:1527/tetest); the server tests are skipped when it cannot be reached.
 */
const [, user, password, host, port, database] = /^([^:]*):([^@]*)@([^:]*):(\d+)\/(.+)$/.exec(process.env.TE_TEST_DERBY ?? 'te:te@localhost:1527/tetest');
const catalog = new DriverCatalog();
const derby = (fields = {}) => new ConnectionSpec({ databaseDriver: 'Derby', database, username: user, password, hostname: host, portnumber: port, ...fields });
const unavailable = await catalog.driver('Derby').test(derby()).then(() => false, (error) => `Derby not reachable (${error.message})`);
const IN = (position, value, dataType = 'string') => BindParameter.from(position, { value, dataType, type: 'IN' });

// ---- protocol pieces --------------------------------------------------------------------------

test('requests and replies survive 32 KB segments and extended lengths', () => {
	const big = Buffer.alloc(100_000, 0x41);
	const request = new DdmRequest(Ccsid.UTF8).command(0x200A, (b) => b.uint16(0x11A2, 3), [[0x2414, (o) => o.raw(big)]]).command(0x200E);
	const bytes = request.toBuffer();
	assert.equal(bytes.readUInt16BE(0) & 0x8000, 0, 'the small command fits one segment');
	const replies = DdmReply.parseChain(bytes);
	assert.deepEqual(replies.map((r) => [r.type, r.correlation]), [[1, 1], [3, 1], [1, 2]], 'command, its data object (same correlator), next command');
	assert.equal(replies[1].objects[0].codePoint, 0x2414);
	assert.deepEqual(replies[1].objects[0].data, big, 'the 100 KB object is put back together');
	assert.equal(DdmReply.parseChain(bytes.subarray(0, bytes.length - 1)), null, 'an incomplete chain waits for more');
	assert.equal(replies[0].objects[0].get(0x11A2).data.readUInt16BE(0), 3);
});

test('extended length fields read as 0x8000 + 4 + number of length bytes', () => {
	const object = Buffer.from([0x80, 0x08, 0x24, 0x14, 0, 0, 0, 3, 1, 2, 3]);
	const [parsed] = DdmObject.parseAll(object);
	assert.deepEqual([parsed.codePoint, [...parsed.data]], [0x2414, [1, 2, 3]]);
});

test('EBCDIC (CCSID 500) for the first exchanges', () => {
	const bytes = Ccsid.EBCDIC.encode('SAMPLE db_1');
	assert.equal(bytes.toString('hex'), 'e2c1d4d7d3c54084826df1');
	assert.equal(Ccsid.EBCDIC.decode(bytes), 'SAMPLE db_1');
});

test('numbers follow the server byte order; packed decimals', () => {
	const x86 = new ByteReader(Buffer.from([0x01, 0x00, 0x00, 0x00]), new TypeDefinition('QTDSQLX86'));
	const asc = new ByteReader(Buffer.from([0x00, 0x00, 0x00, 0x01]), new TypeDefinition('QTDSQLASC'));
	assert.deepEqual([x86.int32(), asc.int32()], [1, 1]);
	assert.equal(RowDecoder.packedDecimal(Buffer.from('0001234c', 'hex'), 2), '12.34');
	assert.equal(RowDecoder.packedDecimal(Buffer.from('1234567d', 'hex'), 4), '-123.4567');
	assert.equal(RowDecoder.packedDecimal(Buffer.from('000c', 'hex'), 2), '0.00');
	assert.equal(RowDecoder.packedDecimal(Buffer.from('005d', 'hex'), 0), '-5');
});

test('an SQLCA with message tokens becomes a DatabaseError with its SQLSTATE', () => {
	const types = new TypeDefinition('QTDSQLASC');
	const tokens = Buffer.from('MYTABLE\u0014SELECT', 'utf8');
	const data = Buffer.concat([
		Buffer.from([0x00]), Buffer.from([0xFF, 0xFF, 0xFF, 0x34]), Buffer.from('42704SQLRI01F', 'latin1'),
		Buffer.from([0x00]), Buffer.alloc(24), Buffer.from(' '.repeat(11)), Buffer.from([0, 0]),
		Buffer.from([0, tokens.length]), tokens, Buffer.from([0, 0]), Buffer.from([0xFF]),
	]);
	const sqlca = Sqlca.read(new ByteReader(data, types));
	assert.deepEqual([sqlca.sqlcode, sqlca.sqlstate, sqlca.tokens], [-204, '42704', ['MYTABLE', 'SELECT']]);
	const error = sqlca.toError();
	assert.deepEqual([error.sqlstate, error.message], ['42704', 'SQLCODE=-204, SQLSTATE=42704: MYTABLE, SELECT']);
	assert.equal(Sqlca.read(new ByteReader(Buffer.from([0xFF]), types)), null, 'a null SQLCA is success');
});

test('a row cut at a block boundary is completed by the next block', () => {
	const descriptor = new QueryDescriptor([Buffer.from([0x09, 0x76, 0xD0, 0x03, 0x00, 0x04, 0x33, 0x00, 0x14])]);
	const decoder = new RowDecoder(descriptor, new TypeDefinition('QTDSQLASC'));
	const row = Buffer.from([0xFF, 0x00, 0x00, 0, 0, 0, 7, 0x00, 0, 3, 0x61, 0x62, 0x63]);
	assert.deepEqual(decoder.decode(row.subarray(0, 9)).rows, []);
	assert.deepEqual(decoder.decode(row.subarray(9)).rows, [['7', 'abc']]);
});

// ---- against Derby's network server ------------------------------------------------------------

test('log on errors: wrong password, unknown database, no server', { skip: unavailable }, async () => {
	await assert.rejects(catalog.driver('Derby').test(derby({ password: 'wrong' })), (e) => e.sqlstate === '28000' && /user ID or password invalid/.test(e.message));
	await assert.rejects(catalog.driver('Derby').test(derby({ database: 'nosuchdb' })), /nosuchdb/);
	await assert.rejects(catalog.driver('Derby').test(derby({ portnumber: '1' })), (e) => e.sqlstate === '08001');
	await assert.rejects(catalog.driver('IBM_DB2').test(derby({ databaseDriver: 'IBM_DB2' })), /DRDA syntax error/, "Derby's server refuses clients other than its own");
});

test('server information from the DRDA exchange', { skip: unavailable }, async () => {
	assert.deepEqual(await catalog.driver('Derby').test(derby()), { dataServerName: 'Apache Derby', dataServerVersion: '10.17', dataServerFixpack: 0, feature: [], DBMS: 'Derby' });
});

test('data types, nulls and large objects', { skip: unavailable }, async () => {
	const connection = await catalog.driver('Derby').connect(derby());
	try {
		try { await connection.rows('drop table te_types'); } catch { /* not there yet */ }
		await connection.rows('create table te_types (i int, s smallint, b bigint, r real, d double, n decimal(15,4), c char(5), v varchar(100), dt date, tm time, ts timestamp, cl clob(1M), bl blob(1M), bo boolean)');
		await connection.rows("insert into te_types values (?, 2, -3, 1.5, 2.25, -123.4567, ?, ?, '2024-02-29', '13:14:15', '2024-02-29 13:14:15.5', cast(cast(? as varchar(30000)) || cast(? as varchar(30000)) as clob), cast(X'00ff10' as blob), true)",
			[IN(1, '1', 'int'), IN(2, 'ab'), IN(3, "it's ü ✓"), IN(4, 'x'.repeat(30000)), IN(5, 'y'.repeat(30000))]);
		await connection.rows('insert into te_types (i) values (2)');
		const cursor = await connection.execute('select * from te_types order by i');
		assert.deepEqual(cursor.columns.map((c) => c.type), ['integer', 'smallint', 'bigint', 'real', 'double', 'decimal', 'char', 'varchar', 'date', 'time', 'timestamp', 'clob', 'blob', 'boolean']);
		const first = await cursor.next();
		const second = await cursor.next();
		await cursor.close();
		assert.deepEqual(first.slice(0, 11), ['1', '2', '-3', '1.5', '2.25', '-123.4567', 'ab   ', "it's ü ✓", '2024-02-29', '13:14:15', '2024-02-29-13.14.15.500000000']);
		assert.equal(first[11], 'x'.repeat(30000) + 'y'.repeat(30000), 'a 60 KB CLOB, sent apart from its row');
		assert.deepEqual([first[12], first[13]], [Buffer.from([0, 0xFF, 0x10]), 'true']);
		assert.deepEqual(second, ['2', ...Array(13).fill(null)]);
		await connection.rows('drop table te_types');
	} finally {
		await connection.close();
	}
});

test('the console on DRDA: log on, a batch that rolls back, status, database menus', { skip: unavailable }, async () => {
	const console = await TestServer.start();
	try {
		const call = async (fields) => JSON.parse(await console.postActionText({ returntype: 'JSON', ...fields }));
		const logon = await call({ action: 'DBConnectionNewConnection', TE_DATABASE_LOGIN_DATABASE_DRIVER: 'Derby', TE_DATABASE_LOGIN_DATABASE: database, TE_DATABASE_LOGIN_USERNAME: user, TE_DATABASE_LOGIN_PASSWORD: password, TE_DATABASE_LOGIN_HOSTNAME: host, TE_DATABASE_LOGIN_PORTNUMBER: port });
		assert.equal(logon.returnCode, 'true', JSON.stringify(logon));
		const USE_CONNECTION = logon.returnValue.description;
		await call({ action: 'executeSQL', USE_CONNECTION, SQL: 'create table te_console (a int)', commitPerSTMT: 'true' });
		try {
			const failed = await call({ action: 'executeSQL', USE_CONNECTION, 'SQL[0]': 'insert into te_console values (1)', 'SQL[1]': 'insert into nope values (1)' });
			assert.equal(failed.returnCode, 'false');
			const count = await call({ action: 'executeSQL', USE_CONNECTION, SQL: 'select count(*) from te_console where a > ?!name=min&dataType=int?', min: '0' });
			assert.deepEqual(count.returnValue.resultSet[0].data, [['0']], 'rolled back');
			assert.equal((await call({ action: 'DBConnectionCheck', USE_CONNECTION })).connectionStatus, 'true');
			const rootCallBack = JSON.stringify({ branchSQLXML: "values '<databases><database DB_NAME=@@@DERBY@@@/></databases>'", branchXSL: 'XSL/object2Menu', menulocation: '/developer' });
			const menu = JSON.parse((await console.postActionText({ rootCallBack, returntype: 'JSON', USE_CONNECTION }, '?action=menu')).slice(1, -1));
			assert.equal(menu[0].elementValue, 'Databases Apache Derby');
		} finally {
			await call({ action: 'executeSQL', USE_CONNECTION, SQL: 'drop table te_console', commitPerSTMT: 'true' });
		}
	} finally {
		await console.stop();
	}
});
