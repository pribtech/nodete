// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Action } from './Action.js';

/**
 * An action that answers {returnCode: "true"|"false", returnValue}, the reply shape of the
 * PHP connection and SQL actions. Subclasses implement perform(); an error it throws
 * becomes a "Failed: <message>" reply.
 */
export class ReturnCodeAction extends Action {
	async run() {
		try {
			return await this.perform();
		} catch (error) {
			return ReturnCodeAction.failed(error);
		}
	}

	async perform() { throw new Error(`${this.constructor.name} does not implement perform()`); }

	static succeeded(returnValue = 'true') { return { returnCode: 'true', returnValue }; }

	static refused(returnValue) { return { returnCode: 'false', returnValue }; }

	static failed(error) {
		const message = `Failed: ${error?.message ?? error}`;
		return { returnCode: 'false', returnValue: message, success: false, message };
	}

	/** Connection names arrive URL-encoded from the connection manager panel. */
	static decodeName(name) {
		try { return decodeURIComponent(name); } catch { return name; }
	}
}
