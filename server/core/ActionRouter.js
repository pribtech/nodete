import { ActionRequest } from './ActionRequest.js';
import { ActionResponse } from './ActionResponse.js';
import { TESession } from './TESession.js';
import { ConnectionManager } from './ConnectionManager.js';

const ACTION_NAME = /^[a-zA-Z0-9_/-]+$/;

/**
 * Handles action.php?action=<name>, in the same order as the PHP router:
 *  1. reject names with characters other than letters, digits, _ / -
 *  2. an activeConnection action, if one exists and the session is connected
 *  3. a noConnection action
 *  4. "not connected" if only an activeConnection action exists
 *  5. "action not found"
 */
export class ActionRouter {
	#config;
	#registry;
	#files;
	#log;

	constructor({ config, registry, files, log = console }) {
		this.#config = config;
		this.#registry = registry;
		this.#files = files;
		this.#log = log;
	}

	/** Builds the per-request objects every action works with. */
	createContext(req, res) {
		const request = ActionRequest.fromExpress(req);
		const session = TESession.begin(req.session, this.#config, request);
		const messages = session.messages;
		const response = new ActionResponse(res, request.returnType, messages);
		const connections = new ConnectionManager({ session, config: this.#config, messages, connectionName: request.connectionName });
		return { config: this.#config, files: this.#files, request, response, session, messages, connections };
	}

	async handle(req, res) {
		const context = this.createContext(req, res);
		const { request, response, messages, connections } = context;
		const name = request.action;
		const returnType = request.returnType;
		try {
			if (this.#config.get('TRACE_ACTION_CALLS')) this.#log.info(`action ${name} (${returnType})`);
			if (!ACTION_NAME.test(name)) throw new Error(`Poorly formed action: ${name}`);

			const needsConnection = this.#registry.has('activeConnection', returnType, name);
			if (needsConnection && connections.isConnected())
				return await this.#run('activeConnection', returnType, name, context);
			if (this.#registry.has('noConnection', returnType, name))
				return await this.#run('noConnection', returnType, name, context);
			if (needsConnection) return response.sendNotConnected();

			const notFound = this.#registry.isUnported(returnType, name)
				? `Action "${name}" has not been ported to Node.js yet`
				: messages.format('ACTION_NOT_FOUND_W_NAME', { ACTION: name });
			if (response.isJSON) throw new Error(notFound);
			response.sendActionNotFoundHTML(notFound);
		} catch (error) {
			this.#log.error(`action ${name} failed: ${error.stack ?? error}`);
			if (!response.sent) response.sendError(error);
		}
	}

	async #run(scope, returnType, name, context) {
		const ActionClass = await this.#registry.load(scope, returnType, name);
		await new ActionClass(context).execute();
	}
}
