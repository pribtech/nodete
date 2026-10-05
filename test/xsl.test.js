// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Config } from '../server/core/Config.js';
import { AppFiles } from '../server/core/AppFiles.js';
import { Messages } from '../server/core/Messages.js';
import { MenuBuilder } from '../server/definitions/MenuBuilder.js';
import { XmlMenuSource } from '../server/definitions/XmlMenuSource.js';

const config = Config.load({ env: {} });
const files = new AppFiles(config.appRoot);
const fixture = (name) => readFileSync(new URL(`./fixtures/xsl/${name}`, import.meta.url), 'utf8');
const connectedAs = (record) => ({ isConnected: () => true, currentRecord: () => record, open: async () => null });
const source = (record) => new XmlMenuSource({ files, config, messages: Messages.for('en_US'), connections: connectedAs(record) });
const words = (text) => text.replace(/\s+/g, ' ').trim();

/*
 * The object navigator's stylesheet, run by xslt-processor, must write what PHP's libxslt
 * wrote (test/fixtures/xsl/*.php.txt, recorded with PHP 8.3 XSLTProcessor).
 */
for (const sample of ['navigator-sample', 'databases-sample'])
	for (const databaseDriver of ['DB2', 'IBM_DB2'])
		test(`object2Menu on ${sample} for ${databaseDriver} matches libxslt`, async () => {
			const menuXml = await source({ databaseDriver, dataServerInfo: { dataServerName: 'DB2/LINUXX8664', dataServerFixpack: 9 } })
				.transform(fixture(`${sample}.xml`), 'XSL/object2Menu');
			assert.equal(words(menuXml), words(fixture(`${sample}.${databaseDriver}.php.txt`)));
		});

test('a stylesheet result builds into menus, with branches left for the browser to load', async () => {
	const builder = new MenuBuilder({ files, config, connections: connectedAs({ databaseDriver: 'IBM_DB2' }), log: { warn() {}, error() {} } });
	const nodes = builder.xmlBranch({ branchXML: fixture('navigator-sample.xml'), branchXSL: 'XSL/object2Menu', dropParent: '' }, './menu', null, '/developer');
	assert.deepEqual(nodes, [], 'filled in by resolveDeferred');
	await builder.resolveDeferred();
	const [database] = nodes;
	assert.equal(database.elementValue, 'SAMPLE');
	const groups = Object.fromEntries(database.elementSubNodes.map((n) => [n.elementValue.replace(/\s+\(.*/, ''), n.elementSubNodes]));
	assert.deepEqual(groups.Schemas.map((n) => n.elementValue), ['APP', 'SYSCAT']);
	const [table] = groups.Tables;
	assert.equal(table.nodeType, 'DELAYLOADBRANCH', 'a table\'s columns are queried when the browser opens it');
	assert.equal(JSON.parse(table.rootCallBack).branchXSL, 'XSL/table2Menu');
	assert.equal(groups.Tables[1].elementValue, 'APP.DEPT & CO');
});

test('stylesheet problems become error menus', async () => {
	const builder = new MenuBuilder({ files, config, connections: connectedAs({}), log: { warn() {}, error() {} } });
	const missing = builder.xmlBranch({ branchXML: '<a/>', branchXSL: 'XSL/noSuchSheet' }, './menu', null, '/x');
	const internal = builder.xmlBranch({ branchXML: '$connectionProfile', branchXSL: 'XSL/object2Menu' }, './menu', null, '/x');
	await builder.resolveDeferred();
	assert.equal(missing[0].elementValue, 'branchXSL file XSL/noSuchSheet" not found or XSL invalid');
	assert.equal(internal[0].elementValue, 'branchXML internal function $connectionProfile not found');
});

test('a dropped parent that is itself a deferred branch hands its menus to the branch above', async () => {
	const definitions = {
		outer: { type: 'branch', branchXML: 'inner', branchXSL: 'S' },
		inner: { type: 'embeddedBranch', description: 'Inner', menus: [{ type: 'leaf', description: 'leaf' }] },
	};
	const xmlMenus = { transform: async (xml) => xml, definition: (xml) => definitions[xml] };
	const builder = new MenuBuilder({ files, config, connections: connectedAs({}), xmlMenus });
	const nodes = builder.xmlBranch({ branchXML: 'outer', branchXSL: 'S', dropParent: 'true' }, './menu', null, '/x');
	await builder.resolveDeferred();
	assert.deepEqual(nodes.map((n) => n.elementValue), ['Inner']);
	assert.deepEqual(nodes[0].elementSubNodes.map((n) => n.elementValue), ['leaf']);
});
