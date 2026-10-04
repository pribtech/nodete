import { Action } from '../../../../../../server/core/Action.js';

export default class Nested extends Action {
	async run() { return { nested: true }; }
}
