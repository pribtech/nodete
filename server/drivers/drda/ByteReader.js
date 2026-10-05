// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
/**
 * Reads values from DRDA reply data. Numbers follow the server's byte order, which its
 * TYPDEFNAM announces (QTDSQLX86 is little-endian, QTDSQLASC and QTDSQL370 big-endian);
 * text uses the server's single-byte, mixed and double-byte CCSIDs.
 */
export class ByteReader {
	#data;
	#at;
	#types;

	/** @param {Buffer} data @param {import('./TypeDefinition.js').TypeDefinition} types */
	constructor(data, types, at = 0) {
		this.#data = data;
		this.#types = types;
		this.#at = at;
	}

	get position() { return this.#at; }
	get remaining() { return this.#data.length - this.#at; }
	get types() { return this.#types; }

	#take(length) {
		if (this.#at + length > this.#data.length) throw new RangeError(`DRDA data ends ${this.#at + length - this.#data.length} bytes early`);
		const slice = this.#data.subarray(this.#at, this.#at + length);
		this.#at += length;
		return slice;
	}

	has(length) { return this.#at + length <= this.#data.length; }
	peek() { return this.#data[this.#at]; }
	skip(length) { this.#take(length); }
	bytes(length) { return Buffer.from(this.#take(length)); }
	uint8() { return this.#take(1)[0]; }
	int8() { return this.#take(1).readInt8(0); }

	int16() { const b = this.#take(2); return this.#types.littleEndian ? b.readInt16LE(0) : b.readInt16BE(0); }
	uint16() { const b = this.#take(2); return this.#types.littleEndian ? b.readUInt16LE(0) : b.readUInt16BE(0); }
	int32() { const b = this.#take(4); return this.#types.littleEndian ? b.readInt32LE(0) : b.readInt32BE(0); }
	int64() { const b = this.#take(8); return this.#types.littleEndian ? b.readBigInt64LE(0) : b.readBigInt64BE(0); }
	float32() { const b = this.#take(4); return this.#types.littleEndian ? b.readFloatLE(0) : b.readFloatBE(0); }
	float64() { const b = this.#take(8); return this.#types.littleEndian ? b.readDoubleLE(0) : b.readDoubleBE(0); }

	/** Lengths inside DDM structures (not FD:OCA data) are always big-endian. */
	uint16BE() { return this.#take(2).readUInt16BE(0); }

	/** Text in the single-byte (sbc), mixed (mbc) or double-byte (dbc) CCSID. */
	text(length, kind = 'mbc') { return this.#types.decode(this.#take(length), kind); }

	/** VCS: a single-byte string with a 2-byte length. */
	vcs() { const length = this.uint16BE(); return length ? this.text(length, 'sbc') : ''; }

	/** VCM then VCS: one of the two holds the string, the other has length 0. */
	vcmOrVcs() {
		const mixed = this.uint16BE();
		const value = mixed ? this.text(mixed, 'mbc') : null;
		const single = this.uint16BE();
		return value ?? (single ? this.text(single, 'sbc') : '');
	}

	/** LD: bytes with a 2-byte length; null when the length is 0. */
	ld() { const length = this.uint16BE(); return length ? this.bytes(length) : null; }
}
