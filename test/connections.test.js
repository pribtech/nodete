// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ConnectionStore } from '../server/core/ConnectionStore.js';
import { DriverCatalog } from '../server/drivers/DriverCatalog.js';
import { TestServer } from './helpers/TestServer.js';
import { FakeDriver, column } from './helpers/FakeDriver.js';

const storeFile = () => path.join(mkdtempSync(path.join(tmpdir(), 'te-store-')), 'connStore.json');

// ---- connection store ------------------------------------------------------------------------

test('ConnectionStore saves without passwords, keeps an administrator password, lists by name', async () => {
	const file = storeFile();
	writeFileSync(file, JSON.stringify({ connections: [{ description: 'IBM_DB2:a@X', database: 'X', username: 'a', password: 'admin set', autoConnect: true }] }));
	const store = new ConnectionStore({ file });
	await store.save({ description: 'IBM_DB2:a@X', databaseDriver: 'IBM_DB2', database: 'X', username: 'a', password: 'typed', comment: 'c' });
	await store.save({ description: 'PostgreSQL:b@Y', databaseDriver: 'PostgreSQL', database: 'Y', username: 'b', password: 'typed' });
	const saved = JSON.parse(readFileSync(file, 'utf8')).connections;
	assert.deepEqual(saved.map((c) => [c.description, c.password ?? null]), [['IBM_DB2:a@X', 'admin set'], ['PostgreSQL:b@Y', '']]);
	const list = await store.list();
	assert.deepEqual(Object.keys(list), ['IBM_DB2:a@X', 'PostgreSQL:b@Y']);
	assert.deepEqual([list['IBM_DB2:a@X'].connectionType, list['IBM_DB2:a@X'].authenticated, list['IBM_DB2:a@X'].comment], ['save', false, 'c']);
	await store.remove('IBM_DB2:a@X');
	assert.deepEqual(Object.keys(await store.list()), ['PostgreSQL:b@Y']);
});

test('ConnectionStore without a file or with saving off does nothing', async () => {
	assert.deepEqual(await new ConnectionStore({ file: null }).list(), {});
	const file = storeFile();
	assert.equal(await new ConnectionStore({ file, writable: false }).save({ description: 'x' }), false);
	assert.deepEqual(await new ConnectionStore({ file }).list(), {}, 'a missing file is an empty store');
});

// ---- connection actions through the server, with an in-memory driver ---------------------------

const driver = new FakeDriver();
const file = storeFile();
let server;
before(async () => { server = await TestServer.start({}, { drivers: new DriverCatalog([driver]), connectionStore: new ConnectionStore({ file }) }); });
after(() => server.stop());

const LOGIN = {
	action: 'DBConnectionNewConnection', returntype: 'JSON', TE_DATABASE_LOGIN_DATABASE_DRIVER: 'FAKE', TE_DATABASE_LOGIN_DATABASE: 'SAMPLE',
	TE_DATABASE_LOGIN_USERNAME: 'me', TE_DATABASE_LOGIN_PASSWORD: 'secret', TE_DATABASE_LOGIN_HOSTNAME: 'h', TE_DATABASE_LOGIN_PORTNUMBER: '1',
};
const NAME = 'FAKE:me@SAMPLE.h:1';
const call = async (fields) => JSON.parse(await server.postActionText({ returntype: 'JSON', ...fields }));

test('log on, use, list, disconnect and remove a connection', async () => {
	assert.deepEqual(await call({ ...LOGIN, TE_DATABASE_LOGIN_PASSWORD: 'wrong' }), { returnCode: 'false', returnValue: 'password invalid' });

	const logon = await call(LOGIN);
	assert.equal(logon.returnCode, 'true');
	assert.equal(logon.returnValue.description, NAME);
	assert.equal('password' in logon.returnValue, false, 'the password never goes back to the browser');
	assert.deepEqual(logon.returnValue.dataServerInfo, { dataServerName: 'FAKE', dataServerVersion: '11.5', dataServerFixpack: 9, DBMS: 'DB2' });
	assert.equal(JSON.parse(readFileSync(file, 'utf8')).connections[0].password, '', 'saved for later, without the password');

	const check = await call({ action: 'DBConnectionCheck', USE_CONNECTION: NAME });
	assert.deepEqual([check.connectionStatus, check.connectionText], ['true', 'TE Connected: SAMPLE @ h as me']);
	assert.deepEqual(check.activeConnection.map((c) => [c.description, c.authenticated, c.activeConnection]), [[NAME, true, true]]);
	assert.ok(check.activeConnection.every((c) => !('password' in c)));

	driver.answer = () => ({ columns: [column('X')], rows: [['1']] });
	const sql = await call({ action: 'executeSQL', USE_CONNECTION: NAME, SQL: 'select x' });
	assert.deepEqual(sql.returnValue.resultSet[0].data, [['1']]);
	assert.deepEqual(driver.log.at(-1), ['close', NAME], 'the connection is closed when the request ends');

	assert.deepEqual(await call({ action: 'DBConnectionSetDefaultConnection', USE_CONNECTION: NAME }), { returnCode: 'true' });
	const features = await call({ action: 'DBConnectionRefreshFeatures', USE_CONNECTION: NAME });
	assert.deepEqual(features.returnValue.features, { javaBridge: false, javaSQL: false, ssh2: false, costEstimation: false, monitor: true });

	assert.deepEqual(await call({ action: 'DBConnectionDisconnect', TE_DATABASE_LOGIN_DESCRIPTION: encodeURIComponent(NAME) }), { returnCode: 'true', returnValue: 'true' });
	const after = await call({ action: 'DBConnectionCheck', USE_CONNECTION: NAME });
	assert.equal(after.connectionStatus, 'false');
	assert.deepEqual(after.activeConnection.map((c) => [c.description, c.authenticated]), [[NAME, false]], 'still offered as a saved connection');
	assert.equal((await call({ action: 'executeSQL', USE_CONNECTION: NAME, SQL: 'select x' })).returnValue, 'No connection found please login to a database');

	await call({ action: 'DBConnectionRemoveSaved', TE_DATABASE_LOGIN_DESCRIPTION: encodeURIComponent(NAME) });
	assert.deepEqual((await call({ action: 'DBConnectionCheck' })).activeConnection, []);
});

test('a blank password reuses the one given earlier for the same host and user', async () => {
	assert.equal((await call(LOGIN)).returnCode, 'true');
	assert.equal((await call({ ...LOGIN, TE_DATABASE_LOGIN_DATABASE: 'OTHER', TE_DATABASE_LOGIN_PASSWORD: '' })).returnCode, 'true');
	assert.equal((await call({ ...LOGIN, TE_DATABASE_LOGIN_HOSTNAME: 'elsewhere', TE_DATABASE_LOGIN_PASSWORD: '' })).returnCode, 'false');
});

test('saving from the form needs a database and a user', async () => {
	const save = { action: 'DBConnectionSaveConnection', TE_DATABASE_LOGIN_DATABASE_DRIVER: 'FAKE', TE_DATABASE_LOGIN_DATABASE: 'D', TE_DATABASE_LOGIN_USERNAME: 'u', TE_DATABASE_COMMENTS: 'note' };
	assert.deepEqual(await call(save), { returnCode: 'true', returnValue: 'true' });
	assert.equal(JSON.parse(readFileSync(file, 'utf8')).connections.find((c) => c.description === 'FAKE:u@D').comment, 'note');
	assert.deepEqual(await call({ ...save, TE_DATABASE_LOGIN_USERNAME: '' }), { returnCode: 'false', returnValue: 'Can not save the connection: @D' });
});

test('logging on gives the session a new id', async () => {
	const fresh = await TestServer.start({}, { drivers: new DriverCatalog([driver]) });
	try {
		await fresh.postAction({ action: 'DBConnectionCheck', returntype: 'JSON' });
		const before = fresh.cookie;
		await fresh.postAction(LOGIN);
		assert.notEqual(fresh.cookie, before);
		const check = JSON.parse(await fresh.postActionText({ action: 'DBConnectionCheck', returntype: 'JSON', USE_CONNECTION: NAME }));
		assert.equal(check.connectionStatus, 'true', 'session content survives the new id');
	} finally {
		await fresh.stop();
	}
});

test('with FORCE_CONNECTION_WITH_DEFAULT the configured connection is the only one', async () => {
	const forced = await TestServer.start({
		FORCE_CONNECTION_WITH_DEFAULT: true, DEFAULT_DATABASE_DRIVER: 'FAKE', DEFAULT_DATABASE: 'PROD', DEFAULT_DATABASE_USERNAME: 'svc', DEFAULT_DATABASE_PASSWORD: 'secret',
	}, { drivers: new DriverCatalog([driver]) });
	try {
		const call2 = async (fields) => JSON.parse(await forced.postActionText({ returntype: 'JSON', ...fields }));
		assert.equal((await call2(LOGIN)).returnCode, 'false', 'no other log on allowed');
		const check = await call2({ action: 'DBConnectionCheck', USE_CONNECTION: 'anything' });
		assert.deepEqual(check.activeConnection.map((c) => [c.description, c.comment, c.authenticated]), [['svc@PROD', 'Forced Connection', true]]);
		assert.equal(check.connectionStatus, 'true');
		driver.answer = () => ({ columns: [column('X')], rows: [['forced']] });
		assert.deepEqual((await call2({ action: 'executeSQL', USE_CONNECTION: 'anything', SQL: 'select' })).returnValue.resultSet[0].data, [['forced']]);
	} finally {
		await forced.stop();
	}
});
