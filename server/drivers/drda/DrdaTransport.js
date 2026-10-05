// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import net from 'node:net';
import tls from 'node:tls';
import { DdmReply } from './Ddm.js';
import { DatabaseError } from '../DatabaseError.js';

/**
 * The TCP (or TLS) connection to a DRDA server: sends one request chain and waits for its
 * whole reply chain. One request is in flight at a time, as DRDA requires.
 */
export class DrdaTransport {
	#socket;
	#buffer = Buffer.alloc(0);
	#waiting = null;
	#closed = false;
	#queue = Promise.resolve();

	constructor(socket) {
		this.#socket = socket;
		socket.on('data', (chunk) => this.#received(chunk));
		socket.on('error', (error) => this.#fail(new DatabaseError(`DRDA connection error: ${error.message}`, '08006', { cause: error })));
		socket.on('close', () => this.#fail(new DatabaseError('DRDA connection closed by the server', '08006')));
	}

	/** Opens a connection; rejects with SQLSTATE 08001 when the server cannot be reached. */
	static connect({ host, port, secure = false, timeout = 30_000 }) {
		return new Promise((resolve, reject) => {
			const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
			const timer = setTimeout(() => socket.destroy(new Error(`timed out after ${timeout} ms`)), timeout);
			socket.once(secure ? 'secureConnect' : 'connect', () => {
				clearTimeout(timer);
				socket.setNoDelay(true);
				resolve(new DrdaTransport(socket));
			});
			socket.once('error', (error) => {
				clearTimeout(timer);
				reject(new DatabaseError(`Cannot connect to ${host}:${port}: ${error.message}`, '08001', { cause: error }));
			});
		});
	}

	/** Sends a request (bytes) and resolves with its reply structures. */
	send(request) {
		const sent = this.#queue.then(() => new Promise((resolve, reject) => {
			if (this.#closed) { reject(new DatabaseError('DRDA connection is closed', '08003')); return; }
			this.#waiting = { resolve, reject };
			this.#socket.write(request);
		}));
		this.#queue = sent.catch(() => {});
		return sent;
	}

	#received(chunk) {
		this.#buffer = this.#buffer.length ? Buffer.concat([this.#buffer, chunk]) : chunk;
		if (!this.#waiting) return;
		let reply;
		try {
			reply = DdmReply.parseChain(this.#buffer);
		} catch (error) {
			this.#fail(new DatabaseError(`DRDA reply could not be read: ${error.message}`, '08S01', { cause: error }));
			return;
		}
		if (!reply) return;
		this.#buffer = Buffer.alloc(0);
		const { resolve } = this.#waiting;
		this.#waiting = null;
		resolve(reply);
	}

	#fail(error) {
		this.#closed = true;
		const waiting = this.#waiting;
		this.#waiting = null;
		waiting?.reject(error);
	}

	close() {
		this.#closed = true;
		this.#socket.end();
		this.#socket.destroy();
	}
}
