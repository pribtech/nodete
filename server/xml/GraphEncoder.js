import { PhpCompat } from '../util/PhpCompat.js';

/** Chart definition inside a link parameter (PHP JSONEncodeMenuGraph::encodeGraph). */
export class GraphEncoder {
	static #isNumeric(value) { return value !== '' && value !== null && !Number.isNaN(Number(value)); }

	static encode(root) {
		if (!root?.hasChildNodes()) return null;
		const graph = {};
		for (const child of root.childNodes) {
			const text = () => child.textContent.trim();
			switch (child.nodeName.toLowerCase()) {
				case 'title': graph.title = text(); break;
				case 'graphtype': graph.graphType = text(); break;
				case 'xfield': graph.xField = text(); break;
				case 'yfield': graph.yField = text(); break;
				case 'datafield': graph.dataField = text(); break;
				case 'categoryfield': graph.categoryField = text(); break;
				case 'responseschema':
					graph.responseSchema = { Fields: child.childNodes.map((field) => field.textContent.trim()) };
					break;
				case 'style': graph.style = GraphEncoder.#style(child, graph.style); break;
				case 'seriesdefinitions': graph.seriesDef = child.childNodes.map(GraphEncoder.#series); break;
				case 'datasets': graph.datasets = GraphEncoder.#datasets(child); break;
				default: break;
			}
		}
		return PhpCompat.assoc(graph);
	}

	static #style(node, existing = {}) {
		const style = { ...existing };
		for (const entry of node.childNodes) {
			if (entry.hasChildNodes()) {
				style[entry.nodeName] = { ...(style[entry.nodeName] ?? {}) };
				for (const sub of entry.childNodes) style[entry.nodeName][sub.nodeName] = sub.textContent.trim();
			} else style[entry.nodeName] = entry.textContent.trim();
		}
		return style;
	}

	static #series(series) {
		const definition = {};
		for (const detail of series.childNodes) {
			if (detail.isNamed('style'))
				definition.style = PhpCompat.assoc(Object.fromEntries(detail.childNodes.map((s) => [s.nodeName, s.textContent.trim()])));
			else definition[detail.nodeName] = detail.textContent.trim();
		}
		return PhpCompat.assoc(definition);
	}

	/** Each dataset row carries over earlier rows' fields, as the PHP loop's reused array did. */
	static #datasets(node) {
		const row = {};
		return node.childNodes.map((dataset) => {
			for (const data of dataset.childNodes) {
				const value = data.getAttribute('value');
				row[data.getAttribute('field')] = GraphEncoder.#isNumeric(value) ? PhpCompat.intval(value) : data.getAttribute('value', 0);
			}
			return PhpCompat.assoc({ ...row });
		});
	}
}
