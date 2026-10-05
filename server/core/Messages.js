// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MESSAGES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'messages');

/**
 * User-facing message catalog for one language (the PHP base/language/<lang>/messages.php).
 * Unknown languages fall back to the default language; unknown keys return the key itself,
 * which is how PHP rendered an undefined constant.
 */
export class Messages {
	#language;
	#catalog;

	constructor(language, catalog) {
		this.#language = language;
		this.#catalog = Object.freeze({ ...catalog });
	}

	static #cache = new Map();

	static isAvailable(language) {
		return /^[A-Za-z_]+$/.test(language ?? '') && existsSync(path.join(MESSAGES_DIR, `${language}.json`));
	}

	static for(language, defaultLanguage = 'en_US') {
		const chosen = Messages.isAvailable(language) ? language : defaultLanguage;
		if (!Messages.#cache.has(chosen)) {
			const catalog = JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${chosen}.json`), 'utf8'));
			Messages.#cache.set(chosen, new Messages(chosen, catalog));
		}
		return Messages.#cache.get(chosen);
	}

	get language() { return this.#language; }

	get(key) { return this.#catalog[key] ?? key; }

	/** Replaces ?NAME? placeholders, e.g. format('ACTION_NOT_FOUND_W_NAME', { ACTION: 'menu' }). */
	format(key, values = {}) {
		return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`?${name}?`, value), this.get(key));
	}
}
