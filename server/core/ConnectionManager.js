/**
 * Database connection state for one user session (the PHP connectionManager class).
 *
 * Step 1 of the port covers connection state and the title text the front end shows.
 * Opening connections, saved connections (connectionStore/connStore.xml) and the
 * database drivers arrive in step 2; until then no session can be connected.
 */
export class ConnectionManager {
	#session;
	#config;
	#messages;
	#defaultName;

	constructor({ session, config, messages, connectionName = null }) {
		this.#session = session;
		this.#config = config;
		this.#messages = messages;
		this.#defaultName = connectionName;
	}

	#forcedDefault() { return this.#config.get('FORCE_CONNECTION_WITH_DEFAULT'); }

	isConnected(name = this.#defaultName) {
		if (name === null) return false;
		const record = this.#session.connection(this.#forcedDefault() ? 'defaultConnection' : name);
		return record?.authenticated === true;
	}

	/** Window title / status line: "TE Not Connected" or "TE Connected: db @ host as user". */
	titleString(name = this.#defaultName) {
		if (!this.isConnected(name)) return this.#messages.get('TE_NOT_CONNECTED');
		if (this.#forcedDefault()) return this.#defaultDescription();
		const record = this.#session.connection(name) ?? {};
		const host = record.hostname === undefined ? '' : (String(record.hostname).trim() === '' ? 'LOCALHOST' : record.hostname);
		return `TE Connected: ${record.database ?? ''} @ ${host} as ${record.username ?? ''}`;
	}

	#defaultDescription() {
		const c = (n) => this.#config.get(n);
		const host = c('DEFAULT_DATABASE_HOST_NAME') !== '' ? `${c('DEFAULT_DATABASE_HOST_NAME')}:${c('DEFAULT_DATABASE_PORT_NUMBER')}` : '';
		return `${c('DEFAULT_DATABASE_USERNAME')}@${c('DEFAULT_DATABASE')}.${host}`;
	}

	/** Re-checks every open connection's status. No-op until drivers exist (step 2). */
	async refreshStatuses() {}

	/** Saved and recent connections offered in the connection manager panel (step 2). */
	async storedConnections() { return []; }
}
