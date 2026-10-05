import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const ELEMENT_NODE = 1;

/** PHP stripslashes(): drops one level of backslash escaping. */

/**
 * Simplified, read-only XML element tree used to read the TE's XML definitions
 * (menus, layouts, scripts). Mirrors the PHP XMLNode class:
 *  - childNodes holds element children only (text, comments are skipped)
 *  - textContent is the text of the element and all its descendants
 *  - attribute values have PHP stripslashes() applied, as the PHP loader did
 */
export class XmlNode {
	/** PHP stripslashes(): removes backslash escapes, "\\0" becomes NUL. */
	static #stripSlashes(value) { return value.replace(/\\(.?)/gs, (_, char) => (char === '0' ? '\0' : char)); }

	#nodeName;
	#textContent;
	#attributes;
	#childNodes;
	#element;

	constructor(element) {
		this.#element = element;
		this.#nodeName = element.nodeName;
		this.#textContent = element.textContent ?? '';
		this.#attributes = new Map();
		for (const attribute of Array.from(element.attributes ?? []))
			this.#attributes.set(attribute.name, XmlNode.#stripSlashes(attribute.value));
		this.#childNodes = Array.from(element.childNodes ?? [])
			.filter((node) => node.nodeType === ELEMENT_NODE)
			.map((node) => new XmlNode(node));
		Object.freeze(this.#childNodes);
	}

	/** Root element of an XML document, or null when the text is empty or not well formed. */
	static parse(xml) {
		if (typeof xml !== 'string' || xml.trim() === '') return null;
		try {
			const document = new DOMParser({ onError: (level, message) => { if (level !== 'warning') throw new Error(message); } })
				.parseFromString(xml, 'text/xml');
			const root = document?.documentElement;
			return root ? new XmlNode(root) : null;
		} catch {
			return null;
		}
	}

	get nodeName() { return this.#nodeName; }
	get textContent() { return this.#textContent; }
	get childNodes() { return this.#childNodes; }
	get attributes() { return Object.fromEntries(this.#attributes); }

	hasChildNodes() { return this.#childNodes.length > 0; }
	hasAttributes() { return this.#attributes.size > 0; }
	hasAttribute(name) { return this.#attributes.has(name); }

	/** Attribute value, or defaultValue when absent (PHP default is ""). */
	getAttribute(name, defaultValue = '') {
		return this.#attributes.has(name) ? this.#attributes.get(name) : defaultValue;
	}

	/** First direct child with this name, ignoring case. */
	findChildNode(name) {
		const wanted = name.toLowerCase();
		return this.#childNodes.find((child) => child.nodeName.toLowerCase() === wanted) ?? null;
	}

	/** Trimmed text of the first direct child with this name (ignoring case), or defaultValue. */
	getChildTextContent(name, defaultValue = '') {
		const child = this.findChildNode(name);
		return child ? child.textContent.trim() : defaultValue;
	}

	/** Direct children with exactly this name (PHP XMLNode semantics: not a deep search). */
	getElementsByTagName(name) {
		return this.#childNodes.filter((child) => child.nodeName === name);
	}

	isNamed(name) { return this.#nodeName.toLowerCase() === name.toLowerCase(); }

	toXML() { return new XMLSerializer().serializeToString(this.#element); }

	/**
	 * Generic element-to-object encoding (PHP XMLNode::arrayEncodeXML):
	 * leaves become {"@text": value} ("true"/"false" become booleans), attributes go
	 * under "@attributes", repeated child names become arrays.
	 */
	arrayEncodeXML(maskText = true) {
		if (this.#childNodes.length === 0 && this.#attributes.size === 0) {
			let value = this.#textContent.trim();
			if (value.toLowerCase() === 'true') value = true;
			else if (value.toLowerCase() === 'false') value = false;
			return maskText ? { '@text': value } : value;
		}
		const result = {};
		if (this.#attributes.size > 0) result['@attributes'] = this.attributes;
		if (this.#childNodes.length === 0) {
			result['@text'] = this.#textContent.trim();
			return result;
		}
		for (const child of this.#childNodes) {
			const name = child.nodeName;
			if (!Object.hasOwn(result, name)) result[name] = child.arrayEncodeXML(maskText);
			else if (Array.isArray(result[name])) result[name].push(child.arrayEncodeXML(maskText));
			else result[name] = [result[name], child.arrayEncodeXML()];
		}
		return result;
	}
}
