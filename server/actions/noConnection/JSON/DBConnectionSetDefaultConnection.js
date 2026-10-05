// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Action } from '../../../core/Action.js';

/** Checks that the connection named by USE_CONNECTION can be opened (PHP DBConnectionSetDefaultConnection.php). */
export default class DBConnectionSetDefaultConnectionAction extends Action {
	async run() {
		try {
			return { returnCode: await this.connections.open() === null ? 'false' : 'true' };
		} catch {
			return { returnCode: 'false' };
		}
	}
}
