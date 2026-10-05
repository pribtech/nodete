// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { DSS } from './CodePoints.js';

const MAX_SEGMENT = 0x7FFF;

/** Builds the parameters of one DDM object: each is length (2), code point (2), data. */
export class DdmBuilder {
	#chunks = [];
	#ccsid;

	constructor(ccsid) { this.#ccsid = ccsid; }

	get ccsid() { return this.#ccsid; }

	bytes(codePoint, data) {
		this.#chunks.push(DdmBuilder.object(codePoint, Buffer.from(data)));
		return this;
	}

	string(codePoint, text) { return this.bytes(codePoint, this.#ccsid.encode(text)); }

	/** A string padded with blanks to at least length bytes (package names and the like). */
	paddedString(codePoint, text, length) {
		const data = this.#ccsid.encode(text);
		return this.bytes(codePoint, data.length >= length ? data : Buffer.concat([data, this.#ccsid.encode(' '.repeat(length - data.length))]));
	}

	uint8(codePoint, value) { return this.bytes(codePoint, [value]); }

	uint16(codePoint, value) {
		const data = Buffer.alloc(2);
		data.writeUInt16BE(value);
		return this.bytes(codePoint, data);
	}

	uint32(codePoint, value) {
		const data = Buffer.alloc(4);
		data.writeUInt32BE(value);
		return this.bytes(codePoint, data);
	}

	/** A collection parameter whose contents are built by build(builder). */
	nested(codePoint, build) {
		const inner = new DdmBuilder(this.#ccsid);
		build(inner);
		return this.bytes(codePoint, inner.data());
	}

	/** Raw bytes added as they are. */
	raw(data) {
		this.#chunks.push(Buffer.from(data));
		return this;
	}

	data() { return Buffer.concat(this.#chunks); }

	/**
	 * One DDM object: header plus data. Past 32 KB the length field is 0x8000 plus 4 plus the
	 * number of extended length bytes (0x8008: four bytes holding the data length follow).
	 */
	static object(codePoint, data) {
		if (data.length + 4 <= MAX_SEGMENT) {
			const header = Buffer.alloc(4);
			header.writeUInt16BE(data.length + 4);
			header.writeUInt16BE(codePoint, 2);
			return Buffer.concat([header, data]);
		}
		const header = Buffer.alloc(8);
		header.writeUInt16BE(0x8008);
		header.writeUInt16BE(codePoint, 2);
		header.writeUInt32BE(data.length, 4);
		return Buffer.concat([header, data]);
	}
}

/**
 * A request: commands (RQSDSS), each optionally followed by command data objects (OBJDSS)
 * with the same correlation id, chained into one buffer sent in one write.
 */
export class DdmRequest {
	#structures = [];
	#ccsid;
	#nextCorrelation;

	constructor(ccsid, firstCorrelation = 1) {
		this.#ccsid = ccsid;
		this.#nextCorrelation = firstCorrelation;
	}

	get nextCorrelation() { return this.#nextCorrelation; }

	/** Adds a command; build(builder) adds its parameters; objects are [codePoint, build] command data. */
	command(codePoint, build = () => {}, objects = []) {
		const correlation = this.#nextCorrelation++;
		const builder = new DdmBuilder(this.#ccsid);
		build(builder);
		this.#structures.push({ type: DSS.RQSDSS, correlation, data: DdmBuilder.object(codePoint, builder.data()) });
		for (const [objectCodePoint, buildObject] of objects) {
			const object = new DdmBuilder(this.#ccsid);
			buildObject(object);
			this.#structures.push({ type: DSS.OBJDSS, correlation, data: DdmBuilder.object(objectCodePoint, object.data()) });
		}
		return this;
	}

	/** The request bytes, with chaining flags and DSS continuation for structures past 32 KB. */
	toBuffer() {
		return Buffer.concat(this.#structures.map((structure, i) => {
			const next = this.#structures[i + 1];
			let format = structure.type;
			if (next) format |= DSS.CHAINED | (next.correlation === structure.correlation ? DSS.SAME_CORRELATOR : 0);
			return DdmRequest.#segments(structure.data, format, structure.correlation);
		}));
	}

	static #segments(data, format, correlation) {
		const header = Buffer.alloc(6);
		header.writeUInt8(0xD0, 2);
		header.writeUInt8(format, 3);
		header.writeUInt16BE(correlation, 4);
		if (data.length + 6 <= MAX_SEGMENT) {
			header.writeUInt16BE(data.length + 6);
			return Buffer.concat([header, data]);
		}
		header.writeUInt16BE(0x8000 | MAX_SEGMENT);
		const parts = [header, data.subarray(0, MAX_SEGMENT - 6)];
		for (let at = MAX_SEGMENT - 6; at < data.length; at += MAX_SEGMENT - 2) {
			const piece = data.subarray(at, at + MAX_SEGMENT - 2);
			const more = at + piece.length < data.length;
			const continuation = Buffer.alloc(2);
			continuation.writeUInt16BE((more ? 0x8000 : 0) | (piece.length + 2));
			parts.push(continuation, piece);
		}
		return Buffer.concat(parts);
	}
}

/** One DDM object of a reply: its code point and data, with its parameters parsed on demand. */
export class DdmObject {
	#codePoint;
	#data;
	#parameters = null;

	constructor(codePoint, data) {
		this.#codePoint = codePoint;
		this.#data = data;
	}

	get codePoint() { return this.#codePoint; }
	get data() { return this.#data; }

	/** The objects inside this one, read as a sequence of DDM objects. */
	get parameters() { return (this.#parameters ??= DdmObject.parseAll(this.#data)); }

	/** The first parameter with codePoint, or undefined. */
	get(codePoint) { return this.parameters.find((p) => p.codePoint === codePoint); }

	all(codePoint) { return this.parameters.filter((p) => p.codePoint === codePoint); }

	uint16(codePoint, fallback = undefined) { return this.get(codePoint)?.data.readUInt16BE(0) ?? fallback; }

	string(codePoint, ccsid) { const p = this.get(codePoint); return p ? ccsid.decode(p.data) : undefined; }

	/** Reads consecutive DDM objects from bytes. */
	static parseAll(bytes) {
		const objects = [];
		for (let at = 0; at + 4 <= bytes.length;) {
			let length = bytes.readUInt16BE(at);
			const codePoint = bytes.readUInt16BE(at + 2);
			let start = at + 4;
			if (length & 0x8000) {
				const extra = (length & 0x7FFF) - 4; // bytes of extended length; none means "to the end"
				if (extra < 0 || extra > 8) throw new Error(`DDM object ${codePoint.toString(16)} has an invalid extended length`);
				const dataLength = extra === 0 ? bytes.length - start : Number(extra > 6 ? bytes.readBigUInt64BE(start) : bytes.readUIntBE(start, extra));
				start += extra;
				length = 4 + extra + dataLength;
			}
			if (length < 4) throw new Error(`DDM object ${codePoint.toString(16)} has a length of ${length}`);
			objects.push(new DdmObject(codePoint, bytes.subarray(start, at + length)));
			at += length;
		}
		return objects;
	}
}

/** A reply structure (DSS) after continuation segments are joined: its type, correlation id and objects. */
export class DdmReply {
	constructor(type, correlation, data) {
		this.type = type;
		this.correlation = correlation;
		this.objects = DdmObject.parseAll(data);
	}

	/**
	 * Splits complete reply bytes into structures; returns null while the chain is incomplete
	 * (the last structure still says another follows, or a segment is cut short).
	 */
	static parseChain(bytes) {
		const structures = [];
		let at = 0;
		while (at < bytes.length) {
			if (at + 6 > bytes.length) return null;
			let length = bytes.readUInt16BE(at);
			const format = bytes.readUInt8(at + 3);
			const correlation = bytes.readUInt16BE(at + 4);
			let continued = (length & 0x8000) !== 0;
			if (continued) length = MAX_SEGMENT;
			if (at + length > bytes.length) return null;
			const pieces = [bytes.subarray(at + 6, at + length)];
			at += length;
			while (continued) {
				if (at + 2 > bytes.length) return null;
				let piece = bytes.readUInt16BE(at);
				continued = (piece & 0x8000) !== 0;
				if (continued) piece = MAX_SEGMENT;
				if (at + piece > bytes.length) return null;
				pieces.push(bytes.subarray(at + 2, at + piece));
				at += piece;
			}
			structures.push(new DdmReply(format & 0x0F, correlation, Buffer.concat(pieces)));
			if ((format & DSS.CHAINED) === 0) return at === bytes.length ? structures : null;
		}
		return null;
	}
}
