// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { PhpCompat } from '../util/PhpCompat.js';

const NO_CONTENT_PANEL = "<div id='title'>No content given!</div><table style='width:100%;height:100%'><tr><td align='center'><h2>No content was specified for the panel</h2></td></tr></table>'";
const DIRECTIVES = new Set(['$var', '$config', '$link', '$pageWindow']);

/**
 * Builds links and page layouts from their JSON definitions into the form the front
 * end renders. Fills in what depends on the request: default target/window/stage for
 * links, generated panel names, and $-directives in link parameters:
 *   {"$var": "CURRENT_MENU_LOCATION", "default": "..."}   value known only while loading a menu
 *   {"$config": "NAME"}                                    a server setting
 *   {"$link": {...}} / {"$pageWindow": {...}}              a nested link or layout
 * Any other parameter value is passed through unchanged.
 */
export class PageBuilder {
	defaultTarget = '_self';
	defaultWindow = '_self';
	defaultStage = null;

	#config;
	#buildMenu;
	#variables = new Map();

	/** @param {(definition: object) => object} buildMenu builds a layout's leftMenu */
	constructor({ config, buildMenu }) {
		this.#config = config;
		this.#buildMenu = buildMenu;
	}

	setVariable(name, value) { this.#variables.set(name, value); }

	// ---- links -----------------------------------------------------------------

	link(definition) {
		if (!definition) return null;
		const type = definition.type ?? '';
		const upper = type.toUpperCase() || 'LINK';
		return {
			target: definition.target ?? this.defaultTarget,
			window: definition.window ?? this.defaultWindow,
			windowStage: definition.windowStage ?? this.defaultStage,
			formList: definition.forms ?? [],
			type: upper,
			data: this.#linkData(definition, type, upper),
		};
	}

	#linkData(definition, type, upper) {
		if (upper === 'RAW') return definition.raw ?? '';
		if (upper === 'URL') return definition.url ?? '';
		if (Object.hasOwn(definition, 'text')) return definition.text;
		const parameters = {};
		for (const [name, value] of Object.entries(definition.parameters ?? {})) parameters[name] = this.parameterValue(value);
		return {
			baseDirectory: type === 'html' ? this.#config.get('HTML_BASE_DIRECTORY') : null,
			address: definition.address ?? null,
			parameters: PhpCompat.assoc(parameters),
		};
	}

	static #directive(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
		return Object.keys(value).find((key) => DIRECTIVES.has(key)) ?? null;
	}

	parameterValue(value) {
		switch (PageBuilder.#directive(value)) {
			case '$var':
				if (this.#variables.has(value.$var)) return this.#variables.get(value.$var);
				return this.#config.has(value.$var) ? this.#config.get(value.$var) : (value.default ?? '');
			case '$config': return this.#config.get(value.$config);
			case '$link': return this.link(value.$link);
			case '$pageWindow': return this.pageWindow(value.$pageWindow);
			default: return value;
		}
	}

	// ---- layouts ---------------------------------------------------------------

	pageWindow(definition) {
		if (!definition) return null;
		const panelHeaders = this.panelHeaders(definition.panelHeaders);
		return {
			reloadOnConnectionChange: definition.reloadOnConnectionChange === true,
			target: definition.target ?? '',
			title: definition.title ?? '',
			info: definition.info ?? '',
			leftMenu: definition.leftMenu ? this.#buildMenu(definition.leftMenu) : null,
			raiseToTop: definition.raiseToTop ?? true,
			windowStage: definition.windowStage ?? this.defaultStage,
			windowType: definition.windowType ?? 'NORMAL',
			windowOptionType: definition.windowOptionType ?? '',
			panelHeaders,
			content: this.container(definition.content ?? null, panelHeaders),
		};
	}

	panelHeaders(definition) {
		if (!definition) return null;
		const auto = definition.autoRefreshControls;
		return {
			scope: definition.scope ?? '',
			refreshEnabled: definition.refreshEnabled ?? true,
			refreshOptions: definition.refreshOptions ?? '',
			autoRefreshControls: auto ? {
				time: auto.time ?? -1,
				timeVisible: auto.timeVisible ?? true,
				timeOptions: Object.hasOwn(auto, 'timeOptions') ? auto.timeOptions : true,
				countdownVisible: auto.countdownVisible ?? false,
			} : null,
			showRefreshControl: definition.showRefreshControl ?? true,
		};
	}

	/** {link}|{raw}|{url} panel content -> ContentType and data. */
	panelContent(content) {
		if (content?.link) return { ContentType: 'LINK', data: this.link(content.link) };
		if (content && Object.hasOwn(content, 'url')) return { ContentType: 'URL', data: content.url };
		return { ContentType: 'RAW', data: content?.raw ?? '' };
	}

	floatingPanel(definition) {
		if (!definition) return null;
		return {
			...this.panelContent(definition.content),
			hideMenuBar: definition.hideMenuBar === true,
			reloadOnConnectionChange: definition.reloadOnConnectionChange === true,
			panelHeaders: this.panelHeaders(definition.panelHeaders),
			baseWidth: definition.baseWidth ?? null,
			baseHeight: definition.baseHeight ?? null,
			loadContentOnShow: definition.loadContentOnShow === true,
			reloadContentOnShow: definition.reloadContentOnShow === true,
		};
	}

	container(definition, parentPanelHeaders) {
		switch (definition?.type) {
			case 'panel': return this.#panel(definition, parentPanelHeaders);
			case 'splitPane': return this.#splitPane(definition, parentPanelHeaders);
			case 'stage': return this.#stage(definition);
			default: return null;
		}
	}

	#panel(definition, parentPanelHeaders) {
		const content = definition.content ? this.panelContent(definition.content) : { ContentType: null, data: null };
		return {
			type: 'panel',
			name: definition.name ?? PhpCompat.uniqid(),
			...content,
			reloadOnConnectionChange: definition.reloadOnConnectionChange === true,
			panelHeaders: this.panelHeaders(definition.panelHeaders) ?? parentPanelHeaders,
			overflow: definition.overflow ?? 'auto',
			delayLoad: definition.delayLoad === true,
			panelTitle: definition.panelTitle ?? null,
			PrimaryContainer: definition.primaryContainer === true,
		};
	}

	#splitPane(definition, parentPanelHeaders) {
		const pane = (key) => (Object.hasOwn(definition, key)
			? this.container(definition[key], parentPanelHeaders)
			: { type: 'panel', name: PhpCompat.uniqid(), ContentType: 'RAW', data: NO_CONTENT_PANEL });
		const result = {
			type: 'splitPane',
			panelA: pane('panelA'),
			panelB: pane('panelB'),
			direction: definition.direction ?? 'h',
			splitPercent: definition.splitPercent ?? null,
			allowResize: definition.allowResize ?? true,
			maxSize: definition.maxSize ?? null,
		};
		if (Object.hasOwn(definition, 'showSplitSpacer')) {
			result.showSplitSpacer = definition.showSplitSpacer;
			result.splitSpacerWidth = definition.splitSpacerWidth;
		}
		result.styleOverride = definition.styleOverride ?? '';
		return result;
	}

	#stage(definition) {
		const text = (name) => definition[name] ?? '';
		const number = (name) => definition[name] ?? 0;
		return {
			type: 'stage', name: text('name'), HasMenuBarContainer: text('HasMenuBarContainer'),
			top: number('top'), botton: number('botton'), left: number('left'), right: number('right'),
			titleBarType: text('titleBarType'), windowOptionType: text('windowOptionType'),
			windowControlTypes: text('windowControlTypes'), sizable: text('sizable'),
		};
	}
}
