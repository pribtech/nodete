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
var activeWMDWorkloadMonitors = $H();

var WMD_RUN_LIMITER_OPTIONS = [
    {
        value:'s',
        display:'Seconds'
    },
    {
        value:'ms',
        display:'Milliseconds'
    },
    {
        value:'statements',
        display:'Statements'
    },
    {
        value:'iterations',
        display:'Iterations'
    }
];

CORE_CLIENT_ACTIONS.set("WMDSingleWorkloadControl", Class.create(basePageElement, {
	initialize: function($super, callParameters) { 
		var myID = callParameters.uniqueID;
		if(callParameters.callbackID != null)
			myID = callParameters.callbackID;
		$super(myID, "WMDSingleWorkloadControl");
		this.WDMVersion=0;

		this.callParameters = callParameters;
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		this.minimizeControlsOnStart = callParameters.minimizeControlsOnStart;
		if(this.minimizeControlsOnStart == null || this.minimizeControlsOnStart != "true" || this.minimizeControlsOnStart == false)
			this.minimizeControlsOnStart = false;
		else
			this.minimizeControlsOnStart = true;
		
		this.compactView = callParameters.compactView == "true" || callParameters.compactView == true ? true : false;
		this.noTitleBar = callParameters.noTitleBar == "true" || callParameters.noTitleBar == true ? true : false;		
		this.microView = callParameters.microView == "true" || callParameters.microView == true ? true : false;
		
		if(this.microView) this.compactView = false;
		
		this.workloadDataPanelReloadTime = 1;
		this.workloadGraphPanelReloadTime = 1;
		this.errorReportPanelReloadTime = 1;
		
		this.WMDServer = callParameters.WMDServer;
		this.WMDUser = callParameters.WMDUser;
		this.workloadProfile = callParameters.WMDWorkload;
		this.WMDParentControl = callParameters.WMDParentControl;
		
		this.connectionProfileSet = false;
		this.connectionProfilePasswordSet = false;
		this.connectionErrorEncountered = false;
		this.transientConnection = false;
		
		this.firstLoad = true;

		this.previewStage = "WMDPreviewStage" + getGUID();
		this.splitPane = "WMDSplitPane" + getGUID();
		this.previewPanel = "WMDPreviewPanel" + getGUID();
		this.masterControl = "WMDMasterControl" + getGUID();
		this.workloadProfileDetails = null;
		this.reloadInProgress = false;
		

		//Run limiter variables
		this.runLimiterEnabled = false;
		this.runLimiterUnits = 0;
		this.runLimiterValue = 0;

        // used to disable distribution for sequential run mode
        this.randomModeEnabled=false;	
		
		activeWMDWorkloadMonitors.set(this.elementName, this);
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementName, this);
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = 'activeWMDWorkloadMonitors.get("' + this.elementName + '").reload()';
		
		this.reload();
	},
	
	reload: function() {
		if(this.reloadInProgress) return;
		if(this.WMDServer == null)
			this.selectWMDSystem();
		else
			this.workloadAction('status', 'load');
	},
	
	destroy: function($super) {
		activeWMDWorkloadMonitors.unset(this.elementName);
		$super();
	},
	
	selectWMDSystem : function() {
		var thisObject = this;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDSystemList",
			"returntype" : 'JSON'	
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'asynchronous' : false,
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						thisObject.systemList = result.returnValue;
						if(thisObject.systemList != null) {
							var output = "Select the WMD server to run the workload";
							 
							var length = thisObject.systemList.length;
							var i = 0;
							
							if(length == 0) {
								output = "<table style='width:100%;height:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" 
										+ "There are currently no workload multi-user driver systems configured.";
										+ "</td></tr></table>";
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).setContent(output, "Workload MultiUser Driver", null, 'hidden');
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).hideAddressBar();
							}
							else if(length == 1) {
								thisObject.setActiveSystem(0);
							} else if(length > 1) {
								for(i=0; i<length; i++)
									output += "<br/><button onclick='activeWMDWorkloadMonitors.get(\"" + thisObject.elementName + "\").setActiveSystem(this.value)' value='" + i + "'>" + thisObject.systemList[i][0] + "</button>";
								 
								output = "<table style='width:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" + output + "</td></tr></table>";
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).setContent(output, "Workload MultiUser Driver");
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).hideAddressBar();
							}
						}
				}
		});
	},
	
	setActiveSystem : function (activeSystem) {
		this.WMDServer = this.systemList[activeSystem][0];
		this.WMDUser = this.systemList[activeSystem][1];
		this.workloadAction('status', 'load');
	},

	workloadAction : function(attribute, value, action) {
		if(attribute == 'connection_file' && value == 'active') {
			this.loadActiveConnection(getActiveDatabaseConnection());
			value = getActiveDatabaseConnection() + "@" + this.WMDUser;
			if (isCatalogConnection(getActiveDatabaseConnection())) 
				return;
		}

		if(action == null || action == "") action = "workload";
		var thisObject = this;
		this.activeWorkloadEdit = null;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "POST",
			"WMDAction" : action + "/" + this.workloadProfile + "@" + this.WMDUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null){
						thisObject.setError("Work load action, invalid JSON object returned");
						return;
					}
					if(attribute == 'status')
						activeWMDMonitors.get(thisObject.WMDParentControl).updateSystemList();
				},
				'onComplete': function(transport) {
					thisObject.loadWorkloadDetails();
					var stage=getStage(thisObject.previewStage)
					if (stage==null) return;
					stage.reloadPage();
				}
		});
	},
	
	empty: function() {
		this.loadWorkloadDetails();
	},

	loadActiveConnection: function(connectionDiscription) {
		var thisObject = this;		
		if (isCatalogConnection(connectionDiscription))	{
			this.wmdHostname = getConnectionHostname(connectionDiscription);
			this.wmdPortNumber = getConnectionPortNumber(connectionDiscription);

			var tempParamObject = $H();
			tempParamObject.set('INPUT_USE_CONNECTION', getActiveDatabaseConnection());
			tempParamObject.set('INPUT_SYSTEM_NAME', this.WMDServer);
			tempParamObject.set('WMDMethod', "PUT");
			tempParamObject.set('INPUT_CURRENT_HOSTNAME', this.wmdHostname);
			tempParamObject.set('INPUT_CURRENT_PORTNUMBER', this.wmdPortNumber);
			tempParamObject.set('INPUT_USER_NAME', this.WMDUser);
			tempParamObject.set('INPUT_WORKLOAD_PROFILE', this.workloadProfile);
			tempParamObject.set('INPUT_CONNECTION_PROFILE', connectionDiscription + "_" + this.workloadProfile);
			tempParamObject.set('INPUT_CONNECTION_DESCRIPTION', connectionDiscription);
			runTEScript(this.elementName + "_createAndSetConnection", GLOBAL_TE_SCRIPT_STORE.get('WMD_CREATE_CONNECTION_FROM_CATALOG_CONNECTION'), null, null, 
				this.callBackText + ".empty", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		} else {
			parameters = {		
				"USE_CONNECTION" : connectionDiscription,
				"action" : "WMDproxy",
				"returntype" : 'JSON',
				"WMDSystemName" : this.WMDServer,
				"WMDMethod" : "PUT", 
				"WMDAction" : "connection/" + connectionDiscription + "@" + this.WMDUser,
				"LOAD_CONNECTION" : connectionDiscription
			};

			new Ajax.Request( ACTION_PROCESSOR, {
					'method': 'POST',
					'asynchronous': false, 
					'parameters': parameters,	
					'onSuccess': function(transport) {
							var result = transport.responseJSON;
							if(result == null) {
								thisObject.setError(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.INVALID_JSON);
							} else if(result.flagGeneralError == true && result.connectionError == true) {
								initiateConnectionRefresh();
						} else if( isReturnCodeNotOK(result)) {
								thisObject.connectionErrorEncountered = true;
								thisObject.setError(encodeMessage(CORE_MESSAGE_STORE.WMD_MESSAGES.ERROR_LOADING_ACTIVE_CONNECTION, { WORKLOAD_NAME:thisObject.loadWorkload}));
							}
					}
			});	
		}
	},

	workloadStartAction : function() {
		if(this.connectionProfilePasswordSet==false || this.connectionProfilePasswordSet=="false") {	//We need a password)
			var tempParamObject = $H();
			tempParamObject.set('INPUT_USE_CONNECTION', getActiveDatabaseConnection());
			tempParamObject.set('INPUT_SYSTEM_NAME', this.WMDServer);
			tempParamObject.set('USER_NAME', this.WMDUser);
			tempParamObject.set('WORKLOAD_PROFILE', this.workloadProfile);
			tempParamObject.set('CONNECTION_PROFILE', this.workloadProfileDetails['connection']['@attributes']['file']);
			runTEScript(this.elementName + "_getWMDPassword", GLOBAL_TE_SCRIPT_STORE.get('WMD_PASSWORD_PROMPT'), null, null, this.callBackText + ".internalWorkloadStart", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		} else
			this.internalWorkloadStartAction('status', 'started');
	},
	
	internalWorkloadStart : function() {
		this.internalWorkloadStartAction("status", "started", null);
	},
	
	internalWorkloadStartAction : function(attribute, value, action) {
		if(action == null || action == "") action = "workload";
		var thisObject = this;
		this.activeWorkloadEdit = null;

		if(value == "started") {
			if(this.minimizeControlsOnStart) {
				var split = getPanel(this.parentStageID, this.parentWindowID, this.splitPane);
				split.dividerMove(1);
				split.minimizeFrame(false);
			}
			RaiseToTop(this.previewStage, "WorkloadGraph");
		}

		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "POST",
			"WMDAction" : action + "/" + this.workloadProfile + "@" + this.WMDUser
		};
		parameters["POST[" + attribute + "]"] = value;
		parameters["POST[run_size]"] = null;
	    parameters["POST[run_type]"] = null;
		if(this.runLimiterEnabled) {
			parameters["POST[run_size]"] = this.runLimiterValue;
			parameters["POST[run_type]"] = WMD_RUN_LIMITER_OPTIONS[this.runLimiterUnits].value;
	    }
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Internal work load start action, invalid JSON object returned");
						return;
					}
					if(attribute == 'status')
						activeWMDMonitors.get(thisObject.WMDParentControl).updateSystemList();
				},
				'onComplete': function(transport) {
					thisObject.loadWorkloadDetails();
				}
		});
	},

	connectionProfileAction : function(attribute, value, action, connectionProfile) {
		if(action == null || action == "") action = "connection";
		var thisObject = this;
		this.activeWorkloadEdit = null;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "POST",
			"WMDAction" : action + "/" + connectionProfile + "@" + this.WMDUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Connection profile action , invalid JSON object returned ");
						return;
					}
				}
		});
		activeWMDWorkloadMonitors.get(this.elementName).loadConnectionProfile(connectionProfile);
	},

	taskSetAction : function(attribute, value, action, taskSet) {
		if(action == null || action == "") action = "task_set";
		var thisObject = this;
		this.activeWorkloadEdit = null;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "POST",
			"WMDAction" : action + "/" + taskSet + "@" + this.WMDUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Task set action, invalid JSON object returned ");
						return;
					}
				}
		});
		activeWMDWorkloadMonitors.get(this.elementName).loadTaskSet(taskSet);
	},
	
	
	loadWorkloadDetails : function() {
	    if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
		var thisObject = this;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "GET",
			"WMDAction" : "workload/" + this.workloadProfile + "@" + this.WMDUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null) {
							thisObject.setError("Load workload details, invalid JSON object returned ");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if(isReturnCodeNotOK(result)) {
							if(Object.isString(result.returnValue))
								thisObject.setError("Load workload details, "+result.returnValue);
							else if(Object.isString(result.returnValue.message))
								thisObject.setError("Load workload details, "+result.returnValue.message);
							getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).updateRefreshTime(-1);
							return;
						}
						thisObject.workloadProfileDetails = result.returnValue;
						thisObject.drawWorkloadDetails();
				},
				'onException': function(transport,error) {
					switch (typeof error) {
						case 'object':
							openModalAlert("Load workload details, error: "+ error.message);
							return;
						case 'string' :
							openModalAlert("Load workload details, error: "+ error);
							return;
						default:
							openModalAlert("Load workload details, error type unknown");
					}
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
	},

	drawWorkloadDetails : function() {
		var i = 0;
		if(this.workloadProfileDetails == null) return false;
		
		var workloadDetails = this.workloadProfileDetails;
		if(this.firstLoad && !this.microView) {
			this.firstLoad = false;
			var layout = {
						type:"splitPane",
						direction: (this.compactView ? "v" : "h"),
						name:this.splitPane,
						maxSize:200,
						allowResize:true,
						panelA: {
									type:"panel",
									name:this.previewPanel,
									PrimaryContainer:false,
									ContentType:"RAW",
									data:''
								},
							panelB: {
										type                :"stage",
										name                : this.previewStage,
										HasMenuBarContainer : NO_TASK_BAR, 
										top                 : 0, 
										botton              : 0, 
										left                : 0,
										right               : 0,
										titleBarType        : NO_TITLE_BAR,
										windowOptionType    : NO_NAV_BAR, 
										windowControlTypes  : NO_TITLE_BAR_OPTIONS,
										sizable             : WINDOW_IS_FULL
						}
					};
					
			getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).loadLayout(layout, "Workload MultiUser Driver", null, 'hidden', menu);
			getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).hideAddressBar();
				
			if(this.compactView) {
					layout = ({
						target      : "previewPanel",
						raiseToTop  : "",
						windowStage : this.previewStage,
						windowType  : CAN_NOT_CLOSE,
						content     : {
						 					type:"panel",
									        name:this.previewPanel,
									        PrimaryContainer:true,
									        ContentType:"RAW",
									        data:''
								        }
					});
					loadNewPageLayout(layout);		
			}
			//Loads a base metrics graph
			this.loadWorkloadGraph('TransactionsSecond');
			//Loads the raw table view of the data
			var layout = ({
				target      : "WorkloadData",
				raiseToTop  :"",
				windowStage : this.previewStage,
				windowType  : CAN_NOT_CLOSE,
				content     : {
			 					type:"panel",
						        name:"main",
						        panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[1,2,3,5,10,15,30,60]}},
						        overflow:"auto",
						        PrimaryContainer:true,
						        ContentType:"LINK",
						        data:{
										type:"ACTION",
										data:{
											parameters:{
												table:"WMD/metrics" + this.workloadProfile + "@" + this.WMDUser,
												action:"list_table",
												forceDefinitionReload: true,
												definitionRetrievalAction:"WMDProxy",
												definitionRetrievalParameters:{
													encodeObjectAs: "table",
													WMDSystemName: this.WMDServer,
													WMDMethod: "GET",
													WMDAction: "metric/table_defn/" + this.workloadProfile + "@" + this.WMDUser
												},
												WMDSystemName: this.WMDServer,
												WMDMethod: "GET",
												WMDAction: "metric/" + this.workloadProfile + "@" + this.WMDUser
											}
										}
						        }
				}
			});
			loadNewPageLayout(layout);
			//Loads the error report view for the workload
			layout.target = "ErrorReport";
			layout.content.data.data.parameters.WMDAction = "error_report/" + this.workloadProfile + "@" + this.WMDUser;
			loadNewPageLayout(layout);

			if(this.compactView && workloadDetails['status']['@text'] == "stopped")
				RaiseToTop(this.previewStage, "previewPanel");
			else
				RaiseToTop(this.previewStage, "WorkloadGraph");
		}

		var output = "<table valign='top'>"
					+ "<tr><td valign='top'  style='padding-left:" + (this.microView ? "5px;" : "30px;") + "'>";
		var menu = [];
		var mainControl = "<table width='100%' height='100%'><tr><td height='20px'>";
		
		if(workloadDetails['status']['@text'] != "stopped")	{
			if(!this.microView) {
				var workloadDataPanel = getPanel(this.previewStage, "WorkloadData", "main");
				if(this.workloadDataPanelReloadTime <= 0) this.workloadDataPanelReloadTime = 1;
				if(workloadDataPanel.refreshTimeOut == -1) workloadDataPanel.updateReloadTime(this.workloadDataPanelReloadTime);

				var errorReportPanel = getPanel(this.previewStage, "ErrorReport", "main");
				if(this.errorReportPanelReloadTime <= 0) this.errorReportPanelReloadTime = 1;
				if(errorReportPanel.refreshTimeOut == -1) errorReportPanel.updateReloadTime(this.errorReportPanelReloadTime);

				var workloadGraphPanel = getPanel(this.previewStage, "WorkloadGraph", "main");
				if(this.workloadGraphPanelReloadTime <= 0) this.workloadGraphPanelReloadTime = 1;
				if(workloadGraphPanel.refreshTimeOut == -1) workloadGraphPanel.updateReloadTime(this.workloadGraphPanelReloadTime);
			}

			if(workloadDetails['status']['@text'] == "stopping") {
				mainControl += "<img src='./images/stopping.png' style='width:50px;height:50px;'/>";
				menu = [
					{
						nodeType: "leaf",
						elementValue : "Reset",
						elementAction : "onclick=\"" + this.callBackText + ".workloadAction('status', 'reset');\""
					},
					{
						nodeType: "leaf",
						elementValue : "Run Report",
						elementAction : "onclick=\"" + this.callBackText + ".loadBatchRunInfo('"+this.workloadProfileDetails['@attributes']['ID']+"');\""
					},
					{
						nodeType: "leaf",
						elementValue : "Get Log",
						elementAction : "onclick=\"" + this.callBackText + ".loadLog();\""
					}
				];
			} else {
				mainControl += "<img src='./images/stop.png' style='width:50px;height:50px;' onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').workloadAction('status', 'stop');\"/>";
				menu = [
					{
						nodeType: "leaf",
						elementValue : "Reload",
						elementAction : "onclick=\"" + this.callBackText + ".workloadAction('status', 'reload');\""
					},
					{
						nodeType: "leaf",
						elementValue : "Stop",
						elementAction : "onclick=\"" + this.callBackText + ".workloadAction('status', 'stop');\""
					},
					{
						nodeType: "leaf",
						elementValue : "Reset",
						elementAction : "onclick=\"" + this.callBackText + ".workloadAction('status', 'reset');\""
					},
					{
						nodeType: "leaf",
						elementValue : "Run Report",
						elementAction : "onclick=\"" + this.callBackText + ".loadBatchRunInfo('"+this.workloadProfileDetails['@attributes']['ID']+"');\""
					},
					{
						nodeType: "leaf",
						elementValue : "Get Log",
						elementAction : "onclick=\"" + this.callBackText + ".loadLog();\""
					}
				];
			}
		} else {
			if(!this.microView) {
			    var workloadDataPanel = getPanel(this.previewStage, "WorkloadData", "main");
	            this.workloadDataPanelReloadTime = workloadDataPanel.refreshTimeOut;
			    workloadDataPanel.updateReloadTime(-1);
			    
			    var workloadGraphPanel = getPanel(this.previewStage, "WorkloadGraph", "main");
	            this.workloadGraphPanelReloadTime = workloadGraphPanel.refreshTimeOut;
			    workloadGraphPanel.updateReloadTime(-1);
	
			    var errorReportPanel = getPanel(this.previewStage, "ErrorReport", "main");
	            this.errorReportPanelReloadTime = errorReportPanel.refreshTimeOut;
			    errorReportPanel.updateReloadTime(-1);
			}

			var passwordSet = false;
			mainControl += "<img src='./images/play.png' style='width:50px;height:50px;'  onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').workloadStartAction();\"/>";
			menu = [];
			
			menu.push({
				nodeType: "leaf",
				elementValue : "Reload",
				elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').workloadAction('status', 'reload');\""
		    });
		    menu.push({
				nodeType: "leaf",
				elementValue : "Reset",
				elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').workloadAction('status', 'reset');\""
			});
			if(!this.microView) {
			    menu.push({
						nodeType: "leaf",
						elementValue : "Run",
						elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').workloadStartAction();\""
					});
				menu.push({
						nodeType: "leaf",
						elementValue : "Reset",
						elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').workloadAction('status', 'reset');\""
					});
				menu.push({
						nodeType: "leaf",
						elementValue : "Run Report",
						elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadBatchRunInfo('"+this.workloadProfileDetails['@attributes']['ID']+"');\""
				});
				menu.push({
						nodeType: "leaf",
						elementValue : "Get Log",
						elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadLog();\""
				});
			}
		}

        mainControl += "</td></tr>";

        //Run limiter interface
		if(!this.microView)	{
	        mainControl += "<tr><td height='20px'>"
						+ "<table>"
						+ "<tr><td height='20'>"
						+ "<input type='checkbox' onClick='activeWMDWorkloadMonitors.get(\"" + this.elementName + "\").runLimiterToggle(this.checked)' " + (this.runLimiterEnabled ? "checked" : "" ) + "/>"
						+ "</td><td>"
						+ "<b>Run&nbsp;for&nbsp;:</b>"
						+ "</td><td></td></tr><tr><td></td><td>"
	        			+ "<input id='" + this.elementName + "_runLimiterValueInput' " + (this.runLimiterEnabled ? "" : "disabled='true'") + " type='text' name='run_size' style='width:50px;' onfocus='this.select()' value='' onChange='activeWMDWorkloadMonitors.get(\"" + this.elementName + "\").runLimiterValue = this.value'/>"
						+ "</td><td>" 
			            + "<select id='" + this.elementName + "_runLimiterUnitSelect' " + (this.runLimiterEnabled ? "" : "disabled='true'") + " name='run_type' onChange='activeWMDWorkloadMonitors.get(\"" + this.elementName + "\").runLimiterUnits = this.value' >";
			
			for(i = 0; i < WMD_RUN_LIMITER_OPTIONS.length; i++)
			    mainControl += '<option value="' + i + '" ' + (i == this.runLimiterUnits ? "selected" : "")  + '>' + WMD_RUN_LIMITER_OPTIONS[i].display  + '</option>';
			
	        mainControl += "</select></td></tr>";
						+ "</table></td></tr>";
		}
		
		if(this.compactView) {
			mainControl += "<tr><td valign='bottom'><table style='width:100%;'>"
						+ "<tr><td class='tableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"previewPanel\");'>Settings</td></tr>"
						+ "<tr><td class='tableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"WorkloadGraph\");'>Metrics Graphed</td></tr>"
						+ "<tr><td class='tableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"WorkloadData\");'>Metrics Table</td></tr>"
						+ "<tr><td class='tableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"ErrorReport\");'>Run Errors</td></tr>"
						+ "</table></td></tr>"
						+ "</table>";
			getPanel(this.parentStageID, this.parentWindowID, this.masterControl).setContent(mainControl);
		} else {	
			mainControl += "</table>";
			output += mainControl;	
		}

		output += "</td><td valign='" + (this.microView ? "center" : "top") + "' style='padding-left:" + (this.microView ? "5px;" : "30px;") + "'>";
		
		if(!this.microView) output += "<b>Details</b><br/>";
		
		output += "<table>";
		
		if(!this.microView) {
			var run_attributes = workloadDetails['run_attributes'];
			if( run_attributes == null ) {
				var actions_per_connection = workloadDetails['@attributes']['actions_per_connection'];
				if( actions_per_connection == null )  actions_per_connection=-1; 
				var set_sequence = workloadDetails['@attributes']['set_sequence'];
				var think_time = workloadDetails['@attributes']['think_time'];
				var number_of_connections = workloadDetails['@attributes']['number_of_connections'];
				output += "<tr><td style='white-space: nowrap'>Statements run per connection</td><td>&nbsp;&nbsp;</td><td id='" + this.elementName + "_actionPer_value' style='width:50px;'>" + (actions_per_connection <= 0 ? 'disabled' : actions_per_connection) + "</td><td id='" + this.elementName + "_actionPer_control' style='width:50px;'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('"  
					+	this.elementName + "_actionPer', '" + 
					+	(actions_per_connection <= 0 ? 'disabled' : actions_per_connection) + "', '" 
					+	actions_per_connection
					+	"', 'actions_per_connection', '"
					+	"')\" src='./images/edit.gif'  title='Change the number of statement a client runs before disconnecting and reconecting...' style='float:right;'/>"
					+ "</td></tr>"
					+ "<tr><td>Statement run sequence</td><td>&nbsp;&nbsp;</td><td id='" + this.elementName + "_sequence_value' style='width:50px;'>" + set_sequence + "</td><td id='" + this.elementName + "_sequence_control' style='width:50px;'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('"
					+	this.elementName + "_sequence', '"  
					+	set_sequence + "', '" 
					+	set_sequence 
					+	"', 'sequence_type', '"
					+	"', 'option', ['sequential', 'random'])\" src='./images/edit.gif'  title='Change statement run sequence...' style='float:right;'/>"
					+ "</td></tr>";
			} else {
				this.WDMVersion=1;
				var actions_per_connection = run_attributes['actions_per_connection']['@attributes']['value'];
				var set_sequence = run_attributes['set_sequence']['@attributes']['value'];
				var think_time = run_attributes['think_time']['@attributes']['value'];
				var number_of_connections = run_attributes['number_of_connections']['@attributes']['value'];
				output += "<tr><td style='white-space: nowrap'>Statements run per connection</td><td>&nbsp;&nbsp;</td><td id='" + this.elementName + "_actionPer_value' style='width:50px;'>" + (actions_per_connection <= 0 ? 'disabled' : actions_per_connection) + "</td><td id='" + this.elementName + "_actionPer_control' style='width:50px;'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('"  
						+	this.elementName + "_actionPer', '" + 
						+	(actions_per_connection <= 0 ? 'disabled' : actions_per_connection) + "', '" 
						+	actions_per_connection
						+	"', 'actions_per_connection', '"
						+	"')\" src='./images/edit.gif'  title='Change the number of statement a client runs before disconnecting and reconecting...' style='float:right;'/>"
						+ "</td></tr>"
						+ "<tr><td>Statement run sequence</td><td>&nbsp;&nbsp;</td><td id='" + this.elementName + "_sequence_value' style='width:50px;'>" + set_sequence + "</td><td id='" + this.elementName + "_sequence_control' style='width:50px;'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('"
						+	this.elementName + "_sequence', '"  
						+	set_sequence + "', '" 
						+	set_sequence 
						+	"', 'sequence_type', '"
						+	"', 'option', ['sequential', 'random'])\" src='./images/edit.gif'  title='Change statement run sequence...' style='float:right;'/>"
					+	 "</td></tr>";
			}
		}
		
		output += "<tr><td>"+ (this.microView ? "Think" : "Client think") + " time</td><td>&nbsp;&nbsp;</td>"
				+	"<td id='" + this.elementName + "_thinkTime_value' style='width:" + (this.microView ? "10px;" : "50px;") + "'>" + think_time + "</td><td id='" + this.elementName + "_thinkTime_control' style='width:" + (this.microView ? "10px;" : "50px;") + "'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('" 
				+		this.elementName + "_thinkTime', '" 
				+		think_time + "', '" 
				+		think_time 
				+		"', 'think_time', '" 
				+		"')\" src='./images/edit.gif' title='Change time between statement executions...' style='float:right;'/></td></tr>"
				+ "<tr><td>"+ (this.microView ? "Clients" : "Simulated clients")+"</td><td>&nbsp;&nbsp;</td>"
				+	"<td id='" + this.elementName + "_connection_value' style='width:" + (this.microView ? "10px;" : "50px;") + "'>" + number_of_connections + "</td><td id='" + this.elementName + "_connection_control' style='width:" + (this.microView ? "10px;" : "50px;") + "'>"
				+	"<img title='Change number of simulated clients...' onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('"  
				+	this.elementName + "_connection', '"
				+	number_of_connections + "', '" 
				+	number_of_connections
				+	"', 'number_of_connections', '" 
				+	"')\" src='./images/edit.gif' style='float:right;'/>"
				+ "</td></tr>";

		if (workloadDetails['password_not_set']==null || workloadDetails['password_not_set']['@attributes']['value'] == 'true' || workloadDetails['password_not_set']['@attributes']['value'] == true) 
			this.connectionProfilePasswordSet = "false";
		else 
			this.connectionProfilePasswordSet = "true";
						
		if (workloadDetails['connection_not_set']['@attributes']['value'] == "true" && !this.connectionErrorEncountered) {
			this.connectionErrorEncountered = true;
			this.transientConnection = true;
			if (getActiveDatabaseConnection() != null) 
				this.workloadAction('connection_file', 'active');
			else
				alert(encodeMessage(CORE_MESSAGE_STORE.WMD_MESSAGES.NO_CONNECTIONS_AVALIBLE_TO_PUSH, { WORKLOAD_NAME:this.loadWorkload}));
		} else 
			this.connectionErrorEncountered = false;

		if(!this.microView) {
			if(workloadDetails['status']['@text'] != "started") {
				output += "<tr><td>Connection profile</td><td>&nbsp;&nbsp;</td><td>" + workloadDetails['connection']['@attributes']['file'] + "</td>"
						+	"<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadConnectionProfile('"  
						+	workloadDetails['connection']['@attributes']['file'] + "');\" src='./images/fw_bold.gif' style='float:right;'/></td>"
						+	"<td><img src='./images/windownav/refresh_small.gif' title='Reload connection profile from disk...' alt='reload connection profile from disk'  style='width:16px;height:16px;' onclick=\"activeWMDWorkloadMonitors.get('"  
						+	this.elementName + "').connectionProfileAction('status', 'reload', 'connection', '" + workloadDetails['connection']['@attributes']['file'] + "');\"/></td>"
						+"</tr>"
						+"<tr><td>Task set</td><td>&nbsp;&nbsp;</td><td>" + workloadDetails['task']['@attributes']['file'] + "</td>"
						+	"<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadTaskSet('" + workloadDetails['task']['@attributes']['file'] + "');\" src='./images/fw_bold.gif' style='float:right;'/></td>"
						+	"<td><img src='./images/windownav/refresh_small.gif' title='Reload task set from disk...' style='width:16px;height:16px;' onclick=\"activeWMDWorkloadMonitors.get('"
						+	this.elementName + "').taskSetAction('status', 'reload', 'task_set', '" + workloadDetails['task']['@attributes']['file'] + "');\"/></td>"
						+ "</tr>";
		    } else {
				output += "<tr><td>Connection profile</td><td>&nbsp;&nbsp;</td><td>" + workloadDetails['connection']['@attributes']['file'] + "</td>"
						+	"<td><img title='View connection profile...' onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadConnectionProfile('" + workloadDetails['connection']['@attributes']['file'] + "');\" src='./images/fw_bold.gif' style='float:right;'/></td>"
						+	"</tr>"
						+ "<tr><td>Task set</td><td>&nbsp;&nbsp;</td><td>" + workloadDetails['task']['@attributes']['file'] + "</td>"
						+	"<td><img title='View task set...' onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadTaskSet('" + workloadDetails['task']['@attributes']['file'] + "');\" src='./images/fw_bold.gif' style='float:right;'/></td>"
						+ "</tr>";
		    }
		}
		output += "</table>";
        		+ "</td>";
		
        this.randomModeEnabled=(workloadDetails['@attributes']['set_sequence'] == 'random');

		
	    if(!this.microView) {
		    output += "<td valign='top' style='padding-left:30px;'><b>Distribution</b><br/>"
		    			+ "<table>";
	
		    if(workloadDetails['distribution']['group']['@attributes'] != null) {
			    var value = Math.round(workloadDetails['distribution']['group']['@attributes']['balance']*100)/100;
			    output += "<tr>"
			    		+	"<td"+(this.randomModeEnabled ? "" : " style='color:#CCCCCC;'")+">" + workloadDetails['distribution']['group']['@attributes']['name'] + "</td><td>&nbsp;&nbsp;</td>"
			    		+	"<td id='" + this.elementName + "_distribution_"+workloadDetails['distribution']['group']['@attributes']['name']+"_value' style='width:50px;"+(this.randomModeEnabled ? "" : "color:#CCCCCC;'")+"'>" + value + "</td>"
		        		+	"<td id='" + this.elementName + "_distribution_"+workloadDetails['distribution']['group']['@attributes']['name']+"_control' style='width:50px;'>";
			    if (this.randomModeEnabled) {
			        output += "<img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute("
				    		+  "'" + this.elementName + "_distribution'"									// field
				        	+	",'" + value + "'" 												   			// displayValue
				        	+	",'" + value + "'"															// rawValue
				        	+	",'distribution'"															// name
				        	+	", "+undefined+" "															// action
				        	+	", "+undefined+" "															// type
				        	+	",'" + workloadDetails['distribution']['group']['@attributes']['name']+"'"	 // options
				        	+	")\" src='./images/edit.gif' style='float:right;'/>";
			    }
			    output += "</td></tr>";
		    }  else {
			    var length = workloadDetails['distribution']['group'].length;
			    for(i=0; i < length; i++) {
			    	var value = Math.round(workloadDetails['distribution']['group'][i]['@attributes']['balance']*100)/100;
				    output += "<tr>"
							+	"<td"+(this.randomModeEnabled ? "" : " style='color:#CCCCCC;'")+">" + workloadDetails['distribution']['group'][i]['@attributes']['name'] + "</td><td>&nbsp;&nbsp;</td>"
				    		+	"<td id='" + this.elementName + "_distribution_"+workloadDetails['distribution']['group'][i]['@attributes']['name']+"_value' style='width:50px;"+(this.randomModeEnabled ? "" : "color:#CCCCCC;'")+"'>" + value + "</td>"
			  				+	"<td id='" + this.elementName + "_distribution_"+workloadDetails['distribution']['group'][i]['@attributes']['name']+"_control' style='width:50px;'>";
				    if (this.randomModeEnabled) {
				        output += "<img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute("
					       		+	"'" + this.elementName + "_distribution'"													// field
					       		+	",'" + value + "'" 																			// displayValue
					       		+	",'" + value + "'"																			// rawValue
					       		+	",'distribution'"																			// name
					       		+	 ", "+undefined+" "																			// action
					       		+	 ", "+undefined+" "																			// type
					       		+	 ",'" + workloadDetails['distribution']['group'][i]['@attributes']['name']+"'"				// options
								+    ")\" src='./images/edit.gif' style='float:right;'/>";
			        }
			    	output += "</td></tr>";
			    }
		    }
		    output += "</table>"
					+ 	"</td><td valign='top' style='padding-left:30px;'>"
					+		"<b>Metrics</b><br/>"
					+ "<table>"
					+ "<tr><td>History Length</td><td>&nbsp;&nbsp;</td><td id='" + this.elementName + "_historyLength_value' style='width:50px;'>" + workloadDetails['metrics']['history']['@attributes']['length'] + "</td><td><td id='" + this.elementName + "_historyLength_control' style='width:50px;'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('" 
					+		this.elementName + "_historyLength', '"
					+		workloadDetails['metrics']['history']['@attributes']['length'] + "', '"  
					+		workloadDetails['metrics']['history']['@attributes']['length'] 
					+		"', 'history', '" 
					+		"metric" 
					+		"')\" src='./images/edit.gif' style='float:right;'/></td></tr>"
					+ "<tr><td>Report interval</td><td>&nbsp;&nbsp;</td><td id='" + this.elementName + "_reportInterval_value' style='width:50px;'>" + workloadDetails['metrics']['report']['@attributes']['interval'] + "</td><td><td id='" + this.elementName + "_reportInterval_control' style='width:50px;'><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').editWorkloadAttribute('" 
					+		this.elementName + "_reportInterval', '"
					+		workloadDetails['metrics']['report']['@attributes']['interval'] + "', '"  
					+		workloadDetails['metrics']['report']['@attributes']['interval'] 
					+		"', 'interval', '" 
					+		"metric"
					+		"')\" src='./images/edit.gif' style='float:right;'/></td></tr>"
					+ "</table>"
					+ "<table>"
					+	"<tr><td>Graph: <select onchange=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadWorkloadGraph(this.value)\">" 
					+		"<option value='TransactionsSecond' selected>Transactions per second</button></option>"
					+		"<option value='TransactonsPerRead'>Transaction per interval</button></option>" 
					+		"<option value='TransactionTimes'>Average query times</button></option>"	
					+		"</select></td></tr>"
					+ "</table>"
					+ "</td></tr>";
	    }
		output += "</table>";
		
		var condition = workloadDetails["condition"]["@text"];
		if (condition != null && condition != 'OK' && condition!= 'starting' && condition != 'started' && condition != 'stopped' && condition != 'null')
			output += '<div id="' + this.elementUniqueID + '_conditionDisplayArea" style="top:-5px; text-align:left; background-color:#EEEEEE; border:solid 2px black;overflow-x: auto;overflow:auto;position:relative;">Workload Condition: '+workloadDetails["condition"]["@text"]+'</div>';
		
		var workload_title = null;
		var workload_description = null;
		if (workloadDetails['title'] != undefined)
    		workload_title = workloadDetails['title']['@text'];
		else 
    		workload_title = workloadDetails['@attributes']['ID'];
		if (workloadDetails["description"] != undefined)
		    workload_description = workloadDetails["description"]['@text'];
		
		if(this.microView){
			if(this.noTitleBar)
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, null, null, null, null);
			else
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).setContent(output, "<b>" + workload_title  + "</b>", workload_description, null, menu);
		} else if(this.compactView) {
			if(this.noTitleBar)
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, null, null, null, null);
			else
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, "Workload details for: <b>" + workload_title  + "</b> owned by: <b>" + workloadDetails['owner']['@text'] + "</b>", workload_description, null, menu);
		} else {
			if(this.noTitleBar)
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).setContent(output, null, null, null, null);
			else
				getPanel( this.parentStageID,this.parentWindowID, this.previewPanel).setContent(output, "Workload details for: <b>" + workload_title  + "</b> owned by: <b>" + workloadDetails['owner']['@text'] + "</b>", workload_description, null, menu);
		}
		$(this.elementName + "_runLimiterValueInput").value = this.runLimiterValue;
	},
	
	loadWorkloadGraph : function(graphName) {
		var workloadGraphPanel = getPanel(this.previewStage, "WorkloadGraph", "main");
		if(workloadGraphPanel != null)
        	this.workloadGraphPanelReloadTime = workloadGraphPanel.refreshTimeOut;
		var workload_title = "";
		if (this.workloadProfileDetails['title'] != undefined)
    		workload_title = this.workloadProfileDetails['title']['@text'];
		else 
    		workload_title = this.workloadProfileDetails['@attributes']['ID'];
		    
		var layout = ({
			target      : "WorkloadGraph",
			raiseToTop  :"",
			windowStage : this.previewStage,
			windowType  : CAN_NOT_CLOSE,
			content     : {
		 					type:"panel",
					        name:"main",
					        panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[1,2,3,5,10,15,30,60]}},
					        overflow:"auto",
					        PrimaryContainer:true,
					        ContentType:"LINK",
					        data:{
									type:"ACTION",
									data:{
										parameters:{
											table:"WMD/metrics",
											action:"graphYUI",
											title:"Workload graph for: <b>" + workload_title  + "</b> owned by: <b>" + this.workloadProfileDetails['owner']['@text'] + "</b>",
											WMDSystemName: this.WMDServer,
											YAxisDegradation: 10,
											WMDMethod: "GET",
											WMDAction: "metric/" + this.workloadProfile + "@" + this.WMDUser,
											graphName : graphName
										}
									}
					        }
			}
			});
		loadNewPageLayout(layout);
		workloadGraphPanel = getPanel(this.previewStage, "WorkloadGraph", "main");
		if(workloadGraphPanel != null)
			workloadGraphPanel.updateReloadTime(this.workloadGraphPanelReloadTime);
	},
	
	loadTaskSet : function(taskSetName) {
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "GET",
			"WMDAction" : "task_set/" + taskSetName + "@" + this.WMDUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
						if(result == null) {
							thisObject.setError("Load tasks set, invalid JSON object returned ");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if( isReturnCodeNotOK(result)) {
							if(Object.isString("Load tasks set, "+result.returnValue))
								thisObject.setError(result.returnValue);
							else if(Object.isString(result.returnValue.message))
								thisObject.setError("Load tasks set, "+result.returnValue.message);
						}
					var layout = ({
						target      : "TaskSet",
						raiseToTop  :"",
						windowStage : thisObject.previewStage,
						title		: "Task set",
						content     : {
					 				        type:"panel",
								            name:"main",
								            overflow:"auto",
								            ContentType:"link",
                                            data: {
                                                type:"ACTION",
                                                data: {
                                                            parameters:{
                                                                action: "parseTaskSet",
                                                                taskset: result.returnValueRAW.escapeHTML()
                                                            }    
                                                }
                                            }
                                      }   
						});
					loadNewPageLayout(layout);
					RaiseToTop(thisObject.previewStage, "TaskSet");
				}
		});
	},
	
	loadConnectionProfile : function(connectionProfileName) {
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "GET",
			"WMDAction" : "connection/" + connectionProfileName + "@" + this.WMDUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Load connection profile, invalid JavaScript object was returned");
						return;
					}
					var layout = ({
						target      : "ConnectionProfile",
						raiseToTop  :"",
						windowStage : thisObject.previewStage,
						title		: "Connection profile",
						content     : {
					 					type:"panel",
								        name:"main",
								        overflow:"auto",
								        ContentType:"RAW",
								        data: "<pre><code>" + result.returnValueRAW.escapeHTML() + "</code></pre>"
						}
						});
					loadNewPageLayout(layout);
					RaiseToTop(thisObject.previewStage, "ConnectionProfile");
				}
		});
	},
	
	loadXMLProfile: function(XMLProfileType, windowTitle, workloadName, profileName) {
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "GET",
			"WMDAction" : XMLProfileType + "/" + taskSetName + "@" + this.WMDUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
						if(result == null) {
							thisObject.setError("Load XML profile invalid JSON object returned ");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if( isReturnCodeNotOK(result)) {
							if(Object.isString(result.returnValue)) {
								thisObject.setError("Load XML profile "+result.returnValue);
							} else if(Object.isString(result.returnValue.message)) {
								thisObject.setError("Load XML profile "+result.returnValue.message);
							}
						}
					var layout = ({
						target      : XMLProfileType,
						raiseToTop  : "",
						windowStage : thisObject.previewStage,
						title		: windowTitle,
						content     : {
					 				        type:"panel",
								            name:"main",
								            overflow:"auto",
								            ContentType:"link",
                                            data: {
                                                type:"ACTION",
                                                data: {
                                                            parameters:{
                                                                action: "parseTaskSet",
                                                                taskset: result.returnValueRAW.escapeHTML()
                                                            }    
                                                }
                                            }
                                      }   
						});
					loadNewPageLayout(layout);
					RaiseToTop(thisObject.previewStage, "TaskSet");
				}
		});
	},
	
	editWorkloadAttribute: function(field, displayValue, rawValue, name, action, type, options) {
		var displayHolder = $(field + "_value");
		var controlHolder = $(field + "_control");
		if (name == 'distribution') {
			displayHolder = $(field + "_" + options + "_value");
			controlHolder = $(field + "_" + options + "_control");
		}
		if(type==null) type = "text";
		if(displayHolder != null & controlHolder != null) {
			this.cancelActiveWorkloadEdit();
			if(type == 'text') {
				displayHolder.update('<form id="' + field + '_form"><input id="' + field + '_newvalue" name="newvalue" style="width:100%;" type="text" value="' + rawValue + '"/></form>');
				$(field + '_newvalue').activate();
			} else if(type == 'password') {
				displayHolder.update('<form id="' + field + '_form"><input id="' + field + '_newvalue" name="newvalue" style="width:100%;" type="password" value="' + rawValue + '"/></form>');
				$(field + '_newvalue').activate();
			} else if(type == 'option' && options==null && name == 'connection_file') {
				//TODO: get list of connections
				options=['active', 'connection_profile1'];
				var length = options.length;
				var i =0;
				var output = '<form id="' + field + '_form">';
				for(i=0; i<length; i++)
					output += '<input type="radio" name="newvalue" value="' + options[i] + '" ' + (options[i] == displayValue ? "checked" : "" ) + '>' + options[i] + '<br>';
				output += '</form>';
				displayHolder.update(output);
			}
			else if(type == 'option' && Object.isArray(options)) {
				var length = options.length;
				var i =0;
				var output = '<form id="' + field + '_form">';
				for(i=0; i<length; i++)
					output += '<input type="radio" name="newvalue" value="' + options[i] + '" ' + (options[i] == displayValue ? "checked" : "" ) + '>' + options[i] + '<br>';
				output += '</form>';
				displayHolder.update(output);
			}
			var thisObject = this;
			$(field + '_form').observe('keypress', function(event) {
			if(event.keyCode == Event.KEY_RETURN) {
					thisObject.processActiveWorkloadEdit();
					event.stop();
					return false;
				}
			});
			controlHolder.update('<img style="padding-left:5px;" src="./images/typevalue_ok.gif" onclick="activeWMDWorkloadMonitors.get(\'' + this.elementName + '\').processActiveWorkloadEdit()"/>&nbsp;' + 
								 '<img style="padding-left:5px;" src="./images/cancel.gif" onclick="activeWMDWorkloadMonitors.get(\'' + this.elementName + '\').cancelActiveWorkloadEdit()"/>');
			this.activeWorkloadEdit = {
				'field' : field,
				'displayValue' : displayValue,
				'rawValue' : rawValue,
				'name': name,
				'action' : action,
				'type' : type,
				'options' : options
			};
		}
	},

	processActiveWorkloadEdit: function() {
		if(this.activeWorkloadEdit != null) {
			var formElement = $(this.activeWorkloadEdit.field + '_form');
			if(formElement != null)	{
				var activeWorkloadEdit = this.activeWorkloadEdit;
				var newvalue = $(this.activeWorkloadEdit.field + '_form').serialize(true).newvalue;
				this.cancelActiveWorkloadEdit();
				
				if (this.activeWorkloadEdit.name == 'distribution') {
					newvalue = this.activeWorkloadEdit.options + ":" + newvalue;
					this.activeWorkloadEdit.options = undefined;
					activeWorkloadEdit.options = undefined;
				}
				this.workloadAction(activeWorkloadEdit.name, newvalue, activeWorkloadEdit.action);
			}
		}
	},
	
	cancelActiveWorkloadEdit: function() {
		if(this.activeWorkloadEdit != null) {
			var displayHolder = $(this.activeWorkloadEdit.field + "_value");
			var controlHolder = $(this.activeWorkloadEdit.field + "_control");

			if (this.activeWorkloadEdit.name == 'distribution') {
				displayHolder = $(this.activeWorkloadEdit.field + "_" + this.activeWorkloadEdit.options + "_value");
				controlHolder = $(this.activeWorkloadEdit.field + "_" + this.activeWorkloadEdit.options + "_control");
			}

			if(displayHolder != null & controlHolder != null) {
				displayHolder.update(this.activeWorkloadEdit.displayValue);
				controlHolder.update('<img onclick=\'activeWMDWorkloadMonitors.get("' + this.elementName + '").editWorkloadAttribute("' + this.activeWorkloadEdit.field + '", "' + 
										this.activeWorkloadEdit.displayValue + '", "' + 
										this.activeWorkloadEdit.rawValue + '", "' + 
										this.activeWorkloadEdit.name + '", "' + 
										this.activeWorkloadEdit.action + '", "' + 
										this.activeWorkloadEdit.type  + '", ' + 
										Object.toJSON(this.activeWorkloadEdit.options)
										 + ')\' src="./images/edit.gif" style="float:right;"/>');
			}
		}
	},
	
	updateStatus: function(currentStatus) {
		if(this.workloadProfileDetails == null) 
			this.reload();
		else if(currentStatus != this.workloadProfileDetails['status']['@text'].toLowerCase())
				this.reload();
	},
	
	getData : function(dataSource, windowTitle) {
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "GET",
			"WMDAction" : dataSource
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Get data, an invalid JavaScript object was returned");
						return;
					}
					var windowName = getGUID() + "";
					var layout = ({
						target      : windowName,
						raiseToTop  :"",
						windowStage : thisObject.previewStage,
						title		: windowTitle,
						content     : {
					 					type:"panel",
								        name:"main",
								        overflow:"auto",
								        ContentType:"RAW",
								        data: ""
						}
						});
					loadNewPageLayout(layout);
					RaiseToTop(thisObject.previewStage, windowName);
					getPanel(thisObject.previewStage, windowName, "main").setContent( result.returnCode=="true" ? result.returnValueRAW : "<table style='width:100%;height:100%'><tr><td align='center'><h2>Error: get "+transport.request.parameters.WMDAction+"</h2><h2>"+result.returnValue+"</h2></td></tr></table>");
				}
		});
	},
	
	runLimiterToggle: function(enableRunLimiter) {
	    var runLimiterValueInput = $(this.elementName + "_runLimiterValueInput");
	    var runLimiterUnitSelect = $(this.elementName + "_runLimiterUnitSelect");
	    if(runLimiterValueInput == null || runLimiterUnitSelect == null) return false;
	    
	    this.runLimiterEnabled = enableRunLimiter;
	    if(this.runLimiterEnabled) {
	        runLimiterValueInput.enable();
    	    runLimiterUnitSelect.enable();
	    } else {
	        runLimiterValueInput.disable();
    	    runLimiterUnitSelect.disable();
	    }
	},

	loadBatchRunInfo : function(workloadName) {
		this.getData("batch/" + workloadName + "@" + this.WMDUser, "Batch Run Data");
	},
	
	loadLog : function(){
		this.getData("log/", "Log Data");
	},
	
	setError : function($super,message) {
		$super("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+message+"</h2></td></tr></table>");
	},

}));
