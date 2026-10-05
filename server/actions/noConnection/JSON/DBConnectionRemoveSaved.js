// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { ReturnCodeAction } from '../../../core/ReturnCodeAction.js';

/** Removes one or more saved connections (PHP DBConnectionRemoveSaved.php). */
export default class DBConnectionRemoveSavedAction extends ReturnCodeAction {
	async perform() {
		if (this.config.get('FORCE_CONNECTION_WITH_DEFAULT')) return ReturnCodeAction.refused('Can not remove connections');
		const descriptions = [this.param('TE_DATABASE_LOGIN_DESCRIPTION') ?? []].flat();
		for (const description of descriptions) await this.connections.remove(ReturnCodeAction.decodeName(description));
		return ReturnCodeAction.succeeded();
	}
}
