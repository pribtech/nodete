import { ReturnCodeAction } from '../../../core/ReturnCodeAction.js';
import { ConnectionSpec } from '../../../drivers/ConnectionSpec.js';

/** Saves the login form's details, without the password, for later sessions (PHP DBConnectionSaveConnection.php). */
export default class DBConnectionSaveConnectionAction extends ReturnCodeAction {
	async perform() {
		const spec = ConnectionSpec.fromLogin(this.request, this.config.get('DEFAULT_DATABASE_DRIVER'))
			.with({ comment: this.param('TE_DATABASE_COMMENTS', '') });
		if (!await this.connections.save(spec))
			return ReturnCodeAction.refused(`Can not save the connection: ${spec.name.slice(spec.databaseDriver.length + 1)}`);
		return ReturnCodeAction.succeeded();
	}
}
