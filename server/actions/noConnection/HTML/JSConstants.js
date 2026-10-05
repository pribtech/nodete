// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Action } from '../../../core/Action.js';
import { JsConstants } from '../../../pages/JsConstants.js';

/** The settings script on its own (PHP JSConstants.php); the index page normally inlines it. */
export default class JSConstantsAction extends Action {
	async run() {
		this.response.sendScript(new JsConstants(this.config).script());
	}
}
