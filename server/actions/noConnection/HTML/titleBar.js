import { Action } from '../../../core/Action.js';
import { Template } from '../../../pages/Template.js';
import { Escape } from '../../../util/Escape.js';

/** The menu bar across the top of the console (PHP titleBar.php). */
export default class TitleBarAction extends Action {
	async run() {
		const caller = this.request.caller;
		return Template.load('titleBar.html').render({
			pageJs: Escape.jsString(caller.page),
			pageAttr: Escape.html(caller.page),
			stageJs: Escape.jsString(caller.stage),
			windowJs: Escape.jsString(caller.window),
			panelJs: Escape.jsString(caller.panel),
			leftMenuJs: Escape.jsString(this.param('menuFolder', this.config.get('MAIN_MENU_ROOT_DIRECTORY'))),
			rightMenuJs: Escape.jsString(this.param('rightMenuFolder', this.config.get('MAIN_RIGHT_MENU_ROOT_DIRECTORY'))),
		});
	}
}
