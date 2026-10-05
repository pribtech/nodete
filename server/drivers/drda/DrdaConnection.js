import { DrdaTransport } from './DrdaTransport.js';
import { DdmRequest } from './Ddm.js';
import { CP, SECMEC, SEVERITY, CODE_POINT_NAMES, DSS } from './CodePoints.js';
import { Ccsid } from './Ccsid.js';
import { TypeDefinition } from './TypeDefinition.js';
import { ByteReader } from './ByteReader.js';
import { Sqlca } from './Sqlca.js';
import { Sqlda } from './Sqlda.js';
import { QueryDescriptor, RowDecoder } from './QueryData.js';
import { Parameters } from './Parameters.js';
import { DatabaseError } from '../DatabaseError.js';

/** Reply messages that report a failure, and what to say about each. */
const FAILURES = new Map([
	[CP.RDBNFNRM, ['08004', 'Database not found']], [CP.RDBAFLRM, ['08004', 'Database access failed']],
	[CP.RDBATHRM, ['08004', 'Not authorized to the database']], [CP.RDBNACRM, ['08003', 'Database not accessed']],
	[CP.SYNTAXRM, ['08S01', 'DRDA syntax error']], [CP.PRCCNVRM, ['08S01', 'DRDA conversation protocol error']],
	[CP.CMDNSPRM, ['0A000', 'Command not supported by the server']], [CP.PRMNSPRM, ['0A000', 'Parameter not supported by the server']],
	[CP.VALNSPRM, ['0A000', 'Parameter value not supported by the server']], [CP.OBJNSPRM, ['0A000', 'Object not supported by the server']],
	[CP.TRGNSPRM, ['0A000', 'Target not supported by the server']], [CP.MGRLVLRM, ['08004', 'Manager level not supported by the server']],
	[CP.CMDCHKRM, ['58009', 'Command check failed']], [CP.AGNPRMRM, ['58009', 'Permanent agent error']],
	[CP.RSCLMTRM, ['57011', 'Resource limit reached']], [CP.DTAMCHRM, ['22000', 'Data descriptor mismatch']],
	[CP.QRYNOPRM, ['24501', 'Query not open']], [CP.QRYPOPRM, ['24502', 'Query previously opened']],
	[CP.OPNQFLRM, [null, 'Open query failed']], [CP.SQLERRRM, [null, 'SQL error']], [CP.ABNUOWRM, ['40003', 'Unit of work ended abnormally']],
]);

/** Security check codes (SECCHKCD) that mean the log on was refused. */
const SECURITY_FAILURES = new Map([
	[0x0E, 'password expired'], [0x0F, 'password invalid'], [0x10, 'password missing'], [0x12, 'user ID missing'],
	[0x13, 'user ID or password invalid'], [0x14, 'user ID revoked'], [0x15, 'new password invalid'],
	[0x01, 'security mechanism not supported'], [0x0A, 'security token invalid'],
]);

/**
 * One connection to a DRDA server (DB2 for Linux, UNIX and Windows, DB2 for z/OS, DB2 for i,
 * Apache Derby) in JavaScript. Statements are dynamic SQL in the server's dynamic package
 * (by default NULLID.SYSSH200, as DB2's own drivers use), each in its own section.
 */
export class DrdaConnection {
	#transport;
	#dialect;
	#database;
	#ccsid = Ccsid.EBCDIC;
	#types = TypeDefinition.CLIENT;
	#correlation = 1;
	#server = {};
	#sections = new Set();

	/**
	 * @param {object} dialect what the server expects of its clients
	 * @param {string} dialect.productId PRDID the client sends (Derby's server accepts only DNC...)
	 * @param {string} dialect.packageName dynamic SQL package, e.g. SYSSH200
	 */
	constructor(transport, database, dialect) {
		this.#transport = transport;
		this.#database = database;
		this.#dialect = { collection: 'NULLID', consistencyToken: 'SYSLVL01', ...dialect };
	}

	/** Connects, logs on and opens the database. */
	static async open({ host, port, database, user, password, secure = false, dialect }) {
		const transport = await DrdaTransport.connect({ host, port, secure });
		const connection = new DrdaConnection(transport, database, dialect);
		try {
			await connection.#logOn(user, password);
			return connection;
		} catch (error) {
			transport.close();
			throw error;
		}
	}

	/** What the server said about itself: product id (PRDID), name, class and release level. */
	get server() { return { ...this.#server }; }

	// ---- log on ----------------------------------------------------------------------

	async #logOn(user, password) {
		const exchange = await this.#send((r) => r.command(CP.EXCSAT, (b) => b
			.string(CP.EXTNAM, 'TechnologyExplorer')
			.string(CP.SRVNAM, 'nodejs')
			.string(CP.SRVRLSLV, `${this.#dialect.productId}/1.0`)
			.nested(CP.MGRLVLLS, (m) => {
				for (const [manager, level] of [[CP.AGENT, 7], [CP.SQLAM, 7], [CP.RDB, 7], [CP.SECMGR, 7], [CP.UNICODEMGR, 1208]]) m.raw(DrdaConnection.#pair(manager, level));
			})
			.string(CP.SRVCLSNM, 'QTE/NODEJS')));
		const excsatrd = this.#find(exchange, CP.EXCSATRD);
		const levels = new Map();
		const managers = excsatrd?.get(CP.MGRLVLLS)?.data ?? Buffer.alloc(0);
		for (let at = 0; at + 4 <= managers.length; at += 4) levels.set(managers.readUInt16BE(at), managers.readUInt16BE(at + 2));
		this.#server = {
			name: excsatrd?.string(CP.SRVNAM, Ccsid.EBCDIC) ?? '',
			className: excsatrd?.string(CP.SRVCLSNM, Ccsid.EBCDIC) ?? '',
			releaseLevel: excsatrd?.string(CP.SRVRLSLV, Ccsid.EBCDIC) ?? '',
		};
		if ((levels.get(CP.SQLAM) ?? 0) < 7) throw new DatabaseError(`The server supports DRDA SQLAM level ${levels.get(CP.SQLAM) ?? 'unknown'}; level 7 is needed`, '08004');

		const accsec = await this.#send((r) => r.command(CP.ACCSEC, (b) => b.uint16(CP.SECMEC, SECMEC.USRIDPWD).paddedString(CP.RDBNAM, this.#database, 18)));
		const secmec = this.#find(accsec, CP.ACCSECRD)?.uint16(CP.SECMEC);
		if (secmec !== SECMEC.USRIDPWD) throw new DatabaseError('The server does not accept a user ID and password in clear (security mechanism 3); encrypted logons are not supported yet', '08004');
		if (levels.get(CP.UNICODEMGR) === 1208) this.#ccsid = Ccsid.UTF8; // after ACCSECRD, as servers switch

		const access = await this.#send((r) => r
			.command(CP.SECCHK, (b) => b.uint16(CP.SECMEC, SECMEC.USRIDPWD).paddedString(CP.RDBNAM, this.#database, 18).string(CP.USRID, user).string(CP.PASSWORD, password))
			.command(CP.ACCRDB, (b) => b
				.paddedString(CP.RDBNAM, this.#database, 18)
				.uint16(CP.RDBACCCL, CP.SQLAM)
				.string(CP.PRDID, this.#dialect.productId)
				.string(CP.TYPDEFNAM, TypeDefinition.CLIENT.name)
				.bytes(CP.CRRTKN, this.#ccsid.encode(`TE.${process.pid}.${Date.now().toString(36)}`.slice(0, 32)))
				.nested(CP.TYPDEFOVR, (o) => o.uint16(CP.CCSIDSBC, 1208).uint16(CP.CCSIDDBC, 1200).uint16(CP.CCSIDMBC, 1208))), { check: false });
		const secchk = this.#find(access, CP.SECCHKRM);
		const code = secchk?.get(CP.SECCHKCD)?.data[0] ?? 0;
		if (code !== 0) throw new DatabaseError(`Log on refused: ${SECURITY_FAILURES.get(code) ?? `security check code 0x${code.toString(16)}`}`, '28000');
		this.#check(access);
		const accrdbrm = this.#find(access, CP.ACCRDBRM);
		if (!accrdbrm) throw new DatabaseError('The server did not open the database', '08004');
		this.#server.productId = accrdbrm.string(CP.PRDID, this.#ccsid) ?? '';
		const typdefnam = accrdbrm.string(CP.TYPDEFNAM, this.#ccsid) ?? 'QTDSQLASC';
		const overrides = accrdbrm.get(CP.TYPDEFOVR);
		this.#types = new TypeDefinition(typdefnam).withCcsids({
			sbc: overrides?.uint16(CP.CCSIDSBC), mbc: overrides?.uint16(CP.CCSIDMBC), dbc: overrides?.uint16(CP.CCSIDDBC),
		});
	}

	static #pair(a, b) {
		const data = Buffer.alloc(4);
		data.writeUInt16BE(a);
		data.writeUInt16BE(b, 2);
		return data;
	}

	// ---- statements ---------------------------------------------------------------------

	/** A free section of the dynamic package, held until released. */
	#takeSection() {
		for (let section = 1; section < 0x7FFF; section++) {
			if (!this.#sections.has(section)) {
				this.#sections.add(section);
				return section;
			}
		}
		throw new DatabaseError('No free statement section', '57011');
	}

	release(section) { this.#sections.delete(section); }

	/** PKGNAMCSN: database, collection, package (each padded to 18), consistency token, section. */
	#package(builder, section) {
		const name = (text) => this.#ccsid.encode(text.padEnd(18));
		const sectionNumber = Buffer.alloc(2);
		sectionNumber.writeUInt16BE(section);
		builder.bytes(CP.PKGNAMCSN, Buffer.concat([name(this.#database), name(this.#dialect.collection), name(this.#dialect.packageName),
			Buffer.from(this.#dialect.consistencyToken, 'latin1'), sectionNumber]));
	}

	/** SQL text as command data: mixed-CCSID string (indicator, 4-byte length, UTF-8), then null single-byte string. */
	static #statementText(sql) {
		return (object) => {
			const text = Buffer.from(sql, 'utf8');
			const header = Buffer.alloc(5);
			header.writeUInt32BE(text.length, 1);
			object.raw(Buffer.concat([header, text, Buffer.from([0xFF])]));
		};
	}

	/**
	 * Prepares a statement and describes its result columns.
	 * @returns {Promise<{section: number, columns: object[]}>}
	 */
	async prepare(sql) {
		const section = this.#takeSection();
		try {
			const reply = await this.#send((r) => r.command(CP.PRPSQLSTT, (b) => {
				this.#package(b, section);
				b.uint8(CP.RTNSQLDA, CP.TRUE);
			}, [[CP.SQLSTT, DrdaConnection.#statementText(sql)]]));
			const sqldard = this.#find(reply, CP.SQLDARD);
			if (!sqldard) throw new DatabaseError('The server returned no statement description', '08S01');
			const { sqlca, columns } = Sqlda.read(new ByteReader(sqldard.data, this.#types));
			if (sqlca?.isError) throw sqlca.toError();
			return { section, columns };
		} catch (error) {
			this.release(section);
			throw error;
		}
	}

	/** Runs a prepared statement that returns no rows; resolves with its SQLCA (row count in rowCount). */
	async execute({ section }, parameters = []) {
		const reply = await this.#send((r) => r.command(CP.EXCSQLSTT, (b) => {
			this.#package(b, section);
			b.uint8(CP.RDBCMTOK, CP.TRUE);
		}, DrdaConnection.#data(parameters)));
		return this.#sqlca(reply);
	}

	/** Command data carrying bind values, if there are any. */
	static #data(parameters) {
		return parameters.length ? [[CP.SQLDTA, (sqldta) => Parameters.write(sqldta, parameters)]] : [];
	}

	/** Opens a query on a prepared statement; read it with the returned DrdaQuery. */
	async openQuery(statement, parameters = []) {
		const reply = await this.#send((r) => r.command(CP.OPNQRY, (b) => {
			this.#package(b, statement.section);
			b.uint32(CP.QRYBLKSZ, 32767);
			b.uint8(CP.QRYCLSIMP, 0x01);
		}, DrdaConnection.#data(parameters)));
		const opnqryrm = this.#find(reply, CP.OPNQRYRM);
		if (!opnqryrm) throw (this.#sqlcaOf(reply)?.toError() ?? new DatabaseError('The query did not open', '24000'));
		const descriptor = new QueryDescriptor(this.#objects(reply, CP.QRYDSC).map((o) => o.data));
		const query = new DrdaQuery(this, statement, opnqryrm.get(CP.QRYINSID)?.data ?? Buffer.alloc(8), new RowDecoder(descriptor, this.#types));
		query.receive(reply);
		return query;
	}

	/** CNTQRY: the next blocks of an open query. */
	async continueQuery(query) {
		return this.#send((r) => r.command(CP.CNTQRY, (b) => {
			this.#package(b, query.section);
			b.uint32(CP.QRYBLKSZ, 32767);
			b.bytes(CP.QRYINSID, query.instance);
		}));
	}

	/** CLSQRY: closes a query the server still has open. */
	async closeQuery(query) {
		await this.#send((r) => r.command(CP.CLSQRY, (b) => {
			this.#package(b, query.section);
			b.bytes(CP.QRYINSID, query.instance);
		}));
	}

	/** Runs SQL that returns no rows without preparing it (EXCSQLIMM). */
	async executeImmediate(sql) {
		const section = this.#takeSection();
		try {
			const reply = await this.#send((r) => r.command(CP.EXCSQLIMM, (b) => {
				this.#package(b, section);
				b.uint8(CP.RDBCMTOK, CP.TRUE);
			}, [[CP.SQLSTT, DrdaConnection.#statementText(sql)]]));
			return this.#sqlca(reply);
		} finally {
			this.release(section);
		}
	}

	async commit() { this.#check(await this.#send((r) => r.command(CP.RDBCMM))); }

	async rollback() { this.#check(await this.#send((r) => r.command(CP.RDBRLLBCK))); }

	/** Ends the connection; DRDA has no log off command, the socket is closed. */
	close() { this.#transport.close(); }

	// ---- replies -----------------------------------------------------------------------------

	async #send(build, { check = true } = {}) {
		const request = new DdmRequest(this.#ccsid, this.#correlation);
		build(request);
		this.#correlation = request.nextCorrelation;
		const reply = await this.#transport.send(request.toBuffer());
		if (check) this.#check(reply);
		return reply;
	}

	#objects(reply, codePoint) { return reply.flatMap((structure) => structure.objects.filter((o) => o.codePoint === codePoint)); }

	#find(reply, codePoint) { return this.#objects(reply, codePoint)[0]; }

	#sqlcaOf(reply) {
		const sqlcard = this.#find(reply, CP.SQLCARD);
		return sqlcard ? Sqlca.read(new ByteReader(sqlcard.data, this.#types)) : null;
	}

	/** The reply's SQLCA, after throwing for an SQL error. */
	#sqlca(reply) {
		const sqlca = this.#sqlcaOf(reply);
		if (sqlca?.isError) throw sqlca.toError();
		return sqlca;
	}

	/** Throws for reply messages with an error severity, preferring the SQLCA's description. */
	#check(reply) {
		for (const structure of reply) {
			if (structure.type !== DSS.RPYDSS) continue;
			for (const object of structure.objects) {
				const failure = FAILURES.get(object.codePoint);
				if (!failure) continue;
				const severity = object.uint16(CP.SVRCOD, SEVERITY.ERROR);
				if (severity < SEVERITY.ERROR) continue;
				const sqlca = this.#sqlcaOf(reply);
				if (sqlca?.isError) throw sqlca.toError();
				const [sqlstate, text] = failure;
				const detail = [[0x114A, 'reason'], [0x000C, 'code point'], [0x113F, 'reason'], [0x1153, 'diagnosis']]
					.map(([codePoint, label]) => { const p = object.get(codePoint); return p ? `${label} 0x${p.data.toString('hex')}` : null; })
					.filter(Boolean).join(', ');
				throw new DatabaseError(`${text} (${CODE_POINT_NAMES[object.codePoint]}, severity ${severity}${detail ? `, ${detail}` : ''})`, sqlstate ?? undefined);
			}
		}
	}

	/** The query blocks, large objects and end of a reply, for DrdaQuery. */
	parts(reply) {
		return {
			blocks: this.#objects(reply, CP.QRYDTA).map((o) => o.data),
			lobs: this.#objects(reply, CP.EXTDTA).map((o) => o.data),
			ended: this.#find(reply, CP.ENDQRYRM) !== undefined,
			sqlca: this.#sqlcaOf(reply),
		};
	}
}

/** The rows of an open query, fetched a block at a time. */
export class DrdaQuery {
	#connection;
	#statement;
	#instance;
	#decoder;
	#rows = [];
	#done = false;
	#closedByServer = false;
	#error = null;

	constructor(connection, statement, instance, decoder) {
		this.#connection = connection;
		this.#statement = statement;
		this.#instance = instance;
		this.#decoder = decoder;
	}

	get section() { return this.#statement.section; }
	get instance() { return this.#instance; }
	get columns() { return this.#statement.columns; }

	/** Takes the rows of a reply (OPNQRY or CNTQRY). */
	receive(reply) {
		const { blocks, lobs, ended, sqlca } = this.#connection.parts(reply);
		for (const block of blocks) {
			const { rows, end } = this.#decoder.decode(block);
			this.#rows.push(...rows);
			if (end) {
				this.#done = true;
				if (end.isError) this.#error = end.toError();
			}
		}
		this.#decoder.attachLobs(lobs);
		if (ended) {
			this.#done = true;
			this.#closedByServer = true;
			if (sqlca?.isError && !this.#error) this.#error = sqlca.toError();
		}
	}

	/** The next row, or null after the last. */
	async next() {
		while (this.#rows.length === 0 && !this.#done) this.receive(await this.#connection.continueQuery(this));
		if (this.#rows.length === 0 && this.#error) throw this.#error;
		return this.#rows.shift() ?? null;
	}

	async close() {
		if (!this.#closedByServer) {
			this.#closedByServer = true;
			try { await this.#connection.closeQuery(this); } catch { /* already closed by the server */ }
		}
		this.#connection.release(this.#statement.section);
	}
}
