import { ConnectionSpec } from '../drivers/ConnectionSpec.js';
import { DatabaseError } from '../drivers/DatabaseError.js';

/** Session key of the connection used when FORCE_CONNECTION_WITH_DEFAULT is on. */
const DEFAULT_KEY = 'defaultConnection';

/** Features every connection reports besides the database's own (PHP Connection::getBaseFeatures). */
const BASE_FEATURES = Object.freeze({ javaBridge: false, javaSQL: false, ssh2: false, costEstimation: false });

/**
 * Database connections for one request (the PHP connectionManager class).
 *
 * The session keeps one record per connection the user logged on to, keyed by its name
 * ("<driver>:<user>@<database>[.<host>:<port>]"). A driver connection is opened when an
 * action first asks for one and closed when the request ends.
 */
export class ConnectionManager {
	#session;
	#config;
	#messages;
	#defaultName;
	#drivers;
	#store;
	#open = new Map();

	/**
	 * @param {object} options
	 * @param {import('./TESession.js').TESession} options.session
	 * @param {import('../drivers/DriverCatalog.js').DriverCatalog} options.drivers
	 * @param {import('./ConnectionStore.js').ConnectionStore} options.store
	 * @param {string|null} options.connectionName the request's USE_CONNECTION
	 */
	constructor({ session, config, messages, connectionName = null, drivers, store }) {
		this.#session = session;
		this.#config = config;
		this.#messages = messages;
		this.#defaultName = connectionName;
		this.#drivers = drivers;
		this.#store = store;
	}

	get #forcedDefault() { return this.#config.get('FORCE_CONNECTION_WITH_DEFAULT') === true; }

	#record(name) { return this.#session.connection(this.#forcedDefault ? DEFAULT_KEY : name); }

	isConnected(name = this.#defaultName) {
		if (name === null) return false;
		return this.#record(name)?.authenticated === true;
	}

	/** The session record of the current connection, or null when not connected. */
	currentRecord() { return this.isConnected() ? this.#record(this.#defaultName) : null; }

	/** Window title / status line: "TE Not Connected" or "TE Connected: db @ host as user". */
	titleString(name = this.#defaultName) {
		if (!this.isConnected(name)) return this.#messages.get('TE_NOT_CONNECTED');
		if (this.#forcedDefault) return ConnectionManager.#forcedDescription(this.#defaultSpec());
		const record = this.#session.connection(name) ?? {};
		const host = record.hostname === undefined ? '' : (String(record.hostname).trim() === '' ? 'LOCALHOST' : record.hostname);
		return `TE Connected: ${record.database ?? ''} @ ${host} as ${record.username ?? ''}`;
	}

	#defaultSpec() {
		const c = (name) => this.#config.get(name);
		return new ConnectionSpec({
			databaseDriver: c('DEFAULT_DATABASE_DRIVER'), database: c('DEFAULT_DATABASE'), schema: c('DEFAULT_DATABASE_SCHEMA'),
			username: c('DEFAULT_DATABASE_USERNAME'), password: c('DEFAULT_DATABASE_PASSWORD'),
			hostname: c('DEFAULT_DATABASE_HOST_NAME'), portnumber: String(c('DEFAULT_DATABASE_PORT_NUMBER')),
		});
	}

	/** The forced connection is described without its driver: "user@database[.host:port]". */
	static #forcedDescription(spec) { return spec.name.slice(spec.databaseDriver.length + 1); }

	// ---- logging on and off --------------------------------------------------------------

	/**
	 * Logs on with the login form's details (PHP newConnection). A blank password is taken
	 * from an earlier log on to the same host or group in this session.
	 * @returns the session record, without its password
	 */
	async connect(spec) {
		if (this.#forcedDefault) throw new DatabaseError('Operation not permitted!');
		spec = spec.with({ password: this.#passwordFor(spec) });
		const dataServerInfo = await this.#drivers.driver(spec.databaseDriver).test(spec);
		const record = {
			description: spec.name, databaseDriver: spec.databaseDriver, database: spec.database, schema: spec.schema,
			username: spec.username, password: spec.password, hostname: spec.hostname, portnumber: spec.portnumber,
			usePersistentConnection: spec.usePersistentConnection, comment: spec.comment, driverAvailable: true,
			connectionStatus: true, group: spec.group, dataServerInfo, authenticated: true,
		};
		this.#session.connections[spec.name] = record;
		await this.save(spec);
		return ConnectionManager.#withoutPassword(record);
	}

	/** The password typed, remembered for its host and group; or one remembered earlier when none was typed. */
	#passwordFor({ username, hostname, group, password }) {
		const session = this.#session;
		if (password !== '') {
			session.rememberPassword('ipAddresses', hostname, username, password);
			if (group !== '') session.rememberPassword('connectionGroup', group, username, password);
			return password;
		}
		return session.rememberedPassword('ipAddresses', hostname, username)
			?? (group !== '' ? session.rememberedPassword('connectionGroup', group, username) : null)
			?? '';
	}

	/** Forgets a connection for this session (PHP disconnectConnection). */
	async disconnect(name = this.#defaultName) {
		if (this.#forcedDefault || name === null) return false;
		delete this.#session.connections[name];
		const open = this.#open.get(name);
		this.#open.delete(name);
		await open?.close();
		return true;
	}

	/** Disconnects and removes a saved connection (PHP removeConnection). */
	async remove(name) {
		if (this.#forcedDefault || typeof name !== 'string') return false;
		await this.disconnect(name);
		return this.#store.remove(name);
	}

	/** Saves a connection's details, without its password, for later sessions. */
	async save(spec) {
		if (this.#forcedDefault || spec.username === '' || spec.database === '' || spec.group === 'VCAP_SERVICE') return false;
		return this.#store.save({ ...spec, description: spec.name, password: undefined });
	}

	// ---- connections for actions ----------------------------------------------------------

	/** The open database connection called name, opened on first use; null when not logged on. */
	async open(name = this.#defaultName) {
		if (!this.isConnected(name)) return null;
		const key = this.#forcedDefault ? DEFAULT_KEY : name;
		if (!this.#open.has(key)) {
			const spec = this.#forcedDefault ? this.#defaultSpec() : new ConnectionSpec(this.#session.connection(name));
			this.#open.set(key, await this.#drivers.driver(spec.databaseDriver).connect(spec));
		}
		return this.#open.get(key);
	}

	/** Closes every connection this request opened. */
	async closeAll() {
		const open = [...this.#open.values()];
		this.#open.clear();
		await Promise.allSettled(open.map((connection) => connection.close()));
	}

	/** Reads the database's optional features into the session record (PHP setFeatures). */
	async refreshFeatures(name = this.#defaultName) {
		const connection = await this.open(name);
		if (connection === null) throw new DatabaseError(this.#messages.get('TE_NOT_CONNECTED'));
		const record = this.#record(name);
		record.features = { ...BASE_FEATURES, ...await connection.features() };
		return ConnectionManager.#withoutPassword(record);
	}

	// ---- status for the connection manager panel ---------------------------------------------

	/** Tests every connection of the session again and records the outcome (PHP UpdateConnectionStatusesAllConnection). */
	async refreshStatuses() {
		for (const [key, record] of Object.entries(this.#session.connections)) {
			if (key === 'default' || !record?.database) continue;
			const outcome = await this.#test(new ConnectionSpec({ ...record, databaseDriver: record.databaseDriver || this.#config.get('DEFAULT_DATABASE_DRIVER') }));
			if (typeof outcome === 'object') Object.assign(record, { dataServerInfo: outcome, connectionStatus: true });
			else record.connectionStatus = outcome;
		}
	}

	/** Server information, or the error message as a string. */
	async #test(spec) {
		try {
			return await this.#drivers.driver(spec.databaseDriver).test(spec);
		} catch (error) {
			return `Connect error: ${error.message}`;
		}
	}

	/**
	 * Saved connections merged with the session's, by name, as the connection manager
	 * panel lists them (PHP retrieveStoredConnections). Passwords are never included.
	 */
	async storedConnections() {
		if (this.#forcedDefault) return this.#forcedList();
		const list = await this.#store.list();
		for (const saved of Object.values(list)) if (saved.autoConnect) await this.#autoConnect(saved);
		const current = String(this.#defaultName ?? '').toLowerCase();
		for (const [key, record] of Object.entries(this.#session.connections)) {
			if (key === 'default' || key === '' || !record?.description) continue;
			const saved = list[record.description];
			const entry = saved
				? Object.assign(list[key] ??= { ...saved }, {
					authenticated: record.authenticated, dataServerInfo: record.dataServerInfo, connectionStatus: record.connectionStatus,
					...(record.trustedContext ? { trustedContext: record.trustedContext } : {}),
				})
				: (list[key] = { ...record });
			entry.time = Math.floor(Date.now() / 1000);
			if (current === key.toLowerCase()) entry.activeConnection = true;
		}
		return Object.fromEntries(Object.keys(list).sort().map((key) => [key, ConnectionManager.#withoutPassword(list[key])]));
	}

	/** Logs on to a saved connection marked autoConnect, unless the session already has it. */
	async #autoConnect(saved) {
		if (this.#session.connection(saved.description)?.connectionStatus === true) return;
		const outcome = await this.#test(new ConnectionSpec(saved));
		if (typeof outcome !== 'object') return;
		this.#session.connections[saved.description] = { ...saved, connectionStatus: true, dataServerInfo: outcome, authenticated: true };
		if (saved.password !== '') this.#passwordFor(saved);
	}

	async #forcedList() {
		const spec = this.#defaultSpec();
		const description = ConnectionManager.#forcedDescription(spec);
		const outcome = await this.#test(spec);
		const authenticated = typeof outcome === 'object';
		this.#session.connections[DEFAULT_KEY] = { ...this.#session.connection(DEFAULT_KEY), authenticated };
		return {
			[description]: {
				comment: 'Forced Connection', databaseDriver: spec.databaseDriver, database: spec.database, hostname: spec.hostname,
				portnumber: spec.portnumber, description, username: spec.username, activeOnFirstLoad: true,
				driverAvailable: true, connectionStatus: authenticated ? true : outcome, authenticated,
				...(authenticated ? { dataServerInfo: outcome } : {}),
			},
		};
	}

	static #withoutPassword(record) {
		const { password: _password, ...rest } = record;
		return rest;
	}
}
