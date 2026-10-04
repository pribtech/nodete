import { Action } from '../../../core/Action.js';
import { MenuBuilder } from '../../../definitions/MenuBuilder.js';

/**
 * Script that preloads the TE's shared script actions into GLOBAL_TE_SCRIPT_STORE
 * (PHP actions/noConnection/HTML/getTEScript.php). Reads every actionList_*.json
 * under TEScripts/, following "directory" entries into subfolders.
 *
 * An action list is {"entries": [{"action": "<name>", "file": "<script>.json"}, {"directory": "<sub>"}]};
 * script files are always relative to the TEScripts root.
 */
export default class GetTEScriptAction extends Action {
	#builder;
	#baseDir;

	async run() {
		this.#builder = new MenuBuilder({ files: this.files, config: this.config, connections: this.connections });
		this.#baseDir = this.config.get('TE_SCRIPTS_BASE_DIRECTORY');
		const lines = ['\t\nGLOBAL_TE_SCRIPT_STORE = $H();\n'];
		this.#loadActionFolder(this.#baseDir, lines);
		this.response.sendScript(lines.join(''));
	}

	#loadActionFolder(location, lines) {
		for (const file of this.files.listMatching(location, /^actionList_.*\.json$/i)) {
			const list = this.#builder.readDefinition(`${location}${file}`);
			for (const entry of list?.entries ?? []) {
				if (Object.hasOwn(entry, 'action'))
					lines.push(`GLOBAL_TE_SCRIPT_STORE.set('${entry.action}',${JSON.stringify(this.#script(entry.file))});\n`);
				else if (Object.hasOwn(entry, 'directory'))
					this.#loadActionFolder(`${location}${entry.directory}/`, lines);
			}
		}
	}

	#script(file) {
		const definition = this.#builder.readDefinition(`${this.#baseDir}${file}`);
		return definition ? this.#builder.script(definition) : null;
	}
}
