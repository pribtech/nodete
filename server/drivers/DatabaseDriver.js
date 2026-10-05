// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { DatabaseError } from './DatabaseError.js';

const require = createRequire(import.meta.url);
const LOGIN_ATTRIBUTES = Object.freeze(JSON.parse(readFileSync(new URL('./loginAttributes.json', import.meta.url), 'utf8')));

/**
 * A kind of database the TE can connect to, backed by an npm package (the PHP
 * DBConnection_<name>.php classes). Subclasses name the package and open connections.
 */
export class DatabaseDriver {
	#loadModule;
	#module;

	/** @param {{loadModule?: (name: string) => any}} options loadModule replaces require(), for tests */
	constructor({ loadModule = (name) => require(name) } = {}) {
		if (new.target === DatabaseDriver) throw new TypeError('DatabaseDriver is abstract');
		this.#loadModule = loadModule;
	}

	/** Driver name used by the front end and in connection names, e.g. IBM_DB2. */
	get id() { throw new Error(`${this.constructor.name} does not implement id`); }

	/** npm package that talks to the database. */
	get moduleName() { throw new Error(`${this.constructor.name} does not implement moduleName`); }

	/** The driver offered first on the login form. */
	get isDefault() { return false; }

	/** Fields of the login form for this driver (getSupportedDrivers). */
	get loginAttributes() { return LOGIN_ATTRIBUTES; }

	/** What to do when the driver is not usable, for the welcome page and error messages. */
	get installAdvice() { return `npm package ${this.moduleName} not installed (run: npm install ${this.moduleName})`; }

	get isInstalled() {
		try { this.module; return true; } catch { return false; }
	}

	/** The driver's npm package, loaded on first use. */
	get module() { return (this.#module ??= this.load(this.moduleName)); }

	/** Loads an npm package the driver needs. */
	load(name) {
		try {
			return this.#loadModule(name);
		} catch (error) {
			throw new DatabaseError(`npm package ${name} not installed`, undefined, { cause: error });
		}
	}

	/** Opens a connection, sets its schema and returns it. */
	async connect(spec) {
		const problem = this.validate(spec);
		if (problem) throw new DatabaseError(problem);
		let connection;
		try {
			connection = await this.open(spec);
		} catch (error) {
			throw DatabaseError.from(error);
		}
		try {
			if (spec.schema !== '' && spec.schema.toLowerCase() !== spec.username.toLowerCase()) await connection.setSchema(spec.schema);
			return connection;
		} catch (error) {
			await connection.close();
			throw DatabaseError.from(error);
		}
	}

	/** Problem with the login details that stops a connection being tried, or null. */
	validate(spec) { return spec.validate(); }

	/** Connects, reads the server information and disconnects (PHP testConnection). */
	async test(spec) {
		const connection = await this.connect(spec);
		try {
			return await connection.serverInfo();
		} finally {
			await connection.close();
		}
	}

	/** @returns {Promise<import('./DatabaseConnection.js').DatabaseConnection>} */
	async open(_spec) { throw new Error(`${this.constructor.name} does not implement open()`); }
}
