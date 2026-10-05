import { Ccsid } from './Ccsid.js';

/**
 * How a partner represents data (TYPDEFNAM and TYPDEFOVR from ACCRDB / ACCRDBRM): byte order
 * of numbers, and the CCSIDs of single-byte, mixed and double-byte text.
 */
export class TypeDefinition {
	static #CODECS = new Map([
		[1208, (bytes) => Buffer.from(bytes).toString('utf8')],
		[1200, (bytes) => TypeDefinition.#utf16be(bytes)],
		[13488, (bytes) => TypeDefinition.#utf16be(bytes)],
		[367, (bytes) => Buffer.from(bytes).toString('latin1')],
		[819, (bytes) => Buffer.from(bytes).toString('latin1')],
		[1252, (bytes) => Buffer.from(bytes).toString('latin1')],
		[500, (bytes) => Ccsid.EBCDIC.decode(bytes)],
		[37, (bytes) => Ccsid.EBCDIC.decode(bytes)],
	]);

	#name;
	#ccsids;

	constructor(name, { sbc = 1208, mbc = 1208, dbc = 1200 } = {}) {
		this.#name = name;
		this.#ccsids = { sbc, mbc, dbc };
	}

	/** What the client declares: big-endian numbers, UTF-8 text. */
	static CLIENT = new TypeDefinition('QTDSQLASC', { sbc: 1208, mbc: 1208, dbc: 1200 });

	get name() { return this.#name; }
	get littleEndian() { return this.#name === 'QTDSQLX86' || this.#name === 'QTDSQLVAX'; }
	get ccsids() { return { ...this.#ccsids }; }

	/** A copy with the CCSIDs a TYPDEFOVR overrides. */
	withCcsids(overrides) {
		return new TypeDefinition(this.#name, { ...this.#ccsids, ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v)) });
	}

	decode(bytes, kind = 'mbc') {
		const ccsid = this.#ccsids[kind];
		const codec = TypeDefinition.#CODECS.get(ccsid) ?? TypeDefinition.#CODECS.get(1208);
		return codec(bytes);
	}

	static #utf16be(bytes) {
		const swapped = Buffer.from(bytes);
		swapped.swap16();
		return swapped.toString('utf16le');
	}
}
