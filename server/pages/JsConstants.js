// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/** Settings the front end reads as JavaScript globals (PHP actions/noConnection/HTML/JSConstants.php). */
const EXPORTED = Object.freeze([
	'ACTION_PROCESSOR', 'AD_HOC_DISPLAY_XML', 'AD_HOC_DISPLAY_XML_AS_INLINE', 'AD_HOC_DISPLAY_CLOB',
	'AD_HOC_DISPLAY_CLOB_AS_INLINE', 'AD_HOC_DISPLAY_BLOB', 'AD_HOC_DISPLAY_DBCLOB', 'AD_HOC_TERMINATION_CHAR',
	'AD_HOC_USER_FORWARD_ONLY_CURSOR', 'AD_HOC_COMMIT_PER_STMT', 'AD_HOC_NUMBER_OF_ROWS_TO_RETURN',
	'AD_HOC_MAX_EXECUTION_TIME', 'AD_HOC_SCRIPT_MODE', 'ALLOW_DISPLAY_OF_XML', 'ALLOW_DEVELOPER_VIEW', 'BLUEMIX',
	'BASE_FEATURES', 'CONNECTION_VERIFIER', 'CONNECTED', 'DEBUG_LOG_2_CONSOLE', 'DEFAULT_FLOATING_WINDOW_HEIGHT',
	'DEFAULT_FLOATING_WINDOW_WIDTH', 'DEFAULT_ICON_WIDTH', 'DEVELOPMENT_MODE', 'DISCONNECTED', 'DMC_IS_PUBLICLY_HOSTED',
	'ENABLE_VIEW_QUERY', 'ENABLE_VERBOSE', 'FORCE_CONNECTION_WITH_DEFAULT', 'HTML_BASE_DIRECTORY', 'IE_SPEED_EXTENSION',
	'IMAGE_BASE_DIRECTORY', 'JAVA_SSH_AVAILABLE', 'JAVA_SSH_ENABLED', 'JAVA_SQL_ENABLED', 'JS_BASE_DIRECTORY',
	'LONG_FIELD_MAX', 'MAJOR_VERSION', 'MENU_PROCESSOR', 'MINOR_VERSION', 'SUB_VERSION', 'PHPSECLIB_SSH_AVAILABLE',
	'PHPSECLIB_SSH_ENABLED', 'SESSION_SIGNON_TIMEOUT', 'SHELL_COMMAND_MAX_RUN_TIME', 'SHELL_COMMAND_TERM_CHAR',
	'SHOW_IE_PERFORMANCE_WARNING', 'SSH2_ENABLED', 'SSH_PHP_EXTENSION_AVAILABLE', 'SSH_PHP_EXTENSION_ENABLED', 'SSO',
	'TUTORIAL_BASE_DIRECTORY',
]);

/**
 * Builds the script that defines those globals and fills GLOBAL_CONSTANTS,
 * in the exact form the PHP writeJSConstant() produced.
 */
export class JsConstants {
	#config;

	constructor(config) {
		this.#config = config;
	}

	static get names() { return EXPORTED; }

	/** A setting as JavaScript source, the way PHP printed it. */
	static literal(value) {
		if (typeof value === 'boolean') return value ? 'true' : 'false';
		if (value === null || value === undefined) return '';
		if (typeof value === 'number') return String(value);
		return JSON.stringify(value);
	}

	#assignments() {
		const vars = [];
		const fields = [];
		for (const name of EXPORTED) {
			const literal = JsConstants.literal(this.#config.get(name));
			vars.push(`${name}=${literal}`);
			fields.push(`"${name}": ${name.length < literal.length ? name : literal}`);
		}
		return `var ${vars.join(',')};GLOBAL_CONSTANTS.update({${fields.join(',')}});`;
	}

	script() {
		return [
			'',
			'var GLOBAL_CONSTANTS = $H();',
			"var DB2MC_SERVER = location.href.substr(0, location.href.lastIndexOf('/')); ",
			'GLOBAL_CONSTANTS.set("DB2MC_SERVER", DB2MC_SERVER.replace("http://", ""));',
			`try{${this.#assignments()}} catch (e) {alert("writeJSConstant failed: "+e);}`,
			'var CONNECTED_DATABASE = null; ',
			'GLOBAL_CONSTANTS.set("CONNECTED_DATABASE", null);',
			'var CONNECTED_DATABASE_VERSION = null; ',
			'GLOBAL_CONSTANTS.set("CONNECTED_DATABASE_VERSION", null);',
			"console.log('Constants set');",
			'',
		].join('\n');
	}
}
