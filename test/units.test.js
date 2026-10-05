// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Config } from '../server/core/Config.js';
import { Messages } from '../server/core/Messages.js';
import { AppFiles } from '../server/core/AppFiles.js';
import { ActionRequest } from '../server/core/ActionRequest.js';
import { XmlNode } from '../server/xml/XmlNode.js';
import { PhpCompat } from '../server/util/PhpCompat.js';
import { Escape } from '../server/util/Escape.js';

test('Config has the PHP values and is read-only', () => {
	const config = Config.load({ env: {} });
	assert.equal(config.get('ACTION_PROCESSOR'), 'action.php');
	assert.equal(config.get('MAIN_MENU_ROOT_DIRECTORY'), './menu/DeveloperSwitch');
	assert.equal(config.versionString, '5.0.1953');
	assert.throws(() => config.get('NO_SUCH_SETTING'), /Unknown config setting/);
	assert.ok(Object.isFrozen(config));
});

test('Config takes TE_ environment overrides, keeping types', () => {
	const config = Config.load({ env: { TE_SESSION_TIMEOUT_IN_MIN: '5', TE_DEVELOPMENT_MODE: 'false', TE_TE_LANGUAGE: 'en_US' } });
	assert.equal(config.get('SESSION_TIMEOUT_IN_MIN'), 5);
	assert.equal(config.get('DEVELOPMENT_MODE'), false);
	assert.equal(config.get('TE_LANGUAGE'), 'en_US');
});

test('Messages substitute ?NAME? placeholders and fall back to the default language', () => {
	assert.equal(Messages.for('en_US').format('ACTION_NOT_FOUND_W_NAME', { ACTION: 'x' }), 'Action "x" not found');
	assert.equal(Messages.for('../../etc').language, 'en_US');
	assert.equal(Messages.for('en_US').get('NO_SUCH_KEY'), 'NO_SUCH_KEY');
});

test('ActionRequest reads query before body and treats "" as missing, like PHP', () => {
	const request = new ActionRequest({ query: { a: 'q', empty: '' }, body: { a: 'b', b: 'body', uniqueID: 'p1' } });
	assert.equal(request.getParameter('a'), 'q');
	assert.equal(request.getParameter('b'), 'body');
	assert.equal(request.getParameter('empty', 'default'), 'default');
	assert.equal(request.returnType, 'HTML');
	assert.equal(request.caller.page, 'p1');
});

test('AppFiles refuses paths outside the app folder', () => {
	const files = new AppFiles(Config.load({ env: {} }).appRoot);
	assert.ok(files.isFile('./index.php'));
	assert.throws(() => files.resolve('../package.json'), /outside application folder/);
	assert.equal(files.tryReadText('/etc/passwd'), null);
	assert.equal(files.isDirectory('/etc'), false);
	const sorted = files.listMatching('./menu/DeveloperSwitch', /^menu_.*\.xml$/i);
	assert.deepEqual(sorted, [...sorted].sort());
});

test('XmlNode keeps element children only and finds children ignoring case', () => {
	const node = XmlNode.parse('<menu type="leaf"><!-- c --><Description> Hi <b>there</b> </Description>text</menu>');
	assert.equal(node.childNodes.length, 1);
	assert.equal(node.getChildTextContent('description'), 'Hi there');
	assert.equal(node.getAttribute('type'), 'leaf');
	assert.equal(node.getAttribute('missing'), '');
	assert.equal(node.getAttribute('missing', null), null);
	assert.equal(XmlNode.parse('<broken>'), null);
	assert.equal(XmlNode.parse(''), null);
});

test('XmlNode applies PHP stripslashes to attribute values', () => {
	assert.equal(XmlNode.parse(String.raw`<a v="it\'s \\ ok"/>`).getAttribute('v'), String.raw`it's \ ok`);
});

test('XmlNode.arrayEncodeXML matches the PHP encoding', () => {
	const node = XmlNode.parse('<p a="1"><x>true</x><y>1</y><y>2</y></p>');
	assert.deepEqual(node.arrayEncodeXML(), { '@attributes': { a: '1' }, x: { '@text': true }, y: [{ '@text': '1' }, { '@text': '2' }] });
});

test('PhpCompat conversions', () => {
	assert.equal(PhpCompat.floatval('9.7fp2'), 9.7);
	assert.equal(PhpCompat.floatval('abc'), 0);
	assert.equal(PhpCompat.intval('3.9'), 3);
	assert.deepEqual(PhpCompat.assoc({}), []);
	assert.deepEqual(PhpCompat.assoc({ a: 1 }), { a: 1 });
	assert.ok(PhpCompat.isEmpty('') && PhpCompat.isEmpty([]) && !PhpCompat.isEmpty('0 '));
	assert.match(PhpCompat.uniqid(), /^[0-9a-f]{13}$/);
	assert.notEqual(PhpCompat.uniqid(), PhpCompat.uniqid());
});

test('Escape.jsString cannot break out of a string or script block', () => {
	const escaped = Escape.jsString(`'"</script>\\\n`);
	assert.doesNotMatch(escaped, /['"<>\n]/);
	assert.equal(JSON.parse(`"${escaped}"`), `'"</script>\\\n`);
});

test('Escape.inlineJson keeps JSON valid but cannot close a script block', () => {
	const json = Escape.inlineJson({ html: '</script><b>&' });
	assert.doesNotMatch(json, /[<>&]/);
	assert.deepEqual(JSON.parse(json), { html: '</script><b>&' });
});
