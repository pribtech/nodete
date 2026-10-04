import { Action } from '../../../core/Action.js';

/** Connection status polled by the front end (PHP DBConnectionCheck.php). */
export default class DBConnectionCheckAction extends Action {
	async run() {
		try {
			await this.connections.refreshStatuses();
			// listed first: listing logs on to auto-connect and forced connections, which the status should reflect
			const activeConnection = Object.values(await this.connections.storedConnections());
			return {
				connectionStatus: this.connections.isConnected() ? 'true' : 'false',
				connectionText: this.connections.titleString(),
				activeConnection,
			};
		} catch (error) {
			return { connectionStatus: 'false', connectionText: `Failed: ${error.message}`, activeConnection: [] };
		}
	}
}
