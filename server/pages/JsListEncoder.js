/**
 * The <script> tags for the front end's JavaScript, built from js/jsList_*.json
 * (PHP base/HTMLEncodeJSList.php).
 *
 * A list is {"entries": [...]} where each entry is one of
 *   {"file": "name.js", "min": "name-min.js"}     a script (min used when compressed files are enabled)
 *   {"group": "name", "min": "...", "entries": [...]}   scripts that can be served as one file
 *   {"directory": "sub"}                          the lists in a subfolder
 *   {"action": "name"}                            a script produced by action.php
 */
export class JsListEncoder {
	#files;
	#config;

	constructor({ files, config }) {
		this.#files = files;
		this.#config = config;
	}

	/** Script tags for the base JS folder and the language folder, in order. */
	encode(language) {
		const base = this.#config.get('JS_BASE_DIRECTORY');
		return this.#folder(base) + this.#folder(`${base}${this.#config.get('BASE_LANGUAGE_DIRECTORY')}${language}/`);
	}

	#folder(location) {
		let html = '';
		for (const file of this.#files.listMatching(location, /^jsList_.*\.json$/i)) {
			let list;
			try { list = JSON.parse(this.#files.readText(`${location}${file}`)); } catch { continue; }
			html += this.#entries(file, location, list.entries ?? []);
		}
		return html;
	}

	static #tag(src) { return `<script type='text/javascript' src='${src}'></script>\n`; }

	#entries(listFile, location, entries) {
		const compressed = this.#config.get('JS_COMPRESSED_FILES_ENABLED');
		const grouped = this.#config.get('JS_GROUP_FILES_ENABLED');
		const processor = this.#config.get('ACTION_PROCESSOR');
		let html = '';
		for (const entry of entries) {
			if (Object.hasOwn(entry, 'file'))
				html += JsListEncoder.#tag(location + (entry.min && compressed ? entry.min : entry.file));
			else if (Object.hasOwn(entry, 'group')) {
				if (entry.min && compressed && this.#files.isFile(location + entry.min)) html += JsListEncoder.#tag(location + entry.min);
				else if (grouped && entry.group !== null)
					html += JsListEncoder.#tag(`${processor}?${new URLSearchParams({ location, groupName: entry.group, jslistFileName: listFile, action: 'jsGroupLoad' })}`);
				else html += this.#entries(listFile, location, entry.entries ?? []);
			} else if (Object.hasOwn(entry, 'directory')) html += this.#folder(`${location}${entry.directory}/`);
			else if (Object.hasOwn(entry, 'action'))
				html += JsListEncoder.#tag(`${processor}?${new URLSearchParams({ action: entry.action })}`);
		}
		return html;
	}
}
