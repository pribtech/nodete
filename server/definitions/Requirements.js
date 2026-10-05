// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/** The version/feature/context gating fields and their defaults, as the front end receives them. */
const DEFAULTS = Object.freeze({
	DBMS: null, minVersion: 0, minFixPack: 0, maxVersion: 0, feature: '', noFeature: '', context: '', notContext: '',
});
const KEYS = Object.keys(DEFAULTS);

/**
 * Menus, actions, task lists and check conditions can be limited to a DBMS, version
 * range, feature or context. Definitions store only the fields that differ from the
 * defaults, under "requires"; the front end gets all eight fields.
 */
export class Requirements {
	static get defaults() { return DEFAULTS; }

	/** All eight fields for a definition's "requires" (which may be absent). */
	static expand(requires = undefined) {
		return { ...DEFAULTS, ...(requires ?? {}) };
	}

	/** The non-default fields of an object that carries all eight, or null if all are defaults. */
	static compact(source) {
		const requires = {};
		for (const key of KEYS) if (source[key] !== DEFAULTS[key]) requires[key] = source[key];
		return Object.keys(requires).length ? requires : null;
	}

	static carriesAll(object) { return KEYS.every((key) => Object.hasOwn(object, key)); }

	static strip(object) { for (const key of KEYS) delete object[key]; return object; }
}
