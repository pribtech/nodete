// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { ByteReader } from './ByteReader.js';
import { Sqlca } from './Sqlca.js';

/**
 * The layout of a query's rows (QRYDSC, FD:OCA): one field per column, each a DRDA data
 * type with its length. Odd type codes are nullable: their values start with an indicator.
 */
export class QueryDescriptor {
	#fields = [];

	/** @param {Buffer[]} parts the QRYDSC objects of a query, in order */
	constructor(parts) {
		const data = Buffer.concat(parts);
		for (let at = 0; at < data.length;) {
			const length = data[at];
			if (length === 0) break;
			const tripletType = data[at + 1];
			if (tripletType === 0x76 || tripletType === 0x7F) { // N-GDA or its continuation (CPT)
				for (let entry = at + 3; entry + 3 <= at + length; entry += 3)
					this.#fields.push({ drdaType: data[entry], length: data.readUInt16BE(entry + 1) });
			} else if (tripletType === 0x70 || tripletType === 0x78) {
				throw new Error('Query descriptions with type overrides (SDA/MDD triplets) are not supported yet');
			}
			at += length;
		}
	}

	get fields() { return this.#fields; }
}

/**
 * Decodes rows from QRYDTA blocks. Each row is an SQLCAGRP (null for an ordinary row; an
 * SQLCA with SQLCODE 100 ends the data, a negative one is an error), then the row's data
 * group. A row cut at a block boundary is kept until the next block arrives. Large objects
 * arrive as EXTDTA objects after the block and are attached to their rows in order.
 */
export class RowDecoder {
	static #LOB = Symbol('lob');

	#fields;
	#types;
	#pending = Buffer.alloc(0);
	#lobs = [];

	constructor(descriptor, types) {
		this.#fields = descriptor.fields;
		this.#types = types;
	}

	/**
	 * Decodes the complete rows in a block.
	 * @returns {{rows: any[][], end: Sqlca|null}} end is the SQLCA that ended the data, if it did
	 */
	decode(block) {
		const data = this.#pending.length ? Buffer.concat([this.#pending, block]) : block;
		const reader = new ByteReader(data, this.#types);
		const rows = [];
		let end = null;
		while (reader.remaining > 0) {
			const start = reader.position;
			try {
				const sqlca = Sqlca.read(reader);
				if (reader.uint8() === 0xFF) { // no row: end of data, or an error
					end = sqlca ?? null;
					if (!end) continue;
					break;
				}
				const row = this.#fields.map((field) => this.#value(reader, field));
				if (sqlca?.isError) { end = sqlca; break; }
				row.forEach((value, index) => {
					if (value !== RowDecoder.#LOB) return;
					const type = this.#fields[index].drdaType & ~1;
					this.#lobs.push({ row, index, nullable: (this.#fields[index].drdaType & 1) === 1, binary: type === 0xC8, kind: type === 0xCC ? 'dbc' : (type === 0xCA ? 'sbc' : 'mbc') });
				});
				rows.push(row);
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				this.#pending = data.subarray(start); // the rest of this row comes in the next block
				return { rows, end };
			}
		}
		this.#pending = Buffer.alloc(0);
		return { rows, end };
	}

	/** Fills the large objects of decoded rows from the EXTDTA objects that followed the block. */
	attachLobs(extdta) {
		for (const data of extdta) {
			const slot = this.#lobs.shift();
			if (!slot) break;
			const bytes = slot.nullable ? data.subarray(1) : data;
			slot.row[slot.index] = slot.binary ? Buffer.from(bytes) : this.#types.decode(bytes, slot.kind);
		}
	}

	#value(reader, field) {
		const nullable = (field.drdaType & 1) === 1;
		if (nullable && reader.uint8() >= 0x80) return null;
		const type = field.drdaType & ~1;
		const length = field.length;
		switch (type) {
			case 0x02: return String(reader.int32());
			case 0x04: return String(reader.int16());
			case 0x06: return String(reader.int8());
			case 0x16: return String(reader.int64());
			case 0x0A: return String(length === 4 ? reader.float32() : reader.float64());
			case 0x0C: return String(reader.float32());
			case 0x0E: return RowDecoder.packedDecimal(reader.bytes(Math.floor((length >> 8) / 2) + 1), length & 0xFF);
			case 0x10: return RowDecoder.#zonedDecimal(reader.bytes(length >> 8), length & 0xFF);
			case 0x20: case 0x22: case 0x24: case 0x30: case 0x12: return reader.text(length, 'sbc');
			case 0x3C: return reader.text(length, 'mbc');
			case 0x36: return reader.text(length * 2, 'dbc');
			case 0x32: case 0x34: return reader.text(reader.uint16(), 'sbc');
			case 0x3E: case 0x40: return reader.text(reader.uint16(), 'mbc');
			case 0x38: case 0x3A: return reader.text(reader.uint16() * 2, 'dbc');
			case 0x46: return reader.text(reader.uint8(), 'sbc');
			case 0x48: return reader.text(reader.uint8(), 'mbc');
			case 0x26: return reader.bytes(length).toString('hex');
			case 0x28: case 0x2A: return reader.bytes(reader.uint16()).toString('hex');
			case 0x44: return reader.bytes(reader.uint8()).toString('hex');
			case 0xBE: return reader.uint8() ? 'true' : 'false';
			case 0xC8: case 0xCA: case 0xCC: case 0xCE: return this.#lob(reader, field, type);
			case 0x18: case 0x1A: case 0x1C: case 0x14: return String(reader.int32()); // locators
			default: throw new Error(`DRDA data type 0x${type.toString(16)} is not supported yet`);
		}
	}

	/** A LOB column holds the length; the bytes follow the block as an EXTDTA object. */
	#lob(reader, field, type) {
		const width = field.length & 0x7FFF;
		const size = Number(reader.bytes(width).readUIntBE(0, Math.min(width, 6)));
		if (size === 0) return type === 0xC8 ? Buffer.alloc(0) : '';
		return RowDecoder.#LOB;
	}

	/** True while some decoded rows still wait for their large objects. */
	get awaitingLobs() { return this.#lobs.length > 0; }

	/** Packed decimal: two digits a byte, the last nibble the sign (D or B negative). */
	static packedDecimal(bytes, scale) {
		const hex = bytes.toString('hex');
		const sign = hex.at(-1);
		let digits = hex.slice(0, -1).replace(/^0+(?=\d)/, '');
		if (scale > 0) {
			digits = digits.padStart(scale + 1, '0');
			digits = `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
		}
		return (sign === 'd' || sign === 'b') && /[1-9]/.test(digits) ? `-${digits}` : digits;
	}

	static #zonedDecimal(bytes, scale) {
		const sign = bytes.at(-1) >> 4;
		let digits = [...bytes].map((b) => String(b & 0x0F)).join('').replace(/^0+(?=\d)/, '');
		if (scale > 0) digits = `${digits.padStart(scale + 1, '0').slice(0, -scale)}.${digits.padStart(scale + 1, '0').slice(-scale)}`;
		return sign === 0x0D || sign === 0x0B ? `-${digits}` : digits;
	}
}
