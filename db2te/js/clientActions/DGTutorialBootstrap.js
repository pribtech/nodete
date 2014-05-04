/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 *Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
 *You may obtain a copy of the License at
 *
 *	http://www.apache.org/licenses/LICENSE-2.0
 *
 *Unless required by applicable law or agreed to in writing, software
 *distributed under the License is distributed on an "AS IS" BASIS,
 *WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *See the License for the specific language governing permissions and
 *limitations under the License.
 *********************************************************************************/
CORE_CLIENT_ACTIONS.set("DGTutorialBootstrap",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		
		GLOBAL_CONSTANTS.set('ACTIVE_DATABASE_CONNECTION', getActiveDatabaseConnection());
		
		$super(callParameters.uniqueID + "_" + getGUID(), "connectionManager");
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		this.loadGenerator = callParameters.generator;	// <parameter name="generator">dgTest</parameter>
		this.connection = callParameters.connection;	// <parameter name="connection">active</parameter>

		this.compactView = callParameters.compactView;
		this.microView = callParameters.microView;
		
		this.baseParameters = $H();
		this.dgHostname = "";
		this.dgPortnumber = "defaultPortNumber";
		
		var hashedCallParameters = $H(callParameters);
		var thisObject = this;
		hashedCallParameters.each(function(pair) {
			if(pair.key.indexOf('parameters[') == 0)
				thisObject.baseParameters.set(pair.key, pair.value);
		});
		
		this.callingTutorial = null;
		if(callParameters.controlerType != null && callParameters.controlerID != null)
		{
			this.callingTutorial = GET_GLOBAL_OBJECT(callParameters.controlerType, callParameters.controlerID);
		}
		//Error
		if(this.callingTutorial == null)
		{
			this.setErrorFormatted("Could not find calling tutorial");
			return;	
		}

		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).registerNestedObject(this.elementUniqueID, this);
		this.loading();
		this.connectionDataTable = null;
		this.currentSelectedConnectionRow = null;
		this.currentlyUpdatingConnection = false;
		if(this.callingTutorial.DGConfig.generatorSystem == null && this.callingTutorial.DGConfig.generatorUser == null)
		{
			this.GetDGServer();
		}
		else
		{
			this.isGeneratorLoaded();
		}
	},
	
	GetDGServer: function() {
		
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGSystemList",
			"returntype" : 'JSON'	
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'asynchronous' : false,
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						thisObject.DGSystemList = result.returnValue;
						if(thisObject.DGSystemList != null)
						{
							var output = "Select the DG server to run the data generator";
							 
							var length = thisObject.DGSystemList.length;
							var i = 0;
							
							if(length == 0) {
								
								output = "<h1>There are currently no data generator systems configured.</h1>";
								
								output = "<table style='width:100%;height:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" + output + "</td></tr></table>";
								getPanel(thisObject.parentStageID, thisObject.parentWindowID, thisObject.parentPanelID ).setContent(output, "Error Loading Page");
							}
							else if(length == 1) {
								thisObject.setActiveDGSystem(0);
							} else if(length > 1)
							{
								for(i=0; i<length; i++)
								{
									output += "<br/><button onclick='" + thisObject.callBackText + ".setActiveDGSystem(this.value)' value='" + i + "'>" + thisObject.systemList[i][0] + "</option>";
								}

								output = "<h1>Select DG system</h1><table style='width:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" + output + "</td></tr></table>";
								getPanel(thisObject.parentStageID, thisObject.parentWindowID, thisObject.parentPanelID ).setContent(output, '');
							}
							
						}
				}
		});
	},
	
	setActiveDGSystem: function(index) {
		if(this.DGSystemList == null) return null;
		if(this.DGSystemList [index] == null) return null;
		this.callingTutorial.DGConfig.generatorSystem = this.DGSystemList[index][0];
		this.callingTutorial.DGConfig.generatorUser = this.DGSystemList[index][1];
		this.loading();
		this.isGeneratorLoaded();
	},
	
	setErrorFormatted: function(message,detail) {
		var msgId=message.split(" ",1)[0];
		if(msgId.substr(0,1)=="[") { 
			msgId=message.split("] ",2)[1].split(" ",1)[0];
		}
		if (this.baseTableData.localTableDeffinition.messages[msgId]!=undefined) {
			message=this.baseTableData.localTableDeffinition.messages[msgId];
		} else {
			if (CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES[msgId]!=undefined)
				message=CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES[msgId];
		}
		this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>" + message + "</h2>"+(detail==null?"":detail)+"</td></tr></table>");
	},
	
	setError: function(message) {
		var contentArea = $(this.elementUniqueID + "_displayArea");
		var errorArea = $(this.elementUniqueID + "_errorDisplayArea");
		if(contentArea != null)
			contentArea.hide();
		if(errorArea != null)
		{
			this.errorIsShowen = true;
			errorArea.show();
			errorArea.update(message);
		}
	},
	
	clearError: function() {
		var contentArea = $(this.elementUniqueID + "_displayArea");
		var errorArea = $(this.elementUniqueID + "_errorDisplayArea");
		if(contentArea != null)
			contentArea.show();
		if(errorArea != null)
		{
			this.errorIsShowen = false;
			errorArea.hide();
			errorArea.update("");
		}
	},
	
	isGeneratorLoaded: function() {

		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.callingTutorial.DGConfig.generatorSystem,
			"DGMethod" : "GET",
			"DGAction" : "generator/" + this.callingTutorial.tutorialSchema + "_" + this.loadGenerator + "@" + this.callingTutorial.DGConfig.generatorUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							alert(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.INVALID_JSON);
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
						{
							initiateConnectionRefresh();
						}
						if(result.returnCode == "false")
						{
							thisObject.loadfiles();
						}
						else
						{
							if(result.returnValue['status']['@text'] == "stopped")
							{
								thisObject.selectConnection(result.returnValue['connection']['@attributes']['file']);
							}
							else
							{
								thisObject.loadDGSingleGeneratorControler();
							}
						}
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
		
	},
	
	loadfiles: function() {
		
		var thisObject = this;
		var runError = false;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.callingTutorial.DGConfig.generatorSystem,
			"DGMethod" : "PUT",
			"DGAction" : "generator/" + this.callingTutorial.tutorialSchema + "_" + this.loadGenerator + "@" + this.callingTutorial.DGConfig.generatorUser,
			"appXML" : this.callingTutorial.Script.contentFolder + this.callingTutorial.DGConfig['load']['generator'][this.loadGenerator]['config'],
			"dgXML" : this.callingTutorial.Script.contentFolder + this.callingTutorial.DGConfig['load']['generator'][this.loadGenerator]['schema']
		};
		
		this.baseParameters.each(function(pair) {
				parameters[pair.key] = pair.value;
		});
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'asynchronous': false, 
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							alert(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.INVALID_JSON);
							runError = true;
						}
						else if(result.flagGeneralError == true && result.connectionError == true)
						{
							initiateConnectionRefresh();
							runError = true;
						}
						else if(result.returnCode == "false" || result.returnCode == false)
						{
							alert(encodeMessage(CORE_MESSAGE_STORE.DG_MESSAGES.ERROR_LOADING_GENERATOR, { GENERATOR_NAME:thisObject.loadGenerator}));
							runError = true;
						}
				}
		});	
		
		if(runError == true){
			this.setErrorFormatted("Could not load generator");
			return;	
		}
//		this.loadDGSingleGeneratorControler();

		this.selectConnection();
	},
	
	selectConnection: function(currentConnection) {
		this.currentConnection = currentConnection;
		if(this.connection == null || this.connection == "")
			this.connection = "presetConnection";
		if(getActiveDatabaseConnection() == "" || getActiveDatabaseConnection() == null)
		{
			this.draw();
			return;
		}
		switch(this.connection.toLowerCase())
		{
			case 'select':
				this.draw();
				break;
			case 'active':
			case 'current':
				this.loadConnection(getActiveDatabaseConnection());
				break;
			case 'ignore':
				this.loadDGSingleGeneratorControler();
				break;
			case 'presetconnection':
				if(currentConnection == null)
					this.draw();
				else
					this.loadDGSingleGeneratorControler();
				break;
		}
	},
	
	setConnection: function(index) {
		this.loading();
		this.loadConnection(CONNECTION_MANAGER_CONNECTION_LIST[this.currentSelectedConnectionRow]['description']);
	},
	
	empty: function() {
		this.loadDGSingleGeneratorControler();
		return;
	},
	
	loadConnection: function(connectionDiscription) {
		if (isCatalogConnection(connectionDiscription))
		{
			this.dgHostname = getConnectionHostname(connectionDiscription);
			this.dgPortnumber = getConnectionPortNumber(connectionDiscription);

			var tempParamObject = $H();
			tempParamObject.set('INPUT_USE_CONNECTION', getActiveDatabaseConnection());
			tempParamObject.set('INPUT_SYSTEM_NAME', this.callingTutorial.DGConfig.generatorSystem);
			tempParamObject.set('DGMethod', "PUT");
			tempParamObject.set('INPUT_CURRENT_HOSTNAME', this.dgHostname);
			tempParamObject.set('INPUT_CURRENT_PORTNUMBER', this.dgPortnumber);
			tempParamObject.set('INPUT_USER_NAME', this.callingTutorial.DGConfig.generatorUser);
			tempParamObject.set('INPUT_GENERATOR', this.callingTutorial.tutorialSchema + "_" + this.loadGenerator);
			tempParamObject.set('INPUT_CONNECTION_DESCRIPTION', connectionDiscription);
			runTEScript(this.elementName + "_createAndSetDGConnection", GLOBAL_TE_SCRIPT_STORE.get('DG_CREATE_CONNECTION_FROM_CATALOG_CONNECTION'), null, null, 
				this.callBackText + ".empty", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		}
		else 
		{
			this.loadConnectionFull(connectionDiscription);
		}
	},	
	
	loadConnectionFull: function(connectionDiscription) {
		var thisObject = this;
		var runError = false;
		parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.callingTutorial.DGConfig.generatorSystem,
			"DGMethod" : 'POST',
			"DGAction" : "generator/" + this.callingTutorial.tutorialSchema + "_" + this.loadGenerator + "@" + this.callingTutorial.DGConfig.generatorUser,
			"LOAD_CONNECTION" : connectionDiscription,
			"DGHostname" : "",
			"DGPortNumber" : ""
		};

		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'asynchronous': false, 
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							alert(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.INVALID_JSON);
							runError = true;
						}
						else if(result.flagGeneralError == true && result.connectionError == true)
						{
							initiateConnectionRefresh();
							runError = true;
						}
						else if(result.returnCode == "false")
						{
							alert(encodeMessage(CORE_MESSAGE_STORE.DG_MESSAGES.ERROR_LOADING_CONNECTION, { GENERATOR_NAME:thisObject.loadGenerator}));
							runError = true;
						}
				}
		});	
		
		if(runError == true) {
			this.setErrorFormatted("Could not load connection");
			return;	
		}
		thisObject.loadDGSingleGeneratorControler();
	},	
	
	setConnectionProfile: function() {
		var thisObject = this;
		parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.callingTutorial.DGConfig.generatorSystem,
			"DGMethod" : "POST",
			"DGAction" : "generator/" + this.callingTutorial.tutorialSchema + "_" + this.loadGenerator + "@" + this.callingTutorial.DGConfig.generatorUser,
			"POST[db2_conn]" : this.callingTutorial.tutorialSchema + "_" + this.loadGenerator
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'asynchronous': false, 
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							alert(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.INVALID_JSON);
							runError = true;
						}
						else if(result.flagGeneralError == true && result.connectionError == true)
						{
							initiateConnectionRefresh();
							runError = true;
						}
						else if(result.returnCode == "false" || result.returnCode == false)
						{
							thisObject.setErrorFormatted(CORE_MESSAGE_STORE.DG_MESSAGES.ERROR_LOADING_CONNECTION);
							runError = true;
						}
						else
						{
							thisObject.loadDGSingleGeneratorControler();
						}
				}
		});
		if(runError == true) {
			this.setErrorFormatted("Could not set connection");
			return;	
		}
	},

	loadDGSingleGeneratorControler: function() {
		loadLink({
					type:"LINK",
					windowStage:this.parentStageID,
					window:this.parentWindowID,
					target:this.parentPanelID,
					PrimaryContainer:true,
			        data:{
						type:"ACTION",
						parameters:{
							action:"DGSingleGeneratorControl",
							DGServer:this.callingTutorial.DGConfig.generatorSystem,
							DGUser:this.callingTutorial.DGConfig.generatorUser,
							DGGenerator: this.callingTutorial.tutorialSchema + "_" + this.loadGenerator,
							compactView: this.compactView,
							microView: this.microView
						}
					}
			});
			if(this.compactView)
				getPanel(this.parentStageID, this.parentWindowID, this.splitPanel).minimizeFrame(false);
	},

	selectRow: function(RowID, TC) {
		if(this.currentSelectedConnectionRow != RowID)
		{
			var oldRowID = this.currentSelectedConnectionRow;
			var row = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + oldRowID);
			if(row != null)
			{
				var rowChildren = row.childElements();
				var numRowChildren = rowChildren.length;
				for(var i = 0; i < numRowChildren; i++)
				{
					rowChildren[i].setStyle({'backgroundColor':'white'});
				}
			}
		}
		this.currentSelectedConnectionRow = RowID;
		var row = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + RowID);
		if(row != null)
		{
			var rowChildren = row.childElements();
			var numRowChildren = rowChildren.length;
			for(var i = 0; i < numRowChildren; i++)
			{
				rowChildren[i].setStyle({'backgroundColor':'#CCCCFF'});
			}
		}
	},

	updateData: function () {

		var dataArray = CONNECTION_MANAGER_CONNECTION_LIST;
		var connectiondescription = null;
		var connectionSelectIndex = null;
		if(this.currentSelectedConnectionRow != null && this.connectionDataTable != null)
		{
			var connObject = this.connectionDataTable[this.currentSelectedConnectionRow];
			if(connObject != null)
				connectiondescription = connObject['description'];
		}
		this.currentSelectedConnectionRow = null;
		var dataTable = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST");
		this.connectionDataTable = dataArray;
		if(dataTable != null && dataArray != null)
		{
			this.clearCONNECTION_MANAGER_CONNECTION_LIST();
			var dataArray_Length = dataArray.length;
			if(dataArray_Length > 0)
			{
				var tdAttributs = "";
				var connectionStatus = "";
				var activeConnection = "";
				for(var i = 0; i < dataArray_Length; i++)
				{
					tdAttributs = " ondblclick='" + this.callBackText + ".selectRow(" + i + ");" + this.callBackText + ".setConnection();' onclick='" + this.callBackText + ".selectRow(" + i + ")' style='background-color:white;cursor: pointer;padding-left:5px;'";
					if(dataArray[i]['authenticated'] == true)
					{
						connectionStatus = dataArray[i]['connectionStatus'] == true ? "<img alt='Y' title='Authenticated' src='images/typevalue_ok.gif'/>" 	: "<img alt='?' title='Connection error' src='images/alert.gif' id='" + this.elementName + "_" + i + "_PageInformationButton' onMouseUp=\"stopPropagation(event);\" onMouseDown='show_GENERAL_BLANK_POPUP(null, decodeURIComponent(\"<div style=\\\"padding:10px;width:350px\\\">" + escape(dataArray[i]['connectionStatus']) + "</div>\"));'/>";
					
						activeConnection = getActiveDatabaseConnection() == dataArray[i]['description'] ? "<img alt='&#187;' title='Connected' src='images/fw_bold.gif'/>" : "";
						dataTable.insert({bottom:	"<tr id='" + this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + i + "'><td" + tdAttributs + ">" + activeConnection +
													"</td><td" + tdAttributs + ">" + connectionStatus +
													"</td><td" + tdAttributs + ">" + dataArray[i]['database'] +
													"</td><td" + tdAttributs + ">" + dataArray[i]['hostname'] +
													"</td><td" + tdAttributs + ">" + dataArray[i]['username'] +
													"</td><td" + tdAttributs + ">" + dataArray[i]['portnumber'] +
													"</td><td" + tdAttributs + ">" + (dataArray[i]['comment'] == null ? "" : dataArray[i]['comment']) +
													"</td></tr>"});
						if(connectiondescription != null && connectiondescription == dataArray[i]['description'])
							connectionSelectIndex = i;
						if(getActiveDatabaseConnection() == dataArray[i]['description'] && connectionSelectIndex == null)
							connectionSelectIndex = i;
					}
				}
			}
			else
			{
				dataTable.update("<tr><td align='center'>" + CORE_MESSAGE_STORE.DG_MESSAGES.NO_CONNECTIONS_AVALIBLE + "</td></tr>");
			}
		}
		if(connectionSelectIndex == null)
			connectionSelectIndex = 0;
		this.selectRow(connectionSelectIndex);
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID );
		if(parentPanel != null)
			if(parentPanel.size != null)
				parentPanel.size();
	},
	
	clearCONNECTION_MANAGER_CONNECTION_LIST: function() {
		this.currentSelectedConnectionRow = null;
		var dataTable = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST");
		if(dataTable != null)
			dataTable.update("<tr><td style='width:10px;'><b>Active&nbsp;&nbsp;</b></td><td style='width:30px;'><b>Authenticated&nbsp;&nbsp;</b></td><td style='width:100px;'><b>Database</b></td><td style='width:100px;'><b>Host</b></td><tdstyle='width:100px;'><b>User</b></td><td style='width:50px;'><b>Port</b></td><td style='width:100px;'><b>Comment</b></td></tr>");
	},
	
	loading: function() {
		var output = "";
		output += "<div id='" + this.elementUniqueID + "_errorDisplayArea' style='width:500px;'></div>";
		output += "<div id='" + this.elementUniqueID + "_errorDisplayArea' style='padding:5px;width:500px;'>";
		output += "<h1>Loading Data Generator</h1>";
		output += "<table id='" + this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST' style='width:100%;'cellpadding='0' cellspacing='0' >";
		output += "<tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>";
		output += "</table>";
		output += "</div'>";

		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, '');
	},
	
	draw: function() {
		var output = "";
		output += "<div id='" + this.elementUniqueID + "_errorDisplayArea' style='width:500px;'></div>";
		output += "<div id='" + this.elementUniqueID + "_errorDisplayArea' style='padding:5px;width:500px;'>";
		output += "<h1>Select a database to run the generator against:</h1>";
		output += "<table id='" + this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST' style='width:100%;'cellpadding='0' cellspacing='0' >";
		output += "<tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>";
		output += "</table>";
		output += "</div'>";

		menu = [
						{
							nodeType : "leaf",
							elementValue : "Use selected database",
							elementAction : 'onclick="' + this.callBackText + '.setConnection();"',
							elementSubNodes : null,
							elementSubNodeDirection : HORIZONTAL
						}
					];
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, '', null, null, menu);
		this.updateData();
	}
}));
