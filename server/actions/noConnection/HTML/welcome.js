import { Action } from '../../../core/Action.js';
import { Template } from '../../../pages/Template.js';
import { DriverCatalog } from '../../../drivers/DriverCatalog.js';
import { Escape } from '../../../util/Escape.js';

const LEVEL_COLOURS = { I: 'limegreen', W: 'YELLOW', E: 'RED' };

/** The welcome panel shown on start (PHP welcome.php). */
export default class WelcomeAction extends Action {
	async run() {
		return Template.load('welcome.html').render({
			version: this.config.get('TE_VERSION'),
			runtime: `Node.js ${Escape.html(process.version)}`,
			drivers: new DriverCatalog().status()
				.map((d) => `<tr><td>${d.name}</td><td style="background-color:${LEVEL_COLOURS[d.level]};">${Escape.html(d.message)}</td></tr>`)
				.join(''),
		});
	}
}
