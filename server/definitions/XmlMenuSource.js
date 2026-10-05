import { Xslt, XmlParser } from 'xslt-processor';
import { XmlNode } from '../xml/XmlNode.js';
import { DefinitionConverter } from '../xml/DefinitionConverter.js';
import { SqlText } from '../sql/SqlText.js';
import { BindParameter } from '../drivers/BindParameter.js';

/** A problem shown to the user as the branch's error menu. */
export class MenuSourceError extends Error {}

/**
 * Menus made at request time from XML: the result of a branchSQLXML query, or branchXML,
 * turned into a menu by the branchXSL stylesheet (PHP JSONEncodeMenu::encodeMenuSQLXML
 * and encodeMenuXML). The stylesheet writes a menu in the XML form menus had before they
 * were converted to JSON, so the same converter reads it.
 */
export class XmlMenuSource {
	#files;
	#connections;
	#config;
	#messages;

	constructor({ files, connections, config, messages }) {
		this.#files = files;
		this.#connections = connections;
		this.#config = config;
		this.#messages = messages;
	}

	/**
	 * Runs the branch query and returns the XML of the first column of its first row.
	 * ?!name=...? markers become bind parameters taken from the request.
	 */
	async queryXml(sql, predicate, requestValue) {
		const connection = await this.#connections.open();
		if (connection === null) throw new MenuSourceError('No connection found');
		await connection.setAutoCommit(true);
		const readOnly = connection.DBMS.startsWith('DB2') ? ' for read only' : '';
		const query = `${sql}${predicate ? ` where ${predicate}` : ''}${readOnly}`;
		const { sql: text, parameters } = new SqlText(query).extractBindMarkers('', requestValue);
		let rows;
		try {
			rows = await connection.rows(text.text, BindParameter.listFrom(parameters));
		} catch (error) {
			throw new MenuSourceError(`SQL Error, SQLSTATE: ${error.sqlstate} - see log - sql : ${text.text}`, { cause: error });
		}
		const xml = rows[0]?.[0];
		if (xml === undefined || xml === null || xml === '') throw new MenuSourceError('Nil returned');
		return String(xml);
	}

	/** Text of a SQL branch: inline SQL, or a .sql file named by branchSQLXML. */
	sqlOf(source) {
		const lower = source.toLowerCase();
		if (['select ', 'xquery ', 'values(', 'values ', 'with '].some((prefix) => lower.startsWith(prefix)) || source.startsWith('(')) return source;
		const text = this.#files.tryReadText(`${source}.sql`) ?? this.#files.tryReadText(source);
		if (text === null) throw new MenuSourceError(`branchSQLXML "${source}" not found`);
		return text;
	}

	/**
	 * Applies the stylesheet (inline XSL, or a file named without .xsl) to the XML (inline,
	 * or a file) with the connection's details as stylesheet parameters.
	 * @returns the menu XML the stylesheet wrote
	 */
	async transform(xml, stylesheet) {
		const parser = new XmlParser();
		const document = this.#parse(parser, xml.startsWith('<') ? xml : this.#readXml(xml), 'branchSQLXML XML invalid');
		const xsl = this.#parse(parser, stylesheet.startsWith('<') ? stylesheet : this.#readStylesheet(stylesheet), `branchXSL parse error ${stylesheet}`);
		let menu;
		try {
			menu = await new Xslt({ parameters: this.#stylesheetParameters() }).xsltProcess(document, xsl);
		} catch (error) {
			throw new MenuSourceError(`branchXSL XSL transform error: ${error.message}`, { cause: error });
		}
		if (!menu) throw new MenuSourceError(`branchXSL XSL transform ${stylesheet} returned nil on: `);
		return menu;
	}

	#parse(parser, text, problem) {
		try {
			return parser.xmlParse(text);
		} catch (error) {
			throw new MenuSourceError(problem, { cause: error });
		}
	}

	#readXml(name) {
		if (name.startsWith('$')) throw new MenuSourceError(`branchXML internal function ${name} not found`);
		const text = this.#files.tryReadText(`${name}.xml`) ?? this.#files.tryReadText(name);
		if (text === null) throw new MenuSourceError(`XML file not found or XML invalid, xml: "${name}"`);
		return text;
	}

	#readStylesheet(name) {
		const text = this.#files.tryReadText(`${name}.xsl`) ?? this.#files.tryReadText(name);
		if (text === null) throw new MenuSourceError(`branchXSL file ${name}" not found or XSL invalid`);
		return text;
	}

	/** Text fields of the current connection and its server information, by name. */
	#stylesheetParameters() {
		const record = this.#connections.currentRecord() ?? {};
		const fields = { ...record, ...record.dataServerInfo };
		return Object.entries(fields)
			.filter(([key, value]) => key !== 'password' && key !== 'dataServerInfo' && typeof value === 'string' && value !== '')
			.map(([name, value]) => ({ name, value }));
	}

	/** JSON menu definition from menu XML. */
	definition(menuXml) {
		const root = XmlNode.parse(String(menuXml).trim());
		if (!root?.isNamed('menu')) throw new MenuSourceError('branchXSL XSL transform did not produce a menu');
		const converter = new DefinitionConverter({ messages: this.#messages, acceptedOperators: this.#config.get('ACCEPTED_OPERATORS') });
		converter.configNames = this.#config;
		return converter.menu(root);
	}
}
