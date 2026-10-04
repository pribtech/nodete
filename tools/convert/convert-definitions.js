#!/usr/bin/env node
/**
 * Converts the TE's XML definitions to JSON.
 *
 *   node tools/convert/convert-definitions.js [--delete]
 *
 * Converts, under db2te/: menu files (menu/ and tutorials/), TE scripts and action lists
 * (TEScripts/), page layouts (preferences/default/) and script lists (js/). Writes each
 * <name>.json next to <name>.xml; with --delete the XML is removed afterwards.
 * Table definitions, tutorial scripts and commands are still read as XML and are not touched.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { Config } from '../../server/core/Config.js';
import { Messages } from '../../server/core/Messages.js';
import { XmlNode } from '../../server/xml/XmlNode.js';
import { DefinitionConverter } from './DefinitionConverter.js';

const config = Config.load({ env: {} });
const app = config.appRoot;
const remove = process.argv.includes('--delete');

const converter = new DefinitionConverter({ messages: Messages.for('en_US'), acceptedOperators: config.get('ACCEPTED_OPERATORS') });
converter.configNames = new Set(Object.keys(JSON.parse(readFileSync(new URL('../../server/config/defaults.json', import.meta.url), 'utf8'))));

const walk = (dir, accept, found = []) => {
	for (const name of readdirSync(dir)) {
		const full = path.join(dir, name);
		if (statSync(full).isDirectory()) walk(full, accept, found);
		else if (accept(name, full)) found.push(full);
	}
	return found;
};

/**
 * TE scripts named by the action lists (TEScripts/actionList_*.xml), and the lists themselves.
 * Other XML under TEScripts/ is not converted yet: tutorial scripts (<tutorial>, read as raw
 * XML through a menu tutorial's source=) and <actionScript> files read by unported PHP actions.
 */
function teScriptFiles() {
	const base = path.join(app, 'TEScripts');
	const found = [];
	const visit = (dir) => {
		for (const list of readdirSync(dir).filter((n) => /^actionList_.*\.xml$/i.test(n))) {
			found.push([path.join(dir, list), 'actionList']);
			for (const entry of rootOf(path.join(dir, list)).childNodes) {
				if (entry.isNamed('action')) found.push([path.join(base, entry.getAttribute('file')), 'script']);
				else if (entry.isNamed('directory')) visit(path.join(dir, entry.textContent.trim()));
			}
		}
	};
	visit(base);
	return found;
}

/** [files, how to convert] for each definition kind. */
const rootOf = (file) => XmlNode.parse(readFileSync(file, 'utf8'));
const plan = [
	...walk(path.join(app, 'menu'), (n) => /\.xml$/i.test(n)).map((f) => [f, 'menu']),
	...walk(path.join(app, 'tutorials'), (n) => /^menu_.*\.xml$/i.test(n)).map((f) => [f, 'menu']),
	...teScriptFiles(),
	...walk(path.join(app, 'preferences', 'default'), (n) => /\.xml$/i.test(n)).map((f) => [f, 'pageWindow']),
	...walk(path.join(app, 'js'), (n) => /^jsList_.*\.xml$/i.test(n)).map((f) => [f, 'jsList']),
];

/**
 * Files renamed on conversion so name order (which decides menu order) stays as it was:
 * "X.v95.xml" sorted before "X.xml", but "X.v95.json" would sort after "X.json".
 */
const RENAMES = new Map([['menu/Commands/SystemDefinedRoutines/menu_70_REBIND_ROUTINE_PACKAGE.v95.xml', 'menu_70_REBIND_ROUTINE_PACKAGE-v95.json']]);
const jsonName = (file) => {
	const rename = RENAMES.get(path.relative(app, file));
	return rename ? path.join(path.dirname(file), rename) : file.replace(/\.xml$/i, '.json');
};

const skipped = [];
let converted = 0;
for (const [file, kind] of plan) {
	const root = rootOf(file);
	if (!root) throw new Error(`Not well-formed XML: ${file}`);
	if (kind === 'menu' && !root.isNamed('menu')) { skipped.push(`${path.relative(app, file)} (<${root.nodeName}>, read by the browser)`); continue; }
	const definition = {
		menu: () => converter.menu(root),
		script: () => converter.script(root),
		actionList: () => converter.actionList(root),
		pageWindow: () => (root.isNamed('pageWindow') ? converter.pageWindow(root) : null),
		jsList: () => converter.jsList(root),
	}[kind]();
	writeFileSync(jsonName(file), `${JSON.stringify(definition, null, '\t')}\n`);
	if (remove) unlinkSync(file);
	converted++;
}

console.log(`converted ${converted} files${remove ? ' (XML removed)' : ''}`);
if (skipped.length) console.log(`left as XML:\n  ${skipped.join('\n  ')}`);
console.log('dropped content the XML encoders never read:');
for (const [what, count] of [...converter.report].sort()) console.log(`  ${String(count).padStart(5)}  ${what}`);
