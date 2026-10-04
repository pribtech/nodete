import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * File access for actions, confined to the application folder (db2te/).
 *
 * The PHP version read whatever path the browser sent (e.g. menu rootCallBack),
 * which allowed reading any file on the server. Every path here is resolved
 * against the app root and rejected if it escapes it.
 */
export class AppFiles {
	#root;

	constructor(root) {
		this.#root = path.resolve(root);
	}

	get root() { return this.#root; }

	/** Absolute path for an app-relative path such as "./menu/file". Throws if it leaves the app root. */
	resolve(relativePath) {
		const absolute = path.resolve(this.#root, String(relativePath ?? ''));
		if (absolute !== this.#root && !absolute.startsWith(this.#root + path.sep))
			throw new Error(`Path outside application folder: ${relativePath}`);
		return absolute;
	}

	#stat(relativePath) {
		try { return statSync(this.resolve(relativePath)); } catch { return null; }
	}

	isFile(relativePath) { return this.#stat(relativePath)?.isFile() ?? false; }
	isDirectory(relativePath) { return this.#stat(relativePath)?.isDirectory() ?? false; }

	readText(relativePath) { return readFileSync(this.resolve(relativePath), 'utf8'); }

	/** Text content, or null when the file is missing or not allowed (PHP file_get_contents() === false). */
	tryReadText(relativePath) {
		try { return this.isFile(relativePath) ? this.readText(relativePath) : null; } catch { return null; }
	}

	/** Entry names sorted like PHP sort() on scandir() output (byte order). */
	list(relativePath) {
		if (!this.isDirectory(relativePath)) return [];
		return readdirSync(this.resolve(relativePath)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
	}

	/** Sorted entry names matching a pattern, e.g. listMatching('./menu', /^menu_.*\.xml$/i). */
	listMatching(relativePath, pattern) {
		return this.list(relativePath).filter((name) => pattern.test(name));
	}
}
