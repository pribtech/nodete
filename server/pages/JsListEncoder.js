import { XmlNode } from '../xml/XmlNode.js';

/**
 * The <script> tags for the front end's JavaScript, built from js/jsList_*.xml
 * (PHP base/HTMLEncodeJSList.php). Entries can name files, groups of files,
 * subfolders with their own lists, or actions served by action.php.
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
		for (const file of this.#files.listMatching(location, /^jsList_.*\.xml$/i)) {
			const list = XmlNode.parse(this.#files.tryReadText(`${location}${file}`));
			if (list?.isNamed('jsFileList')) html += this.#entries(file, location, list);
		}
		return html;
	}

	static #tag(src) { return `<script type='text/javascript' src='${src}'></script>\n`; }

	#entries(listFile, location, list) {
		const compressed = this.#config.get('JS_COMPRESSED_FILES_ENABLED');
		const grouped = this.#config.get('JS_GROUP_FILES_ENABLED');
		const processor = this.#config.get('ACTION_PROCESSOR');
		let html = '';
		for (const entry of list.childNodes) {
			const minName = entry.getAttribute('min-name', null);
			switch (entry.nodeName.toLowerCase()) {
				case 'file': {
					const name = entry.getAttribute('name', null);
					html += JsListEncoder.#tag(location + (!name ? entry.textContent.trim() : (minName && compressed ? minName : name)));
					break;
				}
				case 'group':
					if (minName && compressed && this.#files.isFile(location + minName)) html += JsListEncoder.#tag(location + minName);
					else if (grouped && entry.getAttribute('name', null) !== null)
						html += JsListEncoder.#tag(`${processor}?${new URLSearchParams({ location, groupName: entry.getAttribute('name'), jslistFileName: listFile, action: 'jsGroupLoad' })}`);
					else html += this.#entries(listFile, location, entry);
					break;
				case 'directory': {
					const folder = entry.getAttribute('name') || entry.textContent.trim();
					if (folder) html += this.#folder(`${location}${folder}/`);
					break;
				}
				case 'action':
					html += JsListEncoder.#tag(`${processor}?${new URLSearchParams({ action: entry.getAttribute('name') })}`);
					break;
				default: break;
			}
		}
		return html;
	}
}
