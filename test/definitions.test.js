import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Config } from '../server/core/Config.js';
import { AppFiles } from '../server/core/AppFiles.js';
import { Messages } from '../server/core/Messages.js';
import { XmlNode } from '../server/xml/XmlNode.js';
import { MenuBuilder } from '../server/definitions/MenuBuilder.js';
import { PageBuilder } from '../server/definitions/PageBuilder.js';
import { ScriptDefinition } from '../server/definitions/ScriptDefinition.js';
import { Requirements } from '../server/definitions/Requirements.js';
import { DefinitionConverter } from '../tools/convert/DefinitionConverter.js';

const config = Config.load({ env: {} });
const app = config.appRoot;
const files = new AppFiles(app);
const silent = { warn() {} };
const newBuilder = () => new MenuBuilder({ files, config, connections: { isConnected: () => false }, log: silent });

const walk = (dir, accept, found = []) => {
	for (const name of readdirSync(dir)) {
		const full = path.join(dir, name);
		if (statSync(full).isDirectory()) walk(full, accept, found);
		else if (accept(name)) found.push(full);
	}
	return found;
};
const relative = (file) => `./${path.relative(app, file)}`;

// ---- integrity of the definition files in the repository ----------------------------

test('every menu definition is valid JSON and builds', () => {
	const menus = [...walk(path.join(app, 'menu'), (n) => n.endsWith('.json')), ...walk(path.join(app, 'tutorials'), (n) => /^menu_.*\.json$/i.test(n))];
	assert.ok(menus.length > 900, `found ${menus.length}`);
	const builder = newBuilder();
	for (const file of menus) {
		const definition = JSON.parse(readFileSync(file, 'utf8'));
		assert.ok(builder.node(definition, '.', path.dirname(relative(file)), null, path.basename(file)) !== undefined, file);
	}
});

/** Developer test menu that points outside the app on purpose (the path guard keeps it empty). */
const KNOWN_OUTSIDE_APP = new Set(['menu/developer/menu_99a_test.json']);

test('branch directories named by menus exist', () => {
	for (const file of walk(path.join(app, 'menu'), (n) => /^menu_.*\.json$/i.test(n))) {
		if (KNOWN_OUTSIDE_APP.has(path.relative(app, file))) continue;
		const { branchDirectory, rootDirectory } = JSON.parse(readFileSync(file, 'utf8'));
		if (branchDirectory) assert.ok(files.isDirectory(`${path.dirname(relative(file))}/${branchDirectory}`), `${file} -> ${branchDirectory}`);
		if (rootDirectory) assert.ok(files.isDirectory(rootDirectory), `${file} -> ${rootDirectory}`);
	}
});

test('every script named by an action list exists and builds', () => {
	const builder = newBuilder();
	const lists = walk(path.join(app, 'TEScripts'), (n) => /^actionList_.*\.json$/i.test(n));
	assert.ok(lists.length >= 1);
	for (const list of lists)
		for (const entry of JSON.parse(readFileSync(list, 'utf8')).entries.filter((e) => e.action)) {
			const script = builder.readDefinition(`./TEScripts/${entry.file}`);
			assert.ok(script !== undefined, `${entry.action} -> ${entry.file} missing`);
			builder.script(script);
		}
});

test('every script list entry points at an existing file or folder', () => {
	const check = (location, entries) => {
		for (const entry of entries) {
			if (entry.file) assert.ok(files.isFile(`${location}${entry.file.split('?')[0]}`), `${location}${entry.file}`); // URLs may carry a query
			if (entry.directory) assert.ok(files.isDirectory(`${location}${entry.directory}`), `${location}${entry.directory}`);
			if (entry.entries) check(location, entry.entries);
		}
	};
	for (const list of walk(path.join(app, 'js'), (n) => /^jsList_.*\.json$/i.test(n)))
		check(`${path.dirname(relative(list))}/`, JSON.parse(readFileSync(list, 'utf8')).entries);
});

test('default layouts build', () => {
	for (const name of ['TE_CORE_LAYOUT', 'TE_HOME_PAGE', 'TE_TOUCH_LAYOUT'])
		assert.equal(newBuilder().pageWindowFromFile(`./preferences/default/${name}.json`).content !== null, true, name);
});

// ---- builders ---------------------------------------------------------------------------

test('Requirements keep only non-defaults and restore all eight fields', () => {
	const full = { ...Requirements.defaults, DBMS: 'DB2', minVersion: 9.7 };
	assert.deepEqual(Requirements.compact(full), { DBMS: 'DB2', minVersion: 9.7 });
	assert.deepEqual(Requirements.expand({ DBMS: 'DB2', minVersion: 9.7 }), full);
	assert.equal(Requirements.compact(Requirements.defaults), null);
});

test('ScriptDefinition compacts and restores requirements exactly', () => {
	const wire = {
		...Requirements.defaults, type: 'action', name: 'a', parameterList: [{ type: 'parameter', name: 'p', check: [{ ...Requirements.defaults, feature: 'x', type: 'IF', taskList: [] }] }],
		tasks: [{ type: 'task', taskList: { type: 'taskList', repeat: 1, tasks: [{ type: 'IF', compareOn: '', taskList: [] }], ...Requirements.defaults } }],
	};
	const stored = ScriptDefinition.compact(wire);
	assert.equal(Object.hasOwn(stored, 'DBMS'), false);
	assert.deepEqual(stored.parameterList[0].check[0].requires, { feature: 'x' });
	assert.equal(Object.hasOwn(stored.tasks[0].taskList.tasks[0], 'DBMS'), false, 'follow-on IFs carry no requirements');
	assert.deepEqual(ScriptDefinition.expand(stored, (task) => task), wire);
});

test('PageBuilder resolves link defaults and parameter directives per request', () => {
	const pages = new PageBuilder({ config, buildMenu: () => null });
	pages.defaultTarget = 'T'; pages.defaultWindow = 'W'; pages.defaultStage = 'S';
	pages.setVariable('CURRENT_MENU_LOCATION', './menu/x');
	const link = pages.link({ type: 'html', address: 'a.html', parameters: {
		where: { $var: 'CURRENT_MENU_LOCATION' },
		unset: { $var: 'CURRENT_TUTORIAL', default: 'fallback' },
		setting: { $config: 'ACTION_PROCESSOR' },
		nested: { $link: { type: 'raw', raw: 'r' } },
		literal: { '@text': 'kept' },
	} });
	assert.equal(link.target, 'T');
	assert.equal(link.window, 'W');
	assert.equal(link.windowStage, 'S');
	assert.equal(link.type, 'HTML');
	assert.deepEqual(link.data, {
		baseDirectory: './html/', address: 'a.html',
		parameters: { where: './menu/x', unset: 'fallback', setting: 'action.php', nested: { target: 'T', window: 'W', windowStage: 'S', formList: [], type: 'RAW', data: 'r' }, literal: { '@text': 'kept' } },
	});
	assert.equal(pages.link({ type: 'action', text: 'plain' }).data, 'plain');
});

test('PageBuilder fills split pane gaps and inherits panel headers', () => {
	const pages = new PageBuilder({ config, buildMenu: () => null });
	const window = pages.pageWindow({ panelHeaders: { refreshEnabled: false }, content: { type: 'splitPane', panelA: { type: 'panel', name: 'a' } } });
	assert.equal(window.content.panelA.name, 'a');
	assert.equal(window.content.panelA.panelHeaders.refreshEnabled, false, 'panel inherits the window headers');
	assert.match(window.content.panelB.data, /No content was specified/);
	assert.equal(window.raiseToTop, true);
	assert.equal(window.windowType, 'NORMAL');
});

// ---- converter ------------------------------------------------------------------------------

test('converter writes compact menu definitions', () => {
	const converter = new DefinitionConverter({ messages: Messages.for('en_US'), acceptedOperators: config.get('ACCEPTED_OPERATORS') });
	converter.configNames = new Set(['ACTION_PROCESSOR']);
	const xml = `<menu type="leaf" DBMS="DB2" minVersion="9.7">
		<description>Tables</description>
		<pageWindow target="_active"><panel name="main" PrimaryContainer="true">
			<link type="action" connectionRequired="y"><parameterList>
				<parameter name="action">listTables</parameter>
				<parameter name="where" value="CURRENT_MENU_LOCATION"/>
			</parameterList></link>
		</panel></pageWindow>
	</menu>`;
	assert.deepEqual(converter.menu(XmlNode.parse(xml)), {
		description: 'Tables',
		requires: { DBMS: 'DB2', minVersion: 9.7 },
		pageWindows: [{ target: '_active', content: { type: 'panel', name: 'main', content: { link: { type: 'action', parameters: { action: 'listTables', where: { $var: 'CURRENT_MENU_LOCATION' } } } }, primaryContainer: true } }],
	});
	assert.equal(converter.report.get('ignored attribute <link> connectionRequired'), 1);
});
