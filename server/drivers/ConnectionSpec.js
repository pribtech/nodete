// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/**
 * What is needed to open one database connection: the fields of the TE login form.
 * Immutable; the connection's name is derived from it as the PHP version did,
 * "<driver>:<user>@<database>[.<host>:<port>]".
 */
export class ConnectionSpec {
	static FIELDS = Object.freeze(['databaseDriver', 'database', 'schema', 'username', 'password', 'hostname', 'portnumber', 'usePersistentConnection', 'comment', 'group']);

	/** Login form parameter for each field. */
	static LOGIN_PARAMETERS = Object.freeze({
		databaseDriver: 'TE_DATABASE_LOGIN_DATABASE_DRIVER',
		database: 'TE_DATABASE_LOGIN_DATABASE',
		schema: 'TE_DATABASE_LOGIN_SCHEMA',
		username: 'TE_DATABASE_LOGIN_USERNAME',
		password: 'TE_DATABASE_LOGIN_PASSWORD',
		hostname: 'TE_DATABASE_LOGIN_HOSTNAME',
		portnumber: 'TE_DATABASE_LOGIN_PORTNUMBER',
		usePersistentConnection: 'TE_DATABASE_USE_PERSISTENT_CONNECTION',
		comment: 'TE_DATABASE_LOGIN_COMMENT',
		group: 'TE_DATABASE_LOGIN_GROUP',
	});

	/** Fields trimmed when read from the form (passwords and comments are taken as typed). */
	static #TRIMMED = new Set(['databaseDriver', 'database', 'username', 'hostname', 'portnumber', 'usePersistentConnection']);

	constructor(fields = {}) {
		for (const name of ConnectionSpec.FIELDS) this[name] = fields[name] ?? '';
		Object.freeze(this);
	}

	/** Reads the login form fields of a request. */
	static fromLogin(request, defaultDriver) {
		const fields = {};
		for (const [name, parameter] of Object.entries(ConnectionSpec.LOGIN_PARAMETERS)) {
			const value = request.getParameter(parameter, '') ?? '';
			fields[name] = ConnectionSpec.#TRIMMED.has(name) ? String(value).trim() : value;
		}
		fields.databaseDriver ||= defaultDriver;
		return new ConnectionSpec(fields);
	}

	get name() {
		return `${this.databaseDriver}:${this.username}@${this.database}${this.hostname !== '' ? `.${this.hostname}:${this.portnumber}` : ''}`;
	}

	/** True when the database is reached through the client's catalog rather than host and port. */
	get isCataloged() { return this.hostname === '' || this.portnumber === ''; }

	with(changes) { return new ConnectionSpec({ ...this, ...changes }); }

	/** Problem that stops a connection being attempted, or null. */
	validate() {
		if (String(this.database).trim() === '') return 'No database specified!';
		if (String(this.username).trim() === '') return 'No username specified!';
		return null;
	}
}
