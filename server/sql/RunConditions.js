/**
 * Conditions checked after a statement of a batch, deciding whether the batch goes on
 * (PHP checkConditions / setReturnAction in executeSQL.php), e.g.
 *   {"rowsReturned": {"operator": ">", "condition": 0, "onFalse": {"nextAction": "endRun", "setrunmessage": "..."}}}
 */
export class RunConditions {
	static #COMPARE = {
		'=': (a, b) => a == b, // eslint-disable-line eqeqeq -- the condition arrives as text
		'>': (a, b) => a > b,
		'<': (a, b) => a < b,
		'>=': (a, b) => a >= b,
		'<=': (a, b) => a <= b,
		'!=': (a, b) => a != b, // eslint-disable-line eqeqeq
	};

	#conditions;

	constructor(conditions) { this.#conditions = conditions; }

	static #outcome(fields = {}) {
		return { returnValue: true, returnCode: 'true', returnMessage: '', commit: false, ...fields };
	}

	/**
	 * @param {object} statementReturn the statement's result
	 * @returns {{returnValue: boolean, returnCode: string, returnMessage: string, commit: boolean}}
	 *          returnValue false means stop the batch
	 */
	check(statementReturn) {
		const conditions = this.#conditions;
		if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions) && conditions.length === 0) return RunConditions.#outcome();
		let outcome = RunConditions.#outcome({ returnValue: false });
		let index = 0;
		for (const [type, match] of Object.entries(conditions)) {
			if (type.toLowerCase() !== 'rowsreturned') {
				outcome = RunConditions.#outcome({ returnValue: false, returnCode: 'false', returnMessage: `Could not evaluate condition type : ${type}` });
				continue;
			}
			if (statementReturn?.resultSet?.[index]?.rowsReturned === undefined)
				return RunConditions.#outcome({ returnValue: false, returnCode: 'false', returnMessage: 'No data returned from previous SQL.' });
			index = match.index ?? 0;
			const compare = RunConditions.#COMPARE[match.operator];
			if (!compare) {
				outcome = RunConditions.#outcome({ returnValue: false, returnCode: 'false', returnMessage: `Could not evaluate expression : ${match.operator}${match.condition}` });
				continue;
			}
			const matched = compare(statementReturn.resultSet[index]?.rowsReturned, match.condition);
			const next = matched ? match.onTrue : match.onFalse;
			outcome = next === undefined ? RunConditions.#outcome() : RunConditions.#nextAction(next);
		}
		return outcome;
	}

	static #nextAction(onCondition) {
		const action = String(onCondition?.nextAction ?? '').toLowerCase();
		if (onCondition?.nextAction === undefined) return RunConditions.#outcome({ returnValue: false, returnCode: 'false', returnMessage: 'Error evaluating next action' });
		if (action === 'commit') return RunConditions.#outcome({ returnValue: false, commit: true });
		if (action !== 'rollback' && action !== 'endrun')
			return RunConditions.#outcome({ returnValue: false, returnCode: 'false', returnMessage: `Could not evaluate next action : ${onCondition.nextAction}` });
		return RunConditions.#outcome({
			returnValue: false,
			commit: action === 'endrun',
			returnCode: onCondition.setrunreturn ?? 'false',
			returnMessage: onCondition.setrunmessage ?? 'No return message specified.',
		});
	}
}
