import { Action } from '../../../../../server/core/Action.js';

export default class Fails extends Action {
	async run() { throw new Error('boom'); }
}
