import { Config } from '../../server/core/Config.js';
import { TEServer } from '../../server/core/TEServer.js';
import { ConnectionStore } from '../../server/core/ConnectionStore.js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const QUIET_LOG = Object.freeze({ info() {}, warn() {}, error() {} });

/** The real TE server on a random local port, with a cookie so session state carries across calls. */
export class TestServer {
	#server;
	#base;
	#cookie = '';

	/**
	 * @param {object} configOverrides
	 * @param {object} options drivers: a DriverCatalog; connectionStore: defaults to an empty store in a temporary folder
	 */
	static async start(configOverrides = {}, { drivers, connectionStore = TestServer.temporaryStore() } = {}) {
		const instance = new TestServer();
		const config = Config.load({ env: {}, overrides: configOverrides });
		instance.#server = await new TEServer(config, { log: QUIET_LOG, sessionSecret: 'test', drivers, connectionStore }).listen(0, '127.0.0.1');
		instance.#base = `http://127.0.0.1:${instance.#server.address().port}`;
		return instance;
	}

	static temporaryStore() {
		return new ConnectionStore({ file: path.join(mkdtempSync(path.join(tmpdir(), 'te-store-')), 'connStore.json') });
	}

	async #fetch(path, init = {}) {
		const response = await fetch(`${this.#base}${path}`, { ...init, headers: { ...(init.headers ?? {}), cookie: this.#cookie } });
		const setCookie = response.headers.get('set-cookie');
		if (setCookie) this.#cookie = setCookie.split(';')[0];
		return response;
	}

	get(path, headers = {}) { return this.#fetch(path, { headers }); }

	/** POST form fields to action.php (query is the part after "action.php"). */
	postAction(fields, query = '') {
		return this.#fetch(`/action.php${query}`, { method: 'POST', body: new URLSearchParams(fields) });
	}

	async postActionText(fields, query = '') { return (await this.postAction(fields, query)).text(); }

	stop() { return new Promise((resolve) => this.#server.close(resolve)); }
}
