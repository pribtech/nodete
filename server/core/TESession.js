import { Messages } from './Messages.js';

/**
 * Per-user state kept between requests (the PHP $_SESSION set up by base/initializeSession.php):
 * chosen language, permitted features, database connections and the idle timeout.
 */
export class TESession {
	#store;
	#config;

	constructor(store, config) {
		this.#store = store;
		this.#config = config;
	}

	/** Applies the per-request session rules from initializeSession.php and returns the session. */
	static begin(store, config, request, now = Date.now()) {
		const session = new TESession(store, config);
		session.#initialise(request, now);
		return session;
	}

	#initialise(request, now) {
		const s = this.#store;
		s.BASE_FEATURES ??= this.#config.get('BASE_FEATURES');
		s.Connections ??= {};
		if (request.hasQueryParameter('_LOGOUT') && request.connectionName !== null)
			s.Connections[request.connectionName] = {};
		this.#expireIfIdle(request, now);
		this.#chooseLanguage(request.getParameter('language'));
	}

	#expireIfIdle(request, now) {
		const timeoutMinutes = this.#config.get('SESSION_TIMEOUT_IN_MIN');
		const s = this.#store;
		if (s.CLIENT_TIME_OUT === undefined) {
			s.CLIENT_TIME_OUT = now;
			s.CLIENT_ADDRESS = request.ip;
			s.CLIENT_USER_AGENT = request.userAgent;
		}
		if (this.#config.get('SESSION_SIGNON_TIMEOUT')) return;
		if (timeoutMinutes !== false && s.CLIENT_TIME_OUT < now - timeoutMinutes * 60_000) {
			this.clear();
			s.CLIENT_TIME_OUT = now;
		}
		if (String(request.getParameter('touchConnection', 'true')).toLowerCase() === 'true')
			s.CLIENT_TIME_OUT = now;
	}

	#chooseLanguage(requested) {
		const fallback = this.#config.get('TE_LANGUAGE');
		if (requested && Messages.isAvailable(requested)) this.#store.CURRENT_TE_LANGUAGE = requested;
		else if (!Messages.isAvailable(this.#store.CURRENT_TE_LANGUAGE)) this.#store.CURRENT_TE_LANGUAGE = fallback;
	}

	get language() { return this.#store.CURRENT_TE_LANGUAGE; }
	get messages() { return Messages.for(this.language, this.#config.get('TE_LANGUAGE')); }
	get baseFeatures() { return this.#store.BASE_FEATURES; }

	/** Throws unless the session's features include keyword (PHP TE_check_feature_allowed). */
	requireFeature(keyword) {
		if (!String(this.baseFeatures).toLowerCase().includes(String(keyword).toLowerCase()))
			throw new Error(`Insufficient authority to use ${keyword} action`);
	}

	/** Connection records keyed by connection name. */
	get connections() { return this.#store.Connections; }

	connection(name) { return name === null ? null : this.#store.Connections[name] ?? null; }

	clear() {
		for (const key of Object.keys(this.#store)) if (key !== 'cookie') delete this.#store[key];
		this.#store.BASE_FEATURES = this.#config.get('BASE_FEATURES');
		this.#store.Connections = {};
	}
}
