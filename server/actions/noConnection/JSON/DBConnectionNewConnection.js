// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { ReturnCodeAction } from '../../../core/ReturnCodeAction.js';
import { ConnectionSpec } from '../../../drivers/ConnectionSpec.js';

/** Logs on with the login form's details (PHP DBConnectionNewConnection.php). */
export default class DBConnectionNewConnectionAction extends ReturnCodeAction {
	async perform() {
		if (this.config.get('FORCE_CONNECTION_WITH_DEFAULT')) return ReturnCodeAction.refused('Can not form a connection');
		const spec = ConnectionSpec.fromLogin(this.request, this.config.get('DEFAULT_DATABASE_DRIVER'));
		try {
			const record = await this.connections.connect(spec);
			await this.session.renewId();
			return ReturnCodeAction.succeeded(record);
		} catch (error) {
			return ReturnCodeAction.refused(error.message);
		}
	}
}
