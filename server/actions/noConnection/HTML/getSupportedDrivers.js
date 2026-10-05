// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Action } from '../../../core/Action.js';

/** Script listing the usable database drivers in GLOBAL_TE_SUPPORTED_DRIVERS (PHP getSupportedDrivers.php). */
export default class GetSupportedDriversAction extends Action {
	async run() {
		const entries = this.drivers.available().map((driver) =>
			`GLOBAL_TE_SUPPORTED_DRIVERS.set('${driver.id}', ${JSON.stringify({ name: driver.id, default: driver.isDefault, attributes: driver.loginAttributes })});\n`);
		this.response.sendScript(`\n\t\tGLOBAL_TE_SUPPORTED_DRIVERS = $H();\n\n\t\t${entries.join('')}`);
	}
}
