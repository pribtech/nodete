import { Action } from '../../../../../server/core/Action.js';

export default class NeedsDb extends Action {
	async run() { return { scope: 'activeConnection' }; }
}
