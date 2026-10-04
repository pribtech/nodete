import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Saved connections, kept in a JSON file (CONNECTION_STORE_FILE, default
 * ./connectionStore/connStore.json); the PHP version used connStore.xml.
 *
 *   {"connections": [{"description": "IBM_DB2:db2inst1@SAMPLE", "databaseDriver": "IBM_DB2", ...}]}
 *
 * Passwords typed by users are never written. A password an administrator puts in the
 * file is kept, so an entry with "autoConnect": true can connect without asking.
 */
export class ConnectionStore {
	/** Fields written for each connection, in file order. */
	static FIELDS = Object.freeze(['description', 'time', 'comment', 'databaseDriver', 'database', 'hostname', 'portnumber', 'group', 'username', 'password', 'schema', 'usePersistentConnection', 'autoConnect', 'activeOnFirstLoad', 'trustedContext']);

	#file;
	#writable;
	#defaultDriver;

	/** @param {{file: string|null, writable?: boolean, defaultDriver?: string}} options file is an absolute path, null for no store */
	constructor({ file, writable = true, defaultDriver = 'IBM_DB2' }) {
		this.#file = file;
		this.#writable = writable && file !== null;
		this.#defaultDriver = defaultDriver;
	}

	/** The store the configuration describes; only file storage is supported. */
	static fromConfig(config, files) {
		const location = config.get('CONNECTION_STORE_FILE');
		const usesFile = config.get('CONNECTION_STORE_STORAGE_TYPE') === 0 && location !== false && location !== '';
		return new ConnectionStore({
			file: usesFile ? files.resolve(location) : null,
			writable: config.get('ALLOW_CONNECTION_SAVING') === true,
			defaultDriver: config.get('DEFAULT_DATABASE_DRIVER'),
		});
	}

	get isWritable() { return this.#writable; }

	/** Saved connections by description, with the defaults the connection manager panel expects. */
	async list() {
		const entries = await this.#read();
		return Object.fromEntries(entries.filter((entry) => entry.description).map((entry) => [entry.description, this.#forDisplay(entry)]));
	}

	/** Adds or replaces the entry with record.description. */
	async save(record) {
		if (!this.#writable) return false;
		const all = await this.#read();
		const kept = all.find((entry) => entry.description === record.description);
		const entries = all.filter((entry) => entry !== kept);
		entries.push(this.#forFile({ ...record, password: kept?.password ?? '', time: Math.floor(Date.now() / 1000) }));
		await this.#write(entries);
		return true;
	}

	async remove(description) {
		if (!this.#writable) return false;
		const entries = await this.#read();
		const remaining = entries.filter((entry) => entry.description !== description);
		if (remaining.length !== entries.length) await this.#write(remaining);
		return true;
	}

	#forDisplay(entry) {
		return {
			connectionTag: null, connectionType: 'save', connectionStatus: false, authenticated: false,
			description: entry.description, time: entry.time ?? '', comment: entry.comment ?? '',
			databaseDriver: entry.databaseDriver || this.#defaultDriver, database: entry.database ?? '',
			hostname: entry.hostname ?? '', portnumber: entry.portnumber ?? '', group: entry.group ?? '',
			username: entry.username ?? '', password: entry.password ?? '', schema: entry.schema ?? '',
			usePersistentConnection: entry.usePersistentConnection === true, autoConnect: entry.autoConnect === true,
			activeOnFirstLoad: entry.activeOnFirstLoad === true,
			...(entry.trustedContext ? { trustedContext: Object.fromEntries(entry.trustedContext.map((user) => [user, ''])) } : {}),
		};
	}

	#forFile(record) {
		const entry = {};
		for (const field of ConnectionStore.FIELDS) if (record[field] !== undefined && record[field] !== null) entry[field] = record[field];
		entry.databaseDriver ||= this.#defaultDriver;
		entry.usePersistentConnection = record.usePersistentConnection === true || record.usePersistentConnection === 'true';
		entry.autoConnect = record.autoConnect === true;
		if (record.trustedContext && typeof record.trustedContext === 'object')
			entry.trustedContext = Array.isArray(record.trustedContext) ? record.trustedContext : Object.keys(record.trustedContext);
		else delete entry.trustedContext;
		return entry;
	}

	async #read() {
		if (this.#file === null) return [];
		let text;
		try {
			text = await readFile(this.#file, 'utf8');
		} catch (error) {
			if (error.code === 'ENOENT') return [];
			throw error;
		}
		const content = JSON.parse(text);
		if (!Array.isArray(content?.connections)) throw new Error(`Connection store ${this.#file}: expected {"connections": [...]}`);
		return content.connections;
	}

	/** Writes through a temporary file so a failed write never leaves a broken store. */
	async #write(entries) {
		entries.sort((a, b) => String(a.description).localeCompare(String(b.description)));
		await mkdir(path.dirname(this.#file), { recursive: true });
		const temporary = `${this.#file}.${process.pid}.tmp`;
		await writeFile(temporary, `${JSON.stringify({ connections: entries }, null, '\t')}\n`, { mode: 0o600 });
		await rename(temporary, this.#file);
	}
}
