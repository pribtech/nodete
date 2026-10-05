// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escaping for request values placed into generated HTML and JavaScript. */
export class Escape {
	static html(value) {
		return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
	}

	/** Contents of a JavaScript string literal (either quote style), safe inside a <script> block. */
	static jsString(value) {
		return String(value ?? '').replace(/[\\'"\n\r\u2028\u2029<>&]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
	}

	/** JSON for embedding inside a <script> block: "</script>" and line separators cannot end it early. */
	static inlineJson(value) {
		return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
	}
}
