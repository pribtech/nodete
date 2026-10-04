/**
 * Writes action results in the formats the front end expects from the PHP version.
 * The return type (JSON or HTML) is fixed per request, as PHP fixed it in a constant.
 */
export class ActionResponse {
	#res;
	#returnType;
	#messages;
	#sent = false;

	constructor(res, returnType, messages) {
		this.#res = res;
		this.#returnType = returnType;
		this.#messages = messages;
	}

	get sent() { return this.#sent; }
	get isJSON() { return this.#returnType === 'JSON'; }

	#write(body, contentType) {
		if (this.#sent) throw new Error('Response already sent');
		this.#sent = true;
		this.#res.set('Cache-Control', 'private');
		this.#res.type(contentType).send(body);
	}

	/** Body in the request's return type, with the matching content type. */
	send(body) {
		this.#write(body, this.isJSON ? 'application/json; charset=UTF-8' : 'text/html; charset=UTF-8');
	}

	sendJSON(value) { this.#write(JSON.stringify(value), 'application/json; charset=UTF-8'); }
	sendHTML(html) { this.#write(html, 'text/html; charset=UTF-8'); }
	sendScript(js) { this.#write(js, 'application/javascript; charset=UTF-8'); }

	/** The panel heading the PHP my_header() printed before HTML action content. */
	static header(title, description = '') {
		return `\t\t\t\t<div id="title">${title.trim()}</div><div id='panelInformation'>${description}</div>`;
	}

	static centredMessage(text) {
		return `<table style='width:100%;height:100%'><tr><td align='center'>${text}</td></tr></table>`;
	}

	/** PHP sendErrorMessage(): flagGeneralError JSON, or the bare message for HTML. */
	sendError(error) {
		const message = error instanceof Error ? error.message : String(error);
		if (this.isJSON)
			this.sendJSON({ flagGeneralError: true, connectionError: false, returnCode: 'false', returnValue: message });
		else
			this.sendHTML(message);
	}

	/** PHP NoConnectionMessageJSON() / NoConnectionMessageHTML(). */
	sendNotConnected() {
		const message = this.#messages.get('NOT_CONNECTED_MESSAGE');
		if (this.isJSON)
			this.sendJSON({ flagGeneralError: false, connectionError: false, returnCode: 'false', returnValue: message, returnMessage: message });
		else
			this.sendHTML(ActionResponse.header(this.#messages.get('TE_NOT_CONNECTED'))
				+ ActionResponse.centredMessage(message)
				+ "<script type='text/javascript'>initiateConnectionRefresh();</script>");
	}

	/** HTML "action not found" page (JSON requests get sendError instead). */
	sendActionNotFoundHTML(text) {
		this.sendHTML(ActionResponse.header(this.#messages.get('ACTION_NOT_FOUND')) + '\n' + ActionResponse.centredMessage(text));
	}
}
