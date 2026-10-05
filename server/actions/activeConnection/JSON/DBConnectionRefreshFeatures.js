// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { ReturnCodeAction } from '../../../core/ReturnCodeAction.js';

/** Reads which optional features the connected database has (PHP DBConnectionRefreshFeatures.php). */
export default class DBConnectionRefreshFeaturesAction extends ReturnCodeAction {
	async perform() {
		return ReturnCodeAction.succeeded(await this.connections.refreshFeatures());
	}
}
