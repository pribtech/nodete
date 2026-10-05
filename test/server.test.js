import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { TestServer } from './helpers/TestServer.js';
import { Db2Driver } from '../server/drivers/Db2Driver.js';

let server;
before(async () => { server = await TestServer.start(); });
after(() => server.stop());

test('index page loads the front-end scripts and both layouts', async () => {
	const response = await server.get('/');
	assert.equal(response.status, 200);
	assert.match(response.headers.get('content-type'), /text\/html/);
	const html = await response.text();
	assert.doesNotMatch(html, /\{\{\w+\}\}/, 'every template slot is filled');
	assert.match(html, /<title>TE Not Connected<\/title>/);
	assert.match(html, /<script type='text\/javascript' src='\.\/js\/prototype\.js'><\/script>/);
	assert.match(html, /src='action\.php\?action=getTEScript'/);
	assert.match(html, /var TE_HOME_PAGE = \(\{"reloadOnConnectionChange"/);
	assert.match(html, /var layout = \(\{"reloadOnConnectionChange"/);
	assert.ok(html.includes('getDOMParsed ("tableDefinitions/dimensions/'));
});

test('/index.php still works for old bookmarks', async () => {
	assert.equal((await server.get('/index.php')).status, 200);
});

test('static front-end files are served', async () => {
	const response = await server.get('/js/prototype.js');
	assert.equal(response.status, 200);
	assert.match(response.headers.get('content-type'), /javascript/);
});

test('PHP sources and the connection store are never served', async () => {
	for (const path of ['/config.php', '/action.php.bak', '/base/UtilGeneric.php', '/connectionStore/feedSourceList.xml'])
		assert.equal((await server.get(path)).status, 404, path);
});

test('menu callbacks cannot read files outside the application folder', async () => {
	const text = await server.postActionText({ rootCallBack: '../../../../../../etc/passwd', returntype: 'JSON' }, '?action=menu');
	assert.doesNotMatch(text, /root:/);
	const files = await server.postActionText({ baseMenuFolder: '/etc', returntype: 'JSON' }, '?action=menu');
	assert.equal(files, '("")', 'folder outside the app is treated as missing');
});

test('menu error labels escape the requested path', async () => {
	const menu = await server.postActionText({ baseMenuFolder: './menu', rootCallBack: './menu/<img src=x onerror=alert(1)>.xml', returntype: 'JSON' }, '?action=menu');
	assert.doesNotMatch(menu, /<img/);
});

test('TOUCH_OVERRIDE only accepts true/false (PHP echoed it into a script)', async () => {
	const html = await (await server.get('/?TOUCH_OVERRIDE=alert(document.cookie)')).text();
	assert.doesNotMatch(html, /alert\(document\.cookie\)/);
	assert.match(await (await server.get('/?TOUCH_OVERRIDE=true')).text(), /var IS_TOUCH_SYSTEM = true;/);
});

test('titleBar escapes caller IDs placed into script and HTML', async () => {
	const html = await server.postActionText({ action: 'titleBar', uniqueID: "x');alert(1);//<b>" });
	assert.doesNotMatch(html, /alert\(1\);\/\/<b>/);
	assert.ok(html.includes('x\\u0027);alert(1);//\\u003cb\\u003e_generatedLeftMenu'));
	assert.ok(html.includes('id="x&#39;);alert(1);//&lt;b&gt;_generatedLeftMenu"'));
});

test('actions that exist only in PHP so far say so', async () => {
	const reply = JSON.parse(await server.postActionText({ action: 'getFeedSources', returntype: 'JSON' }));
	assert.equal(reply.flagGeneralError, true);
	assert.equal(reply.returnValue, 'Action "getFeedSources" has not been ported to Node.js yet');
});

test('getSupportedDrivers lists the drivers whose npm package is installed, with the login form fields', async () => {
	const script = await (await server.get('/action.php?action=getSupportedDrivers')).text();
	assert.ok(script.startsWith('\n\t\tGLOBAL_TE_SUPPORTED_DRIVERS = $H();\n\n\t\t'));
	const drivers = Object.fromEntries([...script.matchAll(/GLOBAL_TE_SUPPORTED_DRIVERS\.set\('([^']+)', (.*)\);\n/g)].map((m) => [m[1], JSON.parse(m[2])]));
	assert.equal(drivers.PostgreSQL.default, false);
	assert.equal(drivers.PostgreSQL.attributes.password.name, 'TE_DATABASE_LOGIN_PASSWORD');
	assert.equal('IBM_DB2' in drivers, new Db2Driver().isInstalled, 'IBM_DB2 is listed only with ibm_db installed');
});

test('welcome page reports the Node.js runtime and driver status', async () => {
	const html = await server.postActionText({ action: 'welcome' });
	assert.match(html, /Welcome to the Technology Explorer for IBM DB2 v5\.0/);
	assert.match(html, /Server Node\.js v\d+/);
	assert.match(html, /<td>PostgreSQL<\/td><td style="background-color:limegreen;">OK<\/td>/);
	assert.match(html, /<td>MYSQL<\/td><td style="background-color:limegreen;">OK<\/td>/);
	assert.match(html, /<td>ORACLE<\/td><td style="background-color:YELLOW;">Not yet ported to Node\.js<\/td>/);
});
