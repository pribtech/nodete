import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { TestServer } from './helpers/TestServer.js';
import { PhpReference } from './helpers/PhpReference.js';

/*
 * The Node.js server must answer the front end exactly as the PHP version did.
 * Each case replays a request the console makes on start-up and compares with the
 * output recorded from PHP (test/fixtures/php-reference).
 */

let server;
before(async () => { server = await TestServer.start(); });
after(() => server.stop());

/**
 * Known, intended difference: PHP 8 removed the regex /e modifier the menu encoder
 * used to camel-case tutorial names, so PHP now sends tutorialName "". The Node port
 * keeps the original behaviour.
 */
const maskTutorialNames = (value) => JSON.parse(JSON.stringify(value), (key, v) => (key === 'tutorialName' ? '<tutorialName>' : v));

const MENU_CASES = {
	'menu_DeveloperSwitch.json': { baseMenuFolder: './menu/DeveloperSwitch' },
	'menu_righthand.json': { baseMenuFolder: './menu/righthandMenu/' },
	'menu_monitor.json': { rootCallBack: './menu/DeveloperSwitch/./menu_04_Monitor.json' },
	'menu_tutorials.json': { rootCallBack: './tutorials/./menu_03_tutorials.json' },
	'menu_clp.json': { rootCallBack: './menu/Commands/./menu_05_clpCommands.json' },
};

for (const [fixture, fields] of Object.entries(MENU_CASES)) {
	test(`menu ${JSON.stringify(fields)} matches PHP`, async () => {
		const text = await server.postActionText({ ...fields, USE_CONNECTION: '', returntype: 'JSON' }, '?action=menu');
		assert.match(text, /^\(.*\)$/s, 'menu responses are wrapped in parentheses');
		const node = maskTutorialNames(PhpReference.normalise(PhpReference.unwrapMenu(text)));
		const php = maskTutorialNames(PhpReference.normalise(PhpReference.menu(fixture)));
		assert.deepEqual(node, php);
	});
}

test('tutorial menu entries get a camel-cased tutorialName', async () => {
	const menu = PhpReference.unwrapMenu(await server.postActionText(
		{ rootCallBack: './menu/DeveloperSwitch/./menu_04_Monitor.json', returntype: 'JSON' }, '?action=menu'));
	const names = JSON.stringify(menu).match(/"tutorialName":"[^"]*"/g);
	assert.ok(names.includes('"tutorialName":"SetupBaseMonitors"'), names.join());
});

test('DBConnectionCheck matches PHP when not connected', async () => {
	const text = await server.postActionText({ touchConnection: 'false', returntype: 'JSON', USE_CONNECTION: '' }, '?action=DBConnectionCheck&returnType=JSON');
	assert.deepEqual(JSON.parse(text), PhpReference.json('DBConnectionCheck.json'));
});

test('getTEScript defines the same scripts as PHP, in the same order', async () => {
	const response = await server.get('/action.php?action=getTEScript');
	const text = await response.text();
	assert.ok(text.startsWith('\t\nGLOBAL_TE_SCRIPT_STORE = $H();\n'));
	const node = PhpReference.teScripts(text);
	const php = PhpReference.teScripts(PhpReference.text('getTEScript.js'));
	assert.deepEqual(Object.keys(node), Object.keys(php));
	assert.deepEqual(node, php);
});

test('titleBar HTML is byte-identical to PHP', async () => {
	const html = await server.postActionText({ USE_CONNECTION: '', action: 'titleBar', uniqueID: 'SuperStage_5_titleBar', stageID: 'SuperStage', windowID: '5', panelID: 'titleBar' });
	assert.equal(html, PhpReference.text('titleBar.html'));
});

test('about HTML is byte-identical to PHP', async () => {
	assert.equal(await server.postActionText({ action: 'about' }), PhpReference.text('about.html'));
});

test('JS constants on the index page match PHP', async () => {
	const html = await (await server.get('/')).text();
	const node = html.match(/try\{var .*/)[0];
	const php = PhpReference.text('jsConstants.txt').trim().replaceAll('\\/', '/'); // PHP json_encode escapes "/"
	assert.equal(node, php);
});

test('unknown action errors match PHP (JSON and HTML)', async () => {
	assert.deepEqual(JSON.parse(await server.postActionText({ action: 'nosuchaction', returntype: 'JSON' })), PhpReference.json('notfound.json'));
	assert.deepEqual(JSON.parse(await server.postActionText({ action: 'bad.name', returntype: 'JSON' })), PhpReference.json('badname.json'));
	assert.equal(await server.postActionText({ action: 'nosuchaction' }), PhpReference.text('notfound.html'));
});
