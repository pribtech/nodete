var commandRunner = {
	COMMAND_SET:{},
	
	runCommand: function(event, commandName, ask, parameters) {
		var commandText = null;
		if(ACTIVE_DATABASE_CONNECTION_OBJECT != null)
			if(commandRunner.COMMAND_SET[ACTIVE_DATABASE_CONNECTION_OBJECT.dataServerInfo.dataServerName] != null)
				commandText = commandRunner.COMMAND_SET[ACTIVE_DATABASE_CONNECTION_OBJECT.dataServerInfo.dataServerName][commandName];
		if(commandText == null)
			if(commandRunner.COMMAND_SET["default"] != null)
				commandText = commandRunner.COMMAND_SET["default"][commandName];
		
		if(commandText == null)
			openModalAlert("<b>Command not found!</b>");
		else
			this.runRawCommand(event, encodeMessage(commandText, parameters), ask);
	},
	
	runRawCommand: function(event, command, ask) {

		ask = ask == null ? true : ask;
		if(event.ctrlKey)
			ask = "true";
		if(IS_TOUCH_SYSTEM && event.touches && event.touches.length > 0)
			ask = "true";
			
		
		if(ask)
			command = prompt("Run command on server:", command);

		if(command == null) return;
		
		var sqlCount = 0;
		
		var POSTDATA = new Object();
		POSTDATA.action 			= "sshCommand";
		POSTDATA.returntype 		= 'JSON';
		POSTDATA.command 			= command;
		POSTDATA.USE_CONNECTION 	= ACTIVE_DATABASE_CONNECTION;

		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
					},
					'onComplete' : function() {
					},
					'onSuccess': function(transport) {
						openModalAlert("<div style='width:500px'><pre><code>" + transport.responseJSON.returnValue.outputs[0] + "</code></pre></div>");
					},
					'onException': function(transport) {},
					'onFailure': function(transport) {}
			});
	},
	
	runCommandOnHost: function(event, commandName, hostID, ask, parameters) {
		var commandText = null;
		if(ACTIVE_DATABASE_CONNECTION_OBJECT != null)
			if(commandRunner.COMMAND_SET[ACTIVE_DATABASE_CONNECTION_OBJECT.dataServerInfo.dataServerName] != null)
				commandText = commandRunner.COMMAND_SET[ACTIVE_DATABASE_CONNECTION_OBJECT.dataServerInfo.dataServerName][commandName];
		if(commandText == null)
			if(commandRunner.COMMAND_SET["default"] != null)
				commandText = commandRunner.COMMAND_SET["default"][commandName];
	
		if(parameters != null)
		{
			if(Object.isHash(parameters))
			{
				parameters.set("HOSTNAME", hostID);
			}
			else
				parameters["HOSTNAME"] = hostID;
		}
		else
			parameters = { "HOSTNAME" : hostID };
				
				
		if(commandText == null)
			openModalAlert("<b>Command not found!</b>");
		else
			this.runRawCommandOnHost(event, encodeMessage(commandText, parameters), hostID, ask);
	},
	
	runRawCommandOnHost: function(event, command, hostID, ask) {

		ask = ask == null ? true : ask;
		if(event.ctrlKey)
			ask = "true";
		if(IS_TOUCH_SYSTEM && event.touches && event.touches.length > 0)
			ask = "true";
			
		if(ask)
			command = prompt("Run command on server:", command);

		if(command == null) return;
		
		var sqlCount = 0;
		
		var POSTDATA = new Object();
		POSTDATA.action 		= "sshCommandOnSystem";
		POSTDATA.returntype 		= 'JSON';
		POSTDATA.command 		= command;
		POSTDATA.system 		= hostID;
		POSTDATA.USE_CONNECTION 	= ACTIVE_DATABASE_CONNECTION;

		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
					},
					'onComplete' : function() {
					},
					'onSuccess': function(transport) {
						openModalAlert("<div style='width:500px'><pre><code>" + transport.responseJSON.returnValue.outputs[0] + "</code></pre></div>");
					},
					'onException': function(transport) {},
					'onFailure': function(transport) {}
			});
	}
}