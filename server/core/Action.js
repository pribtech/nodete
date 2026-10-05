// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/**
 * Base class for every action the front end calls through action.php?action=<name>.
 *
 * Subclasses implement run() and return the result:
 *  - an object or array is sent as JSON
 *  - a string is sent as-is in the request's return type
 *  - undefined means run() already wrote the response itself
 *
 * Each action lives in its own file under server/actions/<scope>/<JSON|HTML>/<name>.js,
 * mirroring the PHP folders, and default-exports its class.
 */
export class Action {
	#context;

	constructor(context) {
		this.#context = context;
	}

	get config() { return this.#context.config; }
	get request() { return this.#context.request; }
	get response() { return this.#context.response; }
	get session() { return this.#context.session; }
	get messages() { return this.#context.messages; }
	get connections() { return this.#context.connections; }
	get drivers() { return this.#context.drivers; }
	get files() { return this.#context.files; }

	/** The request's objects together, for collaborators built per request. */
	get context() { return this.#context; }

	param(name, defaultValue = null) { return this.request.getParameter(name, defaultValue); }

	async run() {
		throw new Error(`${this.constructor.name} does not implement run()`);
	}

	async execute() {
		const result = await this.run();
		if (result === undefined || this.response.sent) return;
		if (typeof result === 'string') this.response.send(result);
		else this.response.sendJSON(result);
	}
}
