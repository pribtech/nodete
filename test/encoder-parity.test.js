import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Config } from '../server/core/Config.js';
import { AppFiles } from '../server/core/AppFiles.js';
import { Messages } from '../server/core/Messages.js';
import { MenuEncoder } from '../server/encoders/MenuEncoder.js';
import { PhpReference } from './helpers/PhpReference.js';

const config = Config.load({ env: {} });
const notConnected = { isConnected: () => false };
const newEncoder = () => new MenuEncoder({
	files: new AppFiles(config.appRoot), config, messages: Messages.for('en_US'), connections: notConnected, log: { warn() {} },
});

test('layout using every encoder feature matches PHP JSONEncodeMenu', () => {
	const xml = readFileSync(new URL('./fixtures/layout-features.xml', import.meta.url), 'utf8');
	const node = PhpReference.normalise(newEncoder().encodePageWindowFromString(xml));
	const php = PhpReference.normalise(PhpReference.json('layout_features.json'));
	assert.deepEqual(node, php);
});

test('default core layout matches PHP', () => {
	const node = newEncoder().encodePageWindowFromFile('./preferences/default/TE_CORE_LAYOUT.xml');
	assert.deepEqual(PhpReference.normalise(node), PhpReference.normalise(PhpReference.json('layout_core.json')));
});

test('default home page layout matches PHP', () => {
	const node = newEncoder().encodePageWindowFromFile('./preferences/default/TE_HOME_PAGE.xml');
	assert.deepEqual(PhpReference.normalise(node), PhpReference.normalise(PhpReference.json('layout_home.json')));
});
