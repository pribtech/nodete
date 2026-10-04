import { ReturnCodeAction } from '../../../core/ReturnCodeAction.js';

/** Ends a connection for this session (PHP DBConnectionDisconnect.php). */
export default class DBConnectionDisconnectAction extends ReturnCodeAction {
	async perform() {
		const description = this.param('TE_DATABASE_LOGIN_DESCRIPTION');
		if (description === null || !await this.connections.disconnect(ReturnCodeAction.decodeName(description)))
			return ReturnCodeAction.refused(`Can not disconnect from: ${description ?? ''}`);
		return ReturnCodeAction.succeeded();
	}
}
