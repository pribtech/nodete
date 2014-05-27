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
var activeDGGeneratorMonitors = $H();

CORE_CLIENT_ACTIONS.set("DGSingleGeneratorControl", Class.create(basePageElement, {
	initialize: function($super, callParameters) { 
		var myID = callParameters.uniqueID;
		if(callParameters.callbackID != null)
			myID = callParameters.callbackID;
		$super(myID, "DGSingleGeneratorControl");

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
		
		this.statusReportPanelReloadTime = 1;
		
		this.DGServer = callParameters.DGServer;
		
		this.DGUser = callParameters.DGUser;
		
		this.generatorProfile = callParameters.DGGenerator;
		
		this.DGParentControl = callParameters.DGParentControl;
		
		this.firstLoad = true;

		this.previewStage = "DGPreviewStage" + getGUID();

		this.splitPane = "DGSplitPane" + getGUID();
		
		this.previewPanel = "DGPreviewPanel" + getGUID();

		this.masterControl = "DGMasterControl" + getGUID();
		
		this.generatorProfileDetails = null;

		this.reloadInProgress = false;
		
		activeDGGeneratorMonitors.set(this.elementName, this);
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementName, this);
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = 'activeDGGeneratorMonitors.get("' + this.elementName + '").reload()';
		
		this.reload();
		
	},
	
	reload: function() {
		
		if(this.reloadInProgress) return;
		
		if(this.DGServer == null)
		{
			this.selectDGSystem();
		}
		else
		{
			this.generatorAction('status', 'load');
		}	
	},
	
	destroy: function($super) {
		activeDGGeneratorMonitors.unset(this.elementName);
		$super();
	},
	
	selectDGSystem : function() {
		
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
						thisObject.systemList = result.returnValue;
						if(thisObject.systemList != null)
						{
							var output = "Select the DG server to run the generator";
							 
							var length = thisObject.systemList.length;
							var i = 0;
							
							if(length == 0) {
								
								output = "There are currently no data generator systems configured.";
								
								output = "<table style='width:100%;height:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" + output + "</td></tr></table>";
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).setContent(output, "Data Generator", null, 'hidden');
	
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).hideAddressBar();
							}
							else if(length == 1) {
								thisObject.setActiveSystem(0);
							} else if(length > 1)
							{
								for(i=0; i<length; i++)
								{
									output += "<br/><button onclick='activeDGGeneratorMonitors.get(\"" + thisObject.elementName + "\").setActiveSystem(this.value)' value='" + i + "'>" + thisObject.systemList[i][0] + "</option>";
								}
								 
								output = "<table style='width:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" + output + "</td></tr></table>";
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).setContent(output, "Data Generator");
	
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).hideAddressBar();
							}
							
						}
				}
		});
		
	},
	
	setActiveSystem : function (activeSystem) {
		this.DGServer = this.systemList[activeSystem][0];
		this.DGUser = this.systemList[activeSystem][1];
		this.generatorAction('status', 'load');
	},

	generatorAction : function(attribute, value, action) {
		if(action == null || action == "") action = "generator";
		var thisObject = this;
		this.activeGeneratorEdit = null;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.DGServer,
			"DGMethod" : "POST",
			"DGAction" : action + "/" + this.generatorProfile + "@" + this.DGUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null)
					{
						openModalAlert("Invalid JSON object returned");
						return;
					}
					if(attribute == 'status')
						activeDGMonitors.get(thisObject.DGParentControl).updateSystemList();
				},
				'onComplete': function(transport) {
					thisObject.loadGeneratorDetails();
					getStage(thisObject.previewStage).reloadPage();
				}
		});
	},

	generatorStartAction : function(attribute, value, action) {
		if(action == null || action == "") action = "generator";
		var thisObject = this;
		this.activeGeneratorEdit = null;

		if(value == "started")
		{
			if(this.minimizeControlsOnStart)
			{
				var split = getPanel(this.parentStageID, this.parentWindowID, this.splitPane);
				split.dividerMove(1);
				split.minimizeFrame(false);
			}
			RaiseToTop(this.previewStage, "StatusReport");
		}

		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.DGServer,
			"DGMethod" : "POST",
			"DGAction" : action + "/" + this.generatorProfile + "@" + this.DGUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null)
					{
						alert("Invalid JSON object returned ");
						return;
					}
					if(attribute == 'status')
						activeDGMonitors.get(thisObject.DGParentControl).updateSystemList();
				},
				'onComplete': function(transport) {
					thisObject.loadGeneratorDetails();
				}
		});
	},

	loadGeneratorDetails : function() {
	    if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
	
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.DGServer,
			"DGMethod" : "GET",
			"DGAction" : "generator/" + this.generatorProfile + "@" + this.DGUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							alert("Invalid JSON object returned ");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if( isReturnCodeNotOK(result)) {
							if(Object.isString(result.returnValue))
								openModalAlert(result.returnValue);
							else if(Object.isString(result.returnValue.message))
								openModalAlert(result.returnValue.message);
							getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).updateRefreshTime(-1);
							return;
						}
						thisObject.generatorProfileDetails = result.returnValue;
						thisObject.drawGeneratorDetails();
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
	},
	
	drawGeneratorDetails : function() {
		var i = 0;
		
		if(this.generatorProfileDetails == null) return false;
		
		var generatorDetails = this.generatorProfileDetails;

		if(this.firstLoad && !this.microView)
		{
			this.firstLoad = false;
			if(this.compactView)
			{
				var layout = {
						type:"splitPane",
						direction:"v",
						name:this.splitPane,
						maxSize:200,
						allowResize:true,
						panelA: {
									type:"panel",
									name:this.masterControl,
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
					getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).loadLayout(layout, "Data Generator", null, 'hidden', menu);
			
					getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).hideAddressBar();
					
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
			else
			{
				var layout = {
						type:"splitPane",
						direction:"h",
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
										HasMenuBarContainer : TOP_TAB_TASK_BAR, 
										top                 : 0, 
										botton              : 0, 
										left                : 0,
										right               : 0,
										titleBarType        : NO_TITLE_BAR,
										windowOptionType    : NAV_BACK_BUTTON | NAV_FORWARD_BUTTON | NAV_RELOAD_BUTTON, 
										windowControlTypes  : NO_TITLE_BAR_OPTIONS,
										sizable             : WINDOW_IS_FULL
								}
					};
					
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).loadLayout(layout, "Data Generator", null, 'hidden', menu);
		
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).hideAddressBar();
			}
				
			var layout2 = ({
				target      : "StatusReport",
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
												"USE_CONNECTION" : getActiveDatabaseConnection(),
												"action" : "DGproxy",
												"returntype" : 'HTML',
												"DGSystemName" : this.DGServer,
												"DGMethod" : "GET",
												"DGAction" : "report/" + this.generatorProfileDetails['@attributes']['ID'] + "@" + this.DGUser
											}
										}
								}
				}
				});
  
			loadNewPageLayout(layout2);

			RaiseToTop(this.previewStage, "previewPanel");
		}

		var output = "";
		output += "<table valign='top'>";
		
		output += "<tr><td valign='top'  style='padding-left:" + (this.microView ? "5px;" : "30px;") + "'>";

		var menu = [];
		
		var mainControl = "<table width='100%' height='100%'><tr><td height='20px'>";

		if(generatorDetails['status']['@text'] != "stopped")
		{
			if(!this.microView) {
				var statusReportPanel = getPanel(this.previewStage, "StatusReport", "main");
				if(this.statusReportPanelReloadTime <= 0) this.statusReportPanelReloadTime = 1;
				if(statusReportPanel.refreshTimeOut == -1) statusReportPanel.updateReloadTime(this.statusReportPanelReloadTime);
			}

			if(generatorDetails['status']['@text'] == "stopping")
			{
				mainControl += "<img src='./images/stopping.png' style='width:50px;height:50px;'/>";
				menu = [];
			}
			else
			{
				mainControl += "<img src='./images/stop.png' style='width:50px;height:50px;' onclick=\"activeDGGeneratorMonitors.get('" + this.elementName + "').generatorAction('status', 'stop');\"/>";
				menu = [];
				menu.push({
					nodeType: "leaf",
					elementValue : "Stop",
					elementAction : "onclick=\"activeDGGeneratorMonitors.get('" + this.elementName + "').generatorAction('status', 'stop');\""
					});
			}
		}
		else
		{
			if(!this.microView)
			{
			    var statusReportPanel = getPanel(this.previewStage, "StatusReport", "main");
	            this.statusReportPanelReloadTime = statusReportPanel.refreshTimeOut;
			    statusReportPanel.updateReloadTime(-1);
			}

			mainControl += "<img src='./images/play.png' style='width:50px;height:50px;'  onclick=\"activeDGGeneratorMonitors.get('" + this.elementName + "').generatorStartAction('status', 'started');\"/>";
			menu = [];
			
			if(!this.microView)
			{
			    menu.push({
						nodeType: "leaf",
						elementValue : "Run",
						elementAction : "onclick=\"activeDGGeneratorMonitors.get('" + this.elementName + "').generatorStartAction('status', 'started');\""
					});
			}
		}

        mainControl += "</td></tr>";
		
		if(this.compactView)
		{
			mainControl += "<tr><td valign='bottom'><table style='width:100%;'>";
			mainControl += "<tr><td class='tableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"previewPanel\");'>Settings</td></tr>";
			mainControl += "<tr><td class='tableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"StatusReport\");'>Status Report</td></tr>";			
			mainControl += "</table></td></tr>";
			mainControl += "</table>";
			getPanel(this.parentStageID, this.parentWindowID, this.masterControl).setContent(mainControl);
		}
		else
		{	
			mainControl += "</table>";
			output += mainControl;	
		}

		output += "</td><td valign='" + (this.microView ? "center" : "top") + "' style='padding-left:" + (this.microView ? "5px;" : "30px;") + "'>";
		
		if(!this.microView) output += "<b>Details</b><br/>";
		
		var generator_title = null;
		var generator_description = null;
		if (generatorDetails['title'] != undefined)
		{
    		generator_title = generatorDetails['title']['@text'];
		} 
		else 
		{
    		generator_title = generatorDetails['@attributes']['ID'];
		}
		if (generatorDetails["description"] != undefined)
		{
		    generator_description = generatorDetails["description"]['@text'];
		}
		
		if(!this.microView)
		{
			output += "<tr><td>App Config</td>" + "<td><img onclick=\"activeDGGeneratorMonitors.get('" + this.elementName + "').loadAppConfig('" + generatorDetails['@attributes']['ID'] + "' );\" src='./images/fw_bold.gif' style='float:right;'/></td>";
			
			output += "<tr><td>Schema</td>" + "<td><img onclick=\"activeDGGeneratorMonitors.get('" + this.elementName + "').loadSchema('" + generatorDetails['@attributes']['ID'] + "' );\" src='./images/fw_bold.gif' style='float:right;'/></td>";
									
		}
		
		if(this.microView)
		{
			if(this.noTitleBar)
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, null, null, null, null);
			else
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).setContent(output, "<b>" + generator_title  + "</b>", generator_description, null, menu);
		}
		else if(this.compactView)
		{
			if(this.noTitleBar)
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, null, null, null, null);
			else
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, "Generator details for: <b>" + generator_title  + "</b> owned by: <b>" + generatorDetails['owner']['@text'] + "</b>", generator_description, null, menu);
			
		}
		else
		{
			if(this.noTitleBar)
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).setContent(output, null, null, null, null);
			else
				getPanel( this.parentStageID,this.parentWindowID, this.previewPanel).setContent(output, "Generator details for: <b>" + generator_title  + "</b> owned by: <b>" + generatorDetails['owner']['@text'] + "</b>", generator_description, null, menu);
		}

	},
	
	updateStatus: function(currentStatus) {
		if(this.generatorProfileDetails == null) 
		{
			this.reload();
		}
		else
		{
			if(currentStatus != this.generatorProfileDetails['status']['@text'].toLowerCase())
			{
				this.reload();
			}
		}
	},
	
	loadStatusReport : function(generatorName) {
		
		var statusReportPanel = getPanel(this.previewStage, "StatusReport", "main");
		
		if(statusReportPanel != null)
        	this.statusReportPanelReloadTime = statusReportPanel.refreshTimeOut;

		var layout = ({
			target      : "StatusReport",
			raiseToTop  :"",
			windowStage : this.previewStage,
			windowType  : CAN_NOT_CLOSE,
			content     : {
		 					type:"panel",
					        name:"main",
					        panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:1,timeOptions:[1,2,3,5,10,15,30,60]}},
					        overflow:"auto",
					        PrimaryContainer:true,
					        ContentType:"LINK",
					        data:{
									type:"ACTION",
									data:{
										parameters:{
											table:"WMD/metrics",
											action:"graphYUI",
											title:"Status report for: <b>" + generatorName  + "</b> owned by: <b>" + this.generatorProfileDetails['owner']['@text'] + "</b>",
											DGSystemName: this.DGServer,
											YAxisDegradation: 10,
											DGMethod: "GET",
											DGAction: "report/" + generatorName + "@" + this.DGUser,
											graphName : generatorName
										}
									}
					        }
			}
			});
		loadNewPageLayout(layout);
		
		statusReportPanel = getPanel(this.previewStage, "StatusReport", "main");
		
		if(statusReportPanel != null)
			statusReportPanel.updateReloadTime(this.statusReportPanelReloadTime);
	},
	
	loadAppConfig : function(generatorName) {
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.DGServer,
			"DGMethod" : "GET",
			"DGAction" : "appconfig/" + generatorName + "@" + this.DGUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'GET',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null)
					{
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>An invalid JavaScript object was returned</h2></td></tr></table>");
						return;
					}
					var layout = ({
						target      : "AppConfig",
						raiseToTop  :"",
						windowStage : thisObject.previewStage,
						title		: "App Config",
						content     : {
					 					type:"panel",
								        name:"main",
								        overflow:"auto",
								        ContentType:"RAW",
								        data: "<pre><code>" + result.returnValueRAW.escapeHTML() + "</code></pre>"
						}
						});
					loadNewPageLayout(layout);
					RaiseToTop(thisObject.previewStage, "AppConfig");
				}
		});
	},
	
	loadSchema : function(generatorName) {
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.DGServer,
			"DGMethod" : "GET",
			"DGAction" : "schema/" + generatorName + "@" + this.DGUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'GET',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null)
					{
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>An invalid JavaScript object was returned</h2></td></tr></table>");
						return;
					}
					var layout = ({
						target      : "Schema",
						raiseToTop  :"",
						windowStage : thisObject.previewStage,
						title		: "Schema",
						content     : {
					 					type:"panel",
								        name:"main",
								        overflow:"auto",
								        ContentType:"RAW",
								        data: "<pre><code>" + result.returnValueRAW.escapeHTML() + "</code></pre>"
						}
						});
					loadNewPageLayout(layout);
					RaiseToTop(thisObject.previewStage, "Schema");
				}
		});
	}

	
}));
