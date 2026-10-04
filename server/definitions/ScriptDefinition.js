import { Requirements } from './Requirements.js';

/**
 * TE scripts (the action/task language the front end runs) are stored in the JSON the
 * script engine executes, with two exceptions that keep the files readable and
 * per-request correct:
 *  - version gating fields are stored as "requires" (non-defaults only) on actions,
 *    task lists and check conditions
 *  - loadPage tasks keep their links and page layouts in definition form, because
 *    link defaults depend on the request
 */
export class ScriptDefinition {
	/** Objects that carry the eight requirement fields in the front-end form. */
	static #carriesRequirements(object) {
		return object.type === 'action' || object.type === 'taskList' || (object.type === 'IF' && !Object.hasOwn(object, 'compareOn'));
	}

	/** Front-end form -> stored form (used by the converter). */
	static compact(value) {
		if (Array.isArray(value)) return value.map((item) => ScriptDefinition.compact(item));
		if (!value || typeof value !== 'object') return value;
		const copy = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, ScriptDefinition.compact(v)]));
		if (ScriptDefinition.#carriesRequirements(copy) && Requirements.carriesAll(copy)) {
			const requires = Requirements.compact(copy);
			Requirements.strip(copy);
			if (requires) copy.requires = requires;
		}
		return copy;
	}

	/**
	 * Stored form -> front-end form.
	 * @param {(task: object) => object} resolveLoadPage builds a loadPage task's links and layouts
	 */
	static expand(value, resolveLoadPage) {
		if (Array.isArray(value)) return value.map((item) => ScriptDefinition.expand(item, resolveLoadPage));
		if (!value || typeof value !== 'object') return value;
		if (value.type === 'loadPage' && Object.hasOwn(value, 'links')) return resolveLoadPage(value);
		const { requires, ...rest } = value;
		const expanded = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, ScriptDefinition.expand(v, resolveLoadPage)]));
		return ScriptDefinition.#carriesRequirements(expanded) ? { ...Requirements.expand(requires), ...expanded } : expanded;
	}
}
