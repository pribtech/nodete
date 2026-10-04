import { Action } from '../../../core/Action.js';
import { MenuEncoder } from '../../../encoders/MenuEncoder.js';
import { XmlNode } from '../../../xml/XmlNode.js';

/**
 * Script that preloads the TE's shared script actions into GLOBAL_TE_SCRIPT_STORE
 * (PHP actions/noConnection/HTML/getTEScript.php). Reads every actionList_*.xml
 * under TEScripts/, following <directory> entries into subfolders.
 */
export default class GetTEScriptAction extends Action {
	#encoder;
	#baseDir;

	async run() {
		this.#encoder = new MenuEncoder({ files: this.files, config: this.config, messages: this.messages, connections: this.connections }).actions;
		this.#baseDir = this.config.get('TE_SCRIPTS_BASE_DIRECTORY');
		const lines = ['\t\nGLOBAL_TE_SCRIPT_STORE = $H();\n'];
		this.#loadActionFolder(this.#baseDir, lines);
		this.response.sendScript(lines.join(''));
	}

	#loadActionFolder(location, lines) {
		for (const file of this.files.listMatching(location, /^actionList_.*\.xml$/i)) {
			const list = XmlNode.parse(this.files.tryReadText(`${location}${file}`));
			if (!list?.isNamed('AutoLoadActionList')) continue;
			for (const entry of list.childNodes) {
				if (entry.isNamed('action'))
					lines.push(`GLOBAL_TE_SCRIPT_STORE.set('${entry.getAttribute('name')}',${JSON.stringify(this.#scriptAction(entry.getAttribute('file')))});\n`);
				else if (entry.isNamed('directory'))
					this.#loadActionFolder(`${location}${entry.textContent.trim()}/`, lines);
			}
		}
	}

	/** Action files are always relative to the TEScripts root, as in the PHP version. */
	#scriptAction(file) {
		const xml = this.files.tryReadText(`${this.#baseDir}${file}`);
		return xml === null ? null : this.#encoder.fromString(xml);
	}
}
