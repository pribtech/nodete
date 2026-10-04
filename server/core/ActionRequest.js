/**
 * Read-only view of an incoming request, with the parameter rules of the PHP version:
 * - getParameter() looks in the query string first, then the POST body (PHP $_GET then $_POST)
 * - parameter names are case sensitive
 * - an empty string counts as missing, as PHP's loose `== null` check did
 */
export class ActionRequest {
	#query;
	#body;
	#headers;
	#ip;

	constructor({ query = {}, body = {}, headers = {}, ip = '' } = {}) {
		this.#query = query;
		this.#body = body ?? {};
		this.#headers = headers;
		this.#ip = ip;
		Object.freeze(this);
	}

	static fromExpress(req) {
		return new ActionRequest({ query: req.query, body: req.body, headers: req.headers, ip: req.ip });
	}

	getParameter(name, defaultValue = null) {
		const value = this.#query[name] ?? this.#body[name];
		return value === undefined || value === null || value === '' ? defaultValue : value;
	}

	/** POST-only parameter, as the PHP CALLING_* constants read them. */
	getPostParameter(name, defaultValue = '') {
		return Object.hasOwn(this.#body, name) ? this.#body[name] : defaultValue;
	}

	hasQueryParameter(name) { return Object.hasOwn(this.#query, name); }

	header(name) { return this.#headers[name.toLowerCase()]; }

	get ip() { return this.#ip; }

	get action() { return this.getParameter('action', ''); }

	/** JSON or HTML, from the lowercase `returntype` parameter (PHP read it case sensitively). */
	get returnType() { return String(this.getParameter('returntype', 'HTML')).toUpperCase(); }

	get isJSON() { return this.returnType === 'JSON'; }

	get connectionName() { return this.getParameter('USE_CONNECTION', null); }

	/** Identifiers of the front-end panel that made the call (PHP CALLING_PAGE/STAGE/WINDOW/PANEL). */
	get caller() {
		return Object.freeze({
			page: this.getPostParameter('uniqueID'),
			stage: this.getPostParameter('stageID'),
			window: this.getPostParameter('windowID'),
			panel: this.getPostParameter('panelID'),
		});
	}

	get userAgent() { return this.header('user-agent') ?? ''; }
}
