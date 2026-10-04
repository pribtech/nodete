import { Action } from '../../../../../server/core/Action.js';

export default class BothActive extends Action {
	async run() { return { scope: 'activeConnection' }; }
}
