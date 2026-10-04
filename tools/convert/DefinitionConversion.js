import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import { XmlNode } from '../../server/xml/XmlNode.js';
import { DefinitionConverter } from '../../server/xml/DefinitionConverter.js';

/**
 * One run of the XML-to-JSON conversion over the TE's db2te/ folder. Converts, under the
 * app folder: menu files (menu/ and tutorials/), TE scripts and action lists (TEScripts/),
 * page layouts (preferences/default/), script lists (js/) and the saved connections
 * (connectionStore/connStore.xml). Writes each <name>.json next to <name>.xml.
 *
 * Table definitions, tutorial scripts and commands are still read as XML and not touched.
 */
export class DefinitionConversion {
	/**
	 * Files renamed on conversion so name order (which decides menu order) stays as it was:
	 * "X.v95.xml" sorted before "X.xml", but "X.v95.json" would sort after "X.json".
	 */
	static RENAMES = new Map([['menu/Commands/SystemDefinedRoutines/menu_70_REBIND_ROUTINE_PACKAGE.v95.xml', 'menu_70_REBIND_ROUTINE_PACKAGE-v95.json']]);

	#app;
	#converter;
	#log;
	#converted = 0;
	#skipped = [];

	/**
	 * @param {object} options
	 * @param {import('../../server/core/Config.js').Config} options.config
	 * @param {import('../../server/core/Messages.js').Messages} options.messages
	 */
	constructor({ config, messages, log = console }) {
		this.#app = config.appRoot;
		this.#log = log;
		this.#converter = new DefinitionConverter({ messages, acceptedOperators: config.get('ACCEPTED_OPERATORS') });
		this.#converter.configNames = config;
	}

	/** Converts every file of the plan; with remove, deletes each XML file once its JSON is written. */
	run({ remove = false } = {}) {
		for (const [file, kind] of this.plan()) this.#convert(file, kind, remove);
		return this;
	}

	/** [file, kind] for every XML file to convert. */
	plan() {
		const under = (...parts) => path.join(this.#app, ...parts);
		const store = under('connectionStore', 'connStore.xml');
		return [
			...this.#walk(under('menu'), (n) => /\.xml$/i.test(n)).map((f) => [f, 'menu']),
			...this.#walk(under('tutorials'), (n) => /^menu_.*\.xml$/i.test(n)).map((f) => [f, 'menu']),
			...this.#teScriptFiles(),
			...this.#walk(under('preferences', 'default'), (n) => /\.xml$/i.test(n)).map((f) => [f, 'pageWindow']),
			...this.#walk(under('js'), (n) => /^jsList_.*\.xml$/i.test(n)).map((f) => [f, 'jsList']),
			...(existsSync(store) ? [[store, 'connectionStore']] : []),
		];
	}

	/** Summary of the run: counts, files left as XML, and content dropped because nothing read it. */
	report() {
		const lines = [`converted ${this.#converted} files`];
		if (this.#skipped.length) lines.push(`left as XML:\n  ${this.#skipped.join('\n  ')}`);
		lines.push('dropped content the XML encoders never read:');
		for (const [what, count] of [...this.#converter.report].sort()) lines.push(`  ${String(count).padStart(5)}  ${what}`);
		return lines.join('\n');
	}

	#convert(file, kind, remove) {
		const root = XmlNode.parse(readFileSync(file, 'utf8'));
		if (!root) throw new Error(`Not well-formed XML: ${file}`);
		if (kind === 'menu' && !root.isNamed('menu')) {
			this.#skipped.push(`${path.relative(this.#app, file)} (<${root.nodeName}>, read by the browser)`);
			return;
		}
		writeFileSync(this.#jsonName(file), `${JSON.stringify(this.#definition(root, kind), null, '\t')}\n`);
		if (remove) unlinkSync(file);
		this.#converted++;
	}

	#definition(root, kind) {
		switch (kind) {
			case 'menu': return this.#converter.menu(root);
			case 'script': return this.#converter.script(root);
			case 'actionList': return this.#converter.actionList(root);
			case 'pageWindow': return root.isNamed('pageWindow') ? this.#converter.pageWindow(root) : null;
			case 'jsList': return this.#converter.jsList(root);
			case 'connectionStore': return DefinitionConversion.connectionStore(root);
			default: throw new Error(`Unknown definition kind ${kind}`);
		}
	}

	/**
	 * connStore.xml (<connectionList><SavedConnections><connection description=...>) as the
	 * {"connections": [...]} file the Node.js ConnectionStore reads. Recent and saved
	 * connections are both kept; passwords an administrator put in the file are kept.
	 */
	static connectionStore(root) {
		const connections = [];
		for (const group of root.childNodes)
			for (const node of group.childNodes) {
				const text = (name) => node.getChildTextContent(name).trim();
				const entry = { description: node.getAttribute('description') };
				if (node.hasAttribute('time')) entry.time = Number(node.getAttribute('time')) || node.getAttribute('time');
				for (const name of ['comment', 'databaseDriver', 'database', 'hostname', 'portnumber', 'group', 'username', 'password', 'schema']) entry[name] = text(name);
				for (const name of ['usePersistentConnection', 'autoConnect']) entry[name] = text(name).toLowerCase() === 'true';
				if (node.getAttribute('activeOnFirstLoad') === 'true') entry.activeOnFirstLoad = true;
				const trusted = node.findChildNode('trustedContext');
				if (trusted) entry.trustedContext = trusted.childNodes.filter((user) => user.isNamed('user')).map((user) => user.getAttribute('id'));
				if (entry.description) connections.push(entry);
			}
		return { connections };
	}

	#jsonName(file) {
		const rename = DefinitionConversion.RENAMES.get(path.relative(this.#app, file));
		return rename ? path.join(path.dirname(file), rename) : file.replace(/\.xml$/i, '.json');
	}

	#walk(dir, accept, found = []) {
		if (!existsSync(dir)) return found;
		for (const name of readdirSync(dir)) {
			const full = path.join(dir, name);
			if (statSync(full).isDirectory()) this.#walk(full, accept, found);
			else if (accept(name)) found.push(full);
		}
		return found;
	}

	/**
	 * TE scripts named by the action lists (TEScripts/actionList_*.xml), and the lists themselves.
	 * Other XML under TEScripts/ is not converted yet: tutorial scripts (<tutorial>, read as raw
	 * XML through a menu tutorial's source=) and <actionScript> files read by unported PHP actions.
	 */
	#teScriptFiles() {
		const base = path.join(this.#app, 'TEScripts');
		const found = [];
		const visit = (dir) => {
			if (!existsSync(dir)) return;
			for (const list of readdirSync(dir).filter((n) => /^actionList_.*\.xml$/i.test(n))) {
				const file = path.join(dir, list);
				found.push([file, 'actionList']);
				for (const entry of XmlNode.parse(readFileSync(file, 'utf8')).childNodes) {
					if (entry.isNamed('action')) found.push([path.join(base, entry.getAttribute('file')), 'script']);
					else if (entry.isNamed('directory')) visit(path.join(dir, entry.textContent.trim()));
				}
			}
		};
		visit(base);
		return found;
	}
}
