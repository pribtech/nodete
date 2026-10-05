// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const VIEWS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'views');

/**
 * An HTML file from server/views with {{name}} slots, filled at render time.
 * Values are inserted as-is: callers pass markup they built, never raw user input.
 */
export class Template {
	static #cache = new Map();
	#source;

	constructor(source) {
		this.#source = source;
	}

	static load(name) {
		if (!Template.#cache.has(name)) Template.#cache.set(name, new Template(readFileSync(path.join(VIEWS_DIR, name), 'utf8')));
		return Template.#cache.get(name);
	}

	/** Fills every slot; a slot without a value is an error, so templates and code stay in step. */
	render(values) {
		return this.#source.replace(/\{\{(\w+)\}\}/g, (_, name) => {
			if (!Object.hasOwn(values, name)) throw new Error(`Template slot "${name}" has no value`);
			return String(values[name] ?? '');
		});
	}
}
