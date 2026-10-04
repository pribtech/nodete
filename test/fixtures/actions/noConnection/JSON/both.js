import { Action } from '../../../../../server/core/Action.js';

export default class BothNoConnection extends Action {
	async run() { return { scope: 'noConnection' }; }
}
