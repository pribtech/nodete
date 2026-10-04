import { Action } from '../../../core/Action.js';
import { SqlBatch } from '../../../sql/SqlBatch.js';

/** Runs SQL for the console: ad hoc statements, scripts and the SQL behind TE pages (PHP executeSQL.php). */
export default class ExecuteSQLAction extends Action {
	async run() {
		const connection = await this.connections.open();
		const batch = new SqlBatch(connection, SqlBatch.optionsFrom(this.request), {
			lookAhead: this.config.get('SQL_MAX_ROW_LOOK_AHEAD'),
			requestValue: (name) => this.param(name),
		});
		return batch.run();
	}
}
