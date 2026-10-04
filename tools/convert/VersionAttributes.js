import { PhpCompat } from '../../server/util/PhpCompat.js';

/**
 * Version and feature gating attributes shared by menus, actions and tasks
 * (PHP EncodeVersion()). The front end hides items whose DBMS, version range,
 * feature or context does not match the current connection.
 */
export class VersionAttributes {
	static encode(node) {
		return {
			DBMS: node.getAttribute('DBMS', null),
			minVersion: PhpCompat.floatval(node.getAttribute('minVersion', 0)),
			minFixPack: PhpCompat.intval(node.getAttribute('minFixPack', 0)),
			maxVersion: PhpCompat.floatval(node.getAttribute('maxVersion', 0)),
			feature: String(node.getAttribute('feature', '')).trim(),
			noFeature: String(node.getAttribute('noFeature', '')).trim(),
			context: PhpCompat.lower(node.getAttribute('context', null)),
			notContext: PhpCompat.lower(node.getAttribute('notContext', null)),
		};
	}

	/** Copies the version attributes onto target, keeping target's existing key order first. */
	static applyTo(node, target) {
		return Object.assign(target, VersionAttributes.encode(node));
	}
}
