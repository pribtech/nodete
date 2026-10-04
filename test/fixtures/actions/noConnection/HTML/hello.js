import { Action } from '../../../../../server/core/Action.js';

export default class Hello extends Action {
	async run() { return `hello ${this.param('who', 'world')}`; }
}
