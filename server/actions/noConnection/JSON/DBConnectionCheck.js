import { Action } from '../../../core/Action.js';

/** Connection status polled by the front end (PHP DBConnectionCheck.php). */
export default class DBConnectionCheckAction extends Action {
	async run() {
		try {
			await this.connections.refreshStatuses();
			return {
				connectionStatus: this.connections.isConnected() ? 'true' : 'false',
				connectionText: this.connections.titleString(),
				activeConnection: Object.values(await this.connections.storedConnections()),
			};
		} catch (error) {
			return { connectionStatus: 'false', connectionText: `Failed: ${error.message}`, activeConnection: [] };
		}
	}
}
