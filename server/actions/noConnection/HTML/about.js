// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Action } from '../../../core/Action.js';
import { Template } from '../../../pages/Template.js';

/** Version and licence panel (PHP about.php). */
export default class AboutAction extends Action {
	async run() {
		return Template.load('about.html').render({ version: this.config.versionString });
	}
}
