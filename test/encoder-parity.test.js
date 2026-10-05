// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Config } from '../server/core/Config.js';
import { AppFiles } from '../server/core/AppFiles.js';
import { Messages } from '../server/core/Messages.js';
import { XmlNode } from '../server/xml/XmlNode.js';
import { MenuBuilder } from '../server/definitions/MenuBuilder.js';
import { DefinitionConverter } from '../server/xml/DefinitionConverter.js';
import { PhpReference } from './helpers/PhpReference.js';

const config = Config.load({ env: {} });
const notConnected = { isConnected: () => false };
const newBuilder = () => new MenuBuilder({ files: new AppFiles(config.appRoot), config, connections: notConnected, log: { warn() {} } });

test('XML layout using every feature, converted to JSON and built, matches PHP JSONEncodeMenu', () => {
	const converter = new DefinitionConverter({ messages: Messages.for('en_US'), acceptedOperators: config.get('ACCEPTED_OPERATORS') });
	converter.configNames = new Set(['ACTION_PROCESSOR']);
	const xml = readFileSync(new URL('./fixtures/layout-features.xml', import.meta.url), 'utf8');
	const definition = JSON.parse(JSON.stringify(converter.pageWindow(XmlNode.parse(xml)))); // as stored on disk
	const built = newBuilder().pages.pageWindow(definition);
	assert.deepEqual(PhpReference.normalise(built), PhpReference.normalise(PhpReference.json('layout_features.json')));
});

test('default core layout matches PHP', () => {
	const built = newBuilder().pageWindowFromFile('./preferences/default/TE_CORE_LAYOUT.json');
	assert.deepEqual(PhpReference.normalise(built), PhpReference.normalise(PhpReference.json('layout_core.json')));
});

test('default home page layout matches PHP', () => {
	const built = newBuilder().pageWindowFromFile('./preferences/default/TE_HOME_PAGE.json');
	assert.deepEqual(PhpReference.normalise(built), PhpReference.normalise(PhpReference.json('layout_home.json')));
});
