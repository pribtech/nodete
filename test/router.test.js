import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import { Config } from '../server/core/Config.js';
import { AppFiles } from '../server/core/AppFiles.js';
import { ActionRegistry } from '../server/core/ActionRegistry.js';
import { ActionRouter } from '../server/core/ActionRouter.js';

const FIXTURE_ACTIONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'actions');

/** Router over the fixture actions; header x-connected: <name> marks that connection as open. */
class RouterHarness {
	#server;
	#base;

	async start() {
		const config = Config.load({ env: {} });
		const router = new ActionRouter({
			config,
			registry: new ActionRegistry(FIXTURE_ACTIONS),
			files: new AppFiles(config.appRoot),
			log: { info() {}, warn() {}, error() {} },
		});
		const app = express();
		app.use(express.urlencoded({ extended: true }));
		app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
		app.use((req, res, next) => {
			const name = req.get('x-connected');
			if (name) req.session.Connections = { [name]: { authenticated: true } };
			next();
		});
		app.all('/action.php', (req, res) => router.handle(req, res));
		this.#server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
		this.#base = `http://127.0.0.1:${this.#server.address().port}`;
	}

	async call(fields, connectedAs = null) {
		const response = await fetch(`${this.#base}/action.php`, {
			method: 'POST', body: new URLSearchParams(fields), headers: connectedAs ? { 'x-connected': connectedAs } : {},
		});
		return { type: response.headers.get('content-type'), text: await response.text() };
	}

	stop() { return new Promise((resolve) => this.#server.close(resolve)); }
}

const harness = new RouterHarness();
before(() => harness.start());
after(() => harness.stop());

test('noConnection action runs without a connection', async () => {
	const { text } = await harness.call({ action: 'both', returntype: 'JSON' });
	assert.deepEqual(JSON.parse(text), { scope: 'noConnection' });
});

test('activeConnection version is preferred once connected', async () => {
	const { text } = await harness.call({ action: 'both', returntype: 'JSON', USE_CONNECTION: 'db1' }, 'db1');
	assert.deepEqual(JSON.parse(text), { scope: 'activeConnection' });
});

test('connection-only action replies "not connected" when there is no connection', async () => {
	const { text } = await harness.call({ action: 'needsDb', returntype: 'JSON', USE_CONNECTION: 'db1' });
	assert.deepEqual(JSON.parse(text), {
		flagGeneralError: false, connectionError: false, returnCode: 'false',
		returnValue: 'No connection found please login to a database', returnMessage: 'No connection found please login to a database',
	});
});

test('connection-only action runs when its connection is open', async () => {
	const { text } = await harness.call({ action: 'needsDb', returntype: 'JSON', USE_CONNECTION: 'db1' }, 'db1');
	assert.deepEqual(JSON.parse(text), { scope: 'activeConnection' });
});

test('HTML actions return their string with an HTML content type', async () => {
	const { type, text } = await harness.call({ action: 'hello', who: 'TE' });
	assert.match(type, /text\/html/);
	assert.equal(text, 'hello TE');
});

test('return type selects the action folder', async () => {
	const { text } = await harness.call({ action: 'hello', returntype: 'JSON' });
	assert.equal(JSON.parse(text).returnValue, 'Action "hello" not found');
});

test('actions in subfolders are addressed with a slash', async () => {
	const { text } = await harness.call({ action: 'sub/nested', returntype: 'JSON' });
	assert.deepEqual(JSON.parse(text), { nested: true });
});

test('an action that throws gets the PHP-style error reply', async () => {
	const { text } = await harness.call({ action: 'fails', returntype: 'JSON' });
	assert.deepEqual(JSON.parse(text), { flagGeneralError: true, connectionError: false, returnCode: 'false', returnValue: 'boom' });
});

test('files that do not export an Action are rejected', async () => {
	const { text } = await harness.call({ action: 'notAnAction', returntype: 'JSON' });
	assert.match(JSON.parse(text).returnValue, /must default-export a subclass of Action/);
});

test('action names with other characters are rejected before any lookup', async () => {
	for (const name of ['../x', 'a.b', '', 'a b']) {
		const { text } = await harness.call({ action: name, returntype: 'JSON' });
		assert.equal(JSON.parse(text).returnValue, `Poorly formed action: ${name}`, name);
	}
});
