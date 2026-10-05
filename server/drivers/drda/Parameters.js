import { CP } from './CodePoints.js';
import { DatabaseError } from '../DatabaseError.js';

/**
 * Bind values as DRDA command data (SQLDTA): an FD:OCA description of the values (FDODSC)
 * and the values themselves (FDODTA), written big-endian with UTF-8 text as the client's
 * type definition declares. Every value is sent nullable; the server converts to the
 * parameter's own type.
 */
export class Parameters {
	static #MAX_PER_TRIPLET = 84;
	static #MAX_VARCHAR = 32767;

	/**
	 * Fills an SQLDTA command data object.
	 * @param {import('../BindParameter.js').BindParameter[]} parameters
	 */
	static write(sqldta, parameters) {
		const fields = parameters.map((p) => Parameters.#field(p));
		sqldta.bytes(CP.FDODSC, Parameters.#description(fields));
		sqldta.bytes(CP.FDODTA, Buffer.concat([Buffer.from([0x00]), ...fields.map((f) => f.data)]));
	}

	static #field({ value, dataType, position }) {
		if (value === null || value === undefined) return { type: 0x3F, length: Parameters.#MAX_VARCHAR, data: Buffer.from([0xFF]) };
		switch (dataType) {
			case 'integer':
			case 'bigint': {
				const data = Buffer.alloc(9);
				data.writeBigInt64BE(BigInt(Math.trunc(Number(value))), 1);
				return { type: 0x17, length: 8, data };
			}
			case 'double': {
				const data = Buffer.alloc(9);
				data.writeDoubleBE(Number(value), 1);
				return { type: 0x0B, length: 8, data };
			}
			case 'blob': return { type: 0x29, length: Parameters.#MAX_VARCHAR, data: Parameters.#ld(Buffer.from(String(value), 'utf8'), position) };
			default: return { type: 0x3F, length: Parameters.#MAX_VARCHAR, data: Parameters.#ld(Buffer.from(String(value), 'utf8'), position) };
		}
	}

	/** Indicator (present), 2-byte length, bytes. */
	static #ld(bytes, position) {
		if (bytes.length > Parameters.#MAX_VARCHAR) throw new DatabaseError(`Parameter ${position} is longer than ${Parameters.#MAX_VARCHAR} bytes`);
		const header = Buffer.alloc(3);
		header.writeUInt16BE(bytes.length, 1);
		return Buffer.concat([header, bytes]);
	}

	/** N-GDA triplet (continued by CPT triplets past 84 values), then the row layout. */
	static #description(fields) {
		const triplets = [];
		for (let i = 0; i < fields.length; i += Parameters.#MAX_PER_TRIPLET) {
			const group = fields.slice(i, i + Parameters.#MAX_PER_TRIPLET);
			const triplet = Buffer.alloc(3 + group.length * 3);
			triplet[0] = triplet.length;
			triplet[1] = i === 0 ? 0x76 : 0x7F;
			triplet[2] = i === 0 ? 0xD0 : 0x00;
			group.forEach((field, n) => {
				triplet[3 + n * 3] = field.type;
				triplet.writeUInt16BE(field.length, 4 + n * 3);
			});
			triplets.push(triplet);
		}
		if (triplets.length === 0) triplets.push(Buffer.from([0x03, 0x76, 0xD0]));
		return Buffer.concat([...triplets, Buffer.from([0x06, 0x71, 0xE4, 0xD0, 0x00, 0x01])]);
	}
}
