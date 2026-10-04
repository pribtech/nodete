import { Action } from '../../../core/Action.js';
import { DriverCatalog } from '../../../drivers/DriverCatalog.js';

/** Script listing the usable database drivers in GLOBAL_TE_SUPPORTED_DRIVERS (PHP getSupportedDrivers.php). */
export default class GetSupportedDriversAction extends Action {
	async run() {
		const entries = new DriverCatalog().available().map((driver) =>
			`GLOBAL_TE_SUPPORTED_DRIVERS.set('${driver.name}', ${JSON.stringify({ name: driver.name, default: driver.isDefault, attributes: [] })});\n`);
		this.response.sendScript(`\n\t\tGLOBAL_TE_SUPPORTED_DRIVERS = $H();\n\n\t\t${entries.join('')}`);
	}
}
