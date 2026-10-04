import { VersionAttributes } from './VersionAttributes.js';
import { XmlNode } from '../xml/XmlNode.js';

/** Tasks that encode as just their type. */
const BARE_TASKS = new Set(['windowReload', 'blockUpdate', 'break', 'breakCheck', 'return', 'exit', 'lock',
	'lockScreen', 'unlock', 'unlockScreen', 'displayLocalVariables']);
const PARAMETER_TASKS = new Set(['setGlobal', 'assignSharedConstant', 'setLocal', 'assignLocalParameter', 'getConnection']);
const NAMED_TASKS = new Set(['panelReload', 'retry', 'setContext']);
const CHECK_CONDITIONS = { if: false, onMatch: false, ifNot: true, onNonMatch: true };

/**
 * Encodes TE script actions (<action>, <task>, <if> ... XML) into the JSON the
 * front end's script engine runs (PHP JSONEncodeAction). Node names are matched
 * case sensitively where the PHP switch statements did.
 */
export class ActionEncoder {
	#menus;
	#messages;
	#operatorPattern;

	/**
	 * @param {object} options
	 * @param {import('./MenuEncoder.js').MenuEncoder} options.menus for <loadPage> tasks
	 * @param {import('../core/Messages.js').Messages} options.messages
	 * @param {string} options.acceptedOperators PHP regex string from ACCEPTED_OPERATORS
	 */
	constructor({ menus, messages, acceptedOperators = '/[+*\\/\\\\%-]/' }) {
		this.#menus = menus;
		this.#messages = messages;
		this.#operatorPattern = ActionEncoder.#phpRegex(acceptedOperators);
	}

	static #phpRegex(pattern) {
		const match = /^\/(.*)\/([a-z]*)$/s.exec(pattern);
		return match ? new RegExp(match[1], match[2].replace(/[^gimsuy]/g, '')) : new RegExp(pattern);
	}

	fromString(xml) {
		const node = XmlNode.parse(xml);
		return node ? this.fromDOM(node) : null;
	}

	/** Encodes an <action> element; null when it has no content. */
	fromDOM(node) {
		if (!node?.hasChildNodes()) return null;
		const result = ActionEncoder.#dollarAttributes(node);
		VersionAttributes.applyTo(node, result);
		return Object.assign(result, {
			suppressAutomaticErrors: node.getAttribute('suppressAutomaticErrors') === 'true',
			lockScreen: node.getAttribute('lockScreen').toLowerCase() === 'true',
			type: 'action',
			name: node.getAttribute('name'),
			actionType: node.getAttribute('type'),
			message: node.getChildTextContent('message'),
			parameterList: this.encodeParameterList(node),
			schema: node.getChildTextContent('schema'),
			tasks: this.encodeFollowOnAction(node),
		});
	}

	/** Every attribute as "$name": value, so scripts can reach arbitrary attributes. */
	static #dollarAttributes(node) {
		return Object.fromEntries(Object.entries(node.attributes).map(([name, value]) => [`$${name}`, value]));
	}

	encodeParameterList(node) {
		return node.childNodes
			.filter((child) => child.isNamed('parameterList'))
			.flatMap((list) => list.childNodes.filter((p) => p.isNamed('parameter')).map((p) => this.encodeParameterNode(p)));
	}

	encodeParameters(node) {
		return node.childNodes.filter((p) => p.isNamed('parameter')).map((p) => this.encodeParameterNode(p));
	}

	encodeFollowOnAction(node) {
		const tasks = [];
		for (const child of node.childNodes) {
			if (child.isNamed('followOnAction') || child.isNamed('if') || child.isNamed('ifNot'))
				tasks.push(this.encodeFollowOnActionNode(child));
			if (child.isNamed('task'))
				tasks.push({ type: 'task', taskList: this.encodeTask(child) });
			if (child.isNamed('declareActions')) {
				const taskList = this.encodeTask(child);
				taskList.tasks.unshift({ type: 'break' });
				tasks.push({ type: 'task', taskList });
			}
		}
		return tasks;
	}

	encodeFollowOnActionNode(node) {
		const compareType = node.getAttribute('conditionCompairType') || node.getAttribute('conditionCompareType') || node.getAttribute('op');
		return {
			type: 'IF',
			name: node.getAttribute('name'),
			originalAction: node.nodeName,
			negCondition: node.getAttribute('negCondition').toLowerCase() === 'true' || node.isNamed('ifNot'),
			compareOn: node.getAttribute('compareOn'),
			compareOnType: node.getAttribute('compareOnType'),
			condition: node.getAttribute('condition'),
			conditionType: node.getAttribute('conditionType'),
			conditionCompareType: compareType,
			taskList: this.encodeTaskList(node),
		};
	}

	encodeParameterNode(node) {
		if (!node) return null;
		return Object.assign(ActionEncoder.#dollarAttributes(node), {
			type: node.nodeName,
			name: node.getAttribute('name'),
			parameterType: node.getAttribute('type'),
			title: node.getAttribute('title'),
			transform: node.getAttribute('transform'),
			value: node.getChildTextContent('value'),
			defaultValue: node.getChildTextContent('defaultValue'),
			check: this.encodeCheckNode(node.findChildNode('check')),
			xpathBaseNode: node.getAttribute('xpathBaseNode'),
			xpathName: node.getAttribute('xpathName'),
			xpathValue: node.getAttribute('xpathValue'),
		});
	}

	encodeCheckNode(node) {
		if (!node) return null;
		return node.childNodes
			.filter((child) => Object.hasOwn(CHECK_CONDITIONS, child.nodeName))
			.map((child) => Object.assign(VersionAttributes.encode(child), {
				originalAction: child.nodeName,
				type: 'IF',
				negCondition: CHECK_CONDITIONS[child.nodeName],
				condition: child.getAttribute('condition'),
				conditionType: child.getAttribute('conditionType'),
				conditionCompareType: child.getAttribute('conditionCompairType') || child.getAttribute('conditionCompareType'),
				taskList: this.encodeTaskList(child),
			}));
	}

	encodeMath(node) {
		const operator = node.getAttribute('operator');
		if (!this.#operatorPattern.test(operator))
			return { type: 'alert', message: this.#messages.format('INVALID_PARAMETER', { NODE: '', PARAMETER_NAME: operator }) };
		const parameters = [];
		for (const child of node.childNodes) {
			if (child.nodeName === 'parameter') parameters.push(this.encodeParameterNode(child));
			else if (child.nodeName === 'set') parameters.push(this.encodeMath(child));
		}
		return { type: node.nodeName, operator, expression_id: node.getAttribute('expression_id'), parameters };
	}

	encodeTaskList(node) {
		return node.childNodes.filter((child) => child.isNamed('task')).map((child) => this.encodeTask(child));
	}

	encodeTask(node) {
		const repeat = node.getAttribute('repeat');
		const taskList = { type: 'taskList', repeat: repeat === '' ? 1 : repeat, tasks: [] };
		VersionAttributes.applyTo(node, taskList);
		for (const taskNode of node.childNodes) taskList.tasks.push(...this.#encodeTaskEntry(taskNode));
		return taskList;
	}

	/** One task element; `for` expands to three entries, hence the array. */
	#encodeTaskEntry(task) {
		const type = task.nodeName;
		const attr = (name) => task.getAttribute(name);
		const attrOrDefault = (name, fallback = null) => task.getAttribute(name) || fallback;
		if (BARE_TASKS.has(type)) return [{ type }];
		if (PARAMETER_TASKS.has(type)) return [this.encodeParameterNode(task)];
		if (NAMED_TASKS.has(type)) return [{ type, name: attr('name') }];
		switch (type) {
			case 'for':
				return [{ type: 'forbegin', iterate: attr('iterate'), source: attr('source') },
					{ type, taskList: this.encodeTaskList(task) },
					{ type: 'forend' }];
			case 'if': case 'ifNot': case 'followOnAction':
				return [this.encodeFollowOnActionNode(task)];
			case 'alert': case 'alertandlog':
				return [{ type, message: task.textContent.trim() }];
			case 'sendConsole': case 'sendconsole': case 'echo':
				return [{ type: 'sendconsole', message: task.textContent.trim() }];
			case 'math':
				return [this.encodeMath(task)];
			case 'newWindow':
				return [{ ...this.encodeParameterNode(task), dataType: attrOrDefault('dataType'), fileName: attrOrDefault('fileName'),
					disposition: attrOrDefault('disposition'), base64: attrOrDefault('base64', 'false'), headerOptions: attrOrDefault('headerOptions', '') }];
			case 'action':
				return [this.fromDOM(task)];
			case 'loadPage':
				return [{ type: 'loadPage', links: this.#menus.retrieveLinksFromDOM(task), pageLayouts: this.#menus.encodePageWindowsFromDOM(task) }];
			case 'setActionReturn':
				return [{ type: 'setActionReturn', value: attr('value'), parameterType: task.getAttribute('type', 'fixed') }];
			case 'breakIf': case 'breakControlGroup':
				return [{ type: 'breakControlGroup' }];
			case 'callAction': case 'gotoAction':
				return [{ type: 'callAction', name: attr('name') }];
			case 'callGlobalAction':
				return [{ type, name: attr('name'), parameter: this.encodeParameters(task) }];
			case 'exitAction':
				return [{ type, to: attr('to') }];
			case 'openContextMenu':
				return [{ type: 'openContextMenu', baseDir: attr('baseDir') }];
			case 'runJavaScript':
				return [{ type, value: attr('value') }];
			case 'wait': case 'pause':
				return [{ type: 'wait', seconds: attr('seconds') }];
			case 'parallel':
				return [{ type, tasks: task.childNodes.filter((c) => c.nodeName === 'task').map((c) => ({ type: 'task', taskList: this.encodeTask(c) })) }];
			default:
				return [{ type: 'unknownTask', nodeName: type }];
		}
	}
}
