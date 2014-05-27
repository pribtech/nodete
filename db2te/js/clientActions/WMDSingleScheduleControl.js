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

CORE_CLIENT_ACTIONS.set("WMDSingleScheduleControl", Class.create(basePageElement, {
	initialize: function($super, callParameters) { 
		var myID = callParameters.uniqueID;
		if(callParameters.callbackID != null)
			myID = callParameters.callbackID;
		$super(myID, "WMDSingleScheduleControl");

		this.callParameters = callParameters;
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		this.minimizeControlsOnStart = callParameters.minimizeControlsOnStart;
		if(this.minimizeControlsOnStart == null || this.minimizeControlsOnStart != "true" || this.minimizeControlsOnStart == false)
			this.minimizeControlsOnStart = false;
		else
			this.minimizeControlsOnStart = true;
		
		this.fullView = true;
		this.compactView = callParameters.compactView == "true" || callParameters.compactView == true ? true : false;
		this.noTitleBar = callParameters.noTitleBar == "true" || callParameters.noTitleBar == true ? true : false;		
		this.microView = false;//callParameters.microView == "true" || callParameters.microView == true ? true : false;
		
		if (this.microView || this.compactView) {
			this.fullView = false;
			if(this.microView) 
				this.compactView = false;
		}			
		this.firstLoad = true;
		this.currentWorkloadName = null;
		this.isScheduleSequential = false;
		this.reloadInProgress = false;
		this.scheduleProfile = callParameters.WMDSchedule;
		this.scheduleProfileDetails = null;
		this.WMDParentControl = callParameters.WMDParentControl;
		this.WMDServer = callParameters.WMDServer;
		this.WMDUser = callParameters.WMDUser;
		this.workloadProfilePanelReloadTime = 1;

		this.previewStage = "WMDPreviewStage" + getGUID();
		this.splitPane = "WMDSplitPane" + getGUID();
		this.previewPanel = "WMDPreviewPanel" + getGUID();
		this.masterControl = "WMDMasterControl" + getGUID();
		
		activeWMDWorkloadMonitors.set(this.elementName, this);
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementName, this);
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = 'activeWMDWorkloadMonitors.get("' + this.elementName + '").reload()';
		
		this.reload();
	},
	
	reload: function() {
		if(this.reloadInProgress) return;
		if(this.WMDServer == null) {
			this.selectWMDSystem();
			return;
		}
		this.scheduleAction('status', 'load');
		this.loadScheduleDetails();
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
							var output = "Select the WMD server to run the schedule";
							var length = thisObject.systemList.length;
							
							if(length == 0) {
								output = "<table style='width:100%;height:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'>" + output + "</td></tr></table>";
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).setContent(output, "Workload MultiUser Driver", null, 'hidden');
								getPanel(thisObject.parentStageID,thisObject.parentWindowID, thisObject.parentPanelID).hideAddressBar();
							} else if(length == 1) {
								thisObject.setActiveSystem(0);
							} else if(length > 1) {
								for(var i=0; i<length; i++) {
									output += "<br/><button onclick='activeWMDWorkloadMonitors.get(\"" + thisObject.elementName + "\").setActiveSystem(this.value)' value='" + i + "'>" + thisObject.systemList[i][0] + "</button>";
								}
								 
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
		this.scheduleAction('status', 'load');
	},

	scheduleAction : function(attribute, value, action) {
		if(action == null || action == "") action = "schedule";
		var thisObject = this;
		this.activeScheduleEdit = null;
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "POST",
			"WMDAction" : action + "/" + this.scheduleProfile + "@" + this.WMDUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Schedule action invalid JSON object returned");
						return;
					}
					if(attribute == 'status') 
						activeWMDMonitors.get(thisObject.WMDParentControl).updateSystemList();
				},
				'onComplete': function(transport) {
					thisObject.loadScheduleDetails();
					getStage(thisObject.previewStage).reloadPage();
				}
		});
	},

	scheduleStartAction : function(attribute, value, action) {
		if(action == null || action == "") action = "schedule";
		var thisObject = this;
		this.activeScheduleEdit = null;

		if(value == "started") {
			if(this.minimizeControlsOnStart) {
				var split = getPanel(this.parentStageID, this.parentWindowID, this.splitPane);
				split.dividerMove(1);
				split.minimizeFrame(false);
			}
			//RaiseToTop(this.previewStage, "WorkloadProfile");
		}

		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "POST",
			"WMDAction" : action + "/" + this.scheduleProfile + "@" + this.WMDUser
		};
		parameters["POST[" + attribute + "]"] = value;
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						thisObject.setError("Schedule start action invalid JSON object returned ");
						return;
					}
					if(attribute == 'status')
						activeWMDMonitors.get(thisObject.WMDParentControl).updateSystemList();
				},
				'onComplete': function(transport) {
					thisObject.loadScheduleDetails();
				}
		});
	},

	loadScheduleDetails : function() {
	    if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
	
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.WMDServer,
			"WMDMethod" : "GET",
			"WMDAction" : "schedule/" + this.scheduleProfile + "@" + this.WMDUser
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null) {
							thisObject.setError("Load schedule details invalid JSON object returned ");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if( isReturnCodeNotOK(result)) {
							getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).updateRefreshTime(-1);
							return;
						}
						thisObject.scheduleProfileDetails = result.returnValue;
						thisObject.drawScheduleDetails();
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
	},
	
	drawScheduleDetails : function() {
		if(this.scheduleProfileDetails == null) return false;
		var i = 0;
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		var rowColor = "";
		var scheduleDetails = this.scheduleProfileDetails;

		if(this.firstLoad && !this.microView) {
			this.firstLoad = false;
			if(this.compactView) {
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
									//panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[1,2,3,5,10,15,30,60]}},
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
					//getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).hideAddressBar();
					
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
					
			} else {
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
//									panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[1,2,3,5,10,15,30,60]}},
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
					
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).loadLayout(layout, "Workload MultiUser Driver", null, 'hidden', menu);
				//getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).hideAddressBar();
			}

			var layout3 = ({
				target      : "WorkloadProfile",
				raiseToTop  :"",
				windowStage : this.previewStage,
				windowType  : CAN_NOT_CLOSE,
				title		: "Current Workload",
				content     : {
								type:"panel",
								name:"main",
						        panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[1,2,3,5,10,15,30,60]}},
								overflow:"auto",
								PrimaryContainer:true,
								ContentType:"LINK",
								data:""
							}
				});
			loadNewPageLayout(layout3);
			RaiseToTop(this.previewStage, "previewPanel");
		}

		var menu = [];
		var output = "<table valign='top'>"
					+ "<tr><td valign='top'  style='padding-left:" + (this.microView ? "5px;" : "30px;") + ";padding-right:" + (this.fullView ? "30px;" : "0px;") + "'>";

		var mainControl = "<table width='100%'>"
						+ "<tr><td height='20px'>";
		if(scheduleDetails['status']['@text'] != "stopped") {
			if(!this.microView) {
				var workloadProfilePanel = getPanel(this.previewStage, "WorkloadProfile", "main");
				if(this.workloadProfilePanelReloadTime <= 0) this.workloadProfilePanelReloadTime = 1;
				if(workloadProfilePanel.refreshTimeOut == -1) workloadProfilePanel.updateReloadTime(this.workloadProfilePanelReloadTime);
			}

			if(scheduleDetails['status']['@text'] == "stopping") 
				mainControl += "<img src='./images/stopping.png' style='width:50px;height:50px;'/>";
			else {
				mainControl += "<img src='./images/stop.png' style='width:50px;height:50px;' onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').scheduleAction('status', 'stop');\"/>";
				menu.push({
					nodeType: "leaf",
					elementValue : "Stop",
					elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').scheduleAction('status', 'stop');\""
					});
			}
		} else {
			if(!this.microView) {
			    var workloadProfilePanel = getPanel(this.previewStage, "WorkloadProfile", "main");
	            this.workloadProfilePanelReloadTime = workloadProfilePanel.refreshTimeOut;
			    workloadProfilePanel.updateReloadTime(-1);
			}

			mainControl += "<img src='./images/play.png' style='width:50px;height:50px;'  onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').scheduleStartAction('status', 'started');\"/>";
			
			if(!this.microView) {
			    menu.push({
						nodeType: "leaf",
						elementValue : "Run",
						elementAction : "onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').scheduleStartAction('status', 'started');\""
					});
			}
		}

		// add job list to main control
		if (this.compactView) 
			mainControl += this.getMainControl(scheduleDetails);

		mainControl += "</td></tr></table>";
		if(this.compactView) {
			getPanel(this.parentStageID, this.parentWindowID, this.masterControl).setContent(mainControl, scheduleDetails['@attributes']['ID']);
		} else 	
			output += mainControl;	

		output += this.getScheduleDetails(scheduleDetails);

		var schedule_title = null;
		var schedule_description = null;
		if (scheduleDetails['title'] != undefined) {
    		schedule_title = scheduleDetails['title']['@text'];
		} else  {
    		schedule_title = scheduleDetails['@attributes']['ID'];
		}
		if (scheduleDetails["description"] != undefined) {
		    schedule_description = scheduleDetails["description"]['@text'];
		}

		if(this.microView) {
			if(this.noTitleBar) {
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, null, null, null, null);
			} else {
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).setContent(output, "<b>" + schedule_title  + "</b>", schedule_description, null, menu);
			}
		} else if(this.compactView) {
			if(this.noTitleBar) {
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, null, null, null, null);
			} else {
				getPanel(this.previewStage,"previewPanel", this.previewPanel).setContent(output, "Schedule details for: <b>" + schedule_title  + "</b> owned by: <b>" + scheduleDetails['owner']['@text'] + "</b>", schedule_description, null, menu);
				getPanel(this.parentStageID,this.parentWindowID, this.previewPanel).setContent(output, "Schedule details for: <b>" + schedule_title  + "</b> owned by: <b>" + scheduleDetails['owner']['@text'] + "</b>", schedule_description, null, menu);
			}
		} else {
			if(this.noTitleBar) {
				getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).setContent(output, null, null, null, null);
			} else {
				getPanel( this.parentStageID,this.parentWindowID, this.previewPanel).setContent(output, "Schedule details for: <b>" + schedule_title  
					+ "</b> owned by: <b>" + scheduleDetails['owner']['@text'] + "</b>", schedule_description, null, menu);
			}
		}
		if (scheduleDetails['status']['@text'] != "started") {
			this.currentWorkloadName = null;			
		} else {
			if (this.currentWorkloadName != null && this.isScheduleSequential) 
				this.selectCurrentWorkload(this.currentWorkloadName);
		}
	},
	
	getScheduleDetails : function(scheduleProfileDetails) {
		var i = 0;
		var image = null;
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		var rowColor = "";
		var scheduleDetails = scheduleProfileDetails;
		var thisOutput = "</td><td valign='" + (this.microView ? "center" : "top") + "'>"	
						+	 "<b>Schedule Details</b><br/>"
						+ 	"<table>";

		var wait_time = scheduleDetails['schedule_attributes']['wait']['@attributes']['value'] == "null" ? "disabled" : scheduleDetails['schedule_attributes']['wait']['@attributes']['value'];
		var error_stop = scheduleDetails['schedule_attributes']['error_stop']['@attributes']['value'] == "null" ? "undefined" : scheduleDetails['schedule_attributes']['error_stop']['@attributes']['value'];
		var start_at = scheduleDetails['schedule_attributes']['start_at']['@attributes']['value'] == "null" ? "disabled" : scheduleDetails['schedule_attributes']['start_at']['@attributes']['value'];
		var stop_at = scheduleDetails['schedule_attributes']['stop_at']['@attributes']['value'] == "null" ? "disabled" : scheduleDetails['schedule_attributes']['stop_at']['@attributes']['value'];
		var cron = scheduleDetails['schedule_attributes']['cron']['@attributes']['value'] == "null" ? "disabled" : scheduleDetails['schedule_attributes']['cron']['@attributes']['value'];
		var thisScheduleType = scheduleDetails['schedule_type']['@attributes']['value'];

		if (thisScheduleType.toLowerCase() == "sequential") 
			this.isScheduleSequential = true;

		thisOutput += 		"<tr><td>Schedule Type: </td><td>" + thisScheduleType + "</td></tr>"
					+		"<tr><td>Delay For: </td><td>" + wait_time + "</td></tr>"
					+		"<tr><td>Stop On Error: </td><td>" + error_stop + "</td></tr>"
					+		"<tr><td>Start At: </td><td>" + start_at + "</td></tr>"
					+		"<tr><td>Stop At: </td><td>" + stop_at + "</td></tr>"
					+		"<tr><td>Cron Schedule: </td><td>" + cron + "</td></tr>"
					+	"</table>"
					+ "</td>"
					+ "<td valign='top' style='padding-left:30px;'><b>Jobs</b><br/>";

		var workloadColumnTitle = "Distributed Workload";
		if (scheduleDetails['schedule_type']['@attributes']['value'] != "distributed") 
			workloadColumnTitle = "Workload";

		thisOutput += "<table style='padding:0px;margin:0px;width:100%' cellpadding='0px' cellspacing='0px'><tr><td>Status&nbsp;</td><td>&nbsp;Name&nbsp;</td><td>&nbsp;Details&nbsp;</td>"
					+	"<td>&nbsp;" + workloadColumnTitle + "&nbsp;</td></tr>";
		
		var numberOfJobs =  scheduleDetails['job_list']['job'].length == undefined ? 1 : scheduleDetails['job_list']['job'].length;
		if (numberOfJobs == 1) {
			rowColor = colorSet[0 % 2];
			image = this.getStatusImage(scheduleDetails['job_list']['job']['@attributes']['status']);
			switch(scheduleDetails['job_list']['job']['@attributes']['status'].toLowerCase()) {
				case "unloaded":
				case "stopped":
					break;
				default:
					this.currentWorkloadName = scheduleDetails['job_list']['job']['workload']['@attributes']['value'];
			}
			thisOutput += "<tr style='background-color:" + rowColor + ";'><td><img style='float:none;' src='" + image + "'/></td><td>" + scheduleDetails['job_list']['job']['@attributes']['id'] + "</td><td><img onclick=\"activeWMDWorkloadMonitors.get('"
						+	this.elementName + "').loadJobDetails('" + scheduleDetails['job_list']['job']['@attributes']['id'] + "');\" src='./images/fw_bold.gif' style='float:left;'/></td>"
						+ "<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').selectWorkload('" 
						+	scheduleDetails['job_list']['job']['workload']['@attributes']['value'] + "');\" src='./images/fw_bold.gif' style='float:left;'/></td></tr>";
						
			// if distributed, show servers
			if (scheduleDetails['schedule_type']['@attributes']['value'] == "distributed") {
				if (scheduleDetails['job_list']['job']['url_list'] != undefined) {
					thisOutput += "<tr><td></td><td valign='top' colspan='3'><table width='100%'>";
					var numberOfUrls =  scheduleDetails['job_list']['job']['url_list']['url'].length == undefined ? 1 : scheduleDetails['job_list']['job']['url_list']['url'].length;
					if (numberOfUrls == 1) {
						image = this.getStatusImage(scheduleDetails['job_list']['job']['url_list']['url']['@attributes']['server_status']);
						thisOutput += "<tr><td>" + scheduleDetails['job_list']['job']['url_list']['url']['@attributes']['address'] + "</td>"
									+	"<td><img style='float:right;' src='" + image + "'/></td></tr>";
					} else {
						for(j=0; j < numberOfUrls; j++) {
							image = this.getStatusImage(scheduleDetails['job_list']['job']['url_list']['url'][j]['@attributes']['server_status']);
							thisOutput += "<tr><td>" + scheduleDetails['job_list']['job']['url_list']['url'][j]['@attributes']['address'] + "</td>"
										+ 	"<td><img style='float:right;' src='" + image + "'/></td></tr>";
						}
					}
					thisOutput += "</table></td></tr>";
				}
			}
			
		} else {
			for(i=0; i < numberOfJobs; i++) {
				rowColor = colorSet[i % 2];
				image = this.getStatusImage(scheduleDetails['job_list']['job'][i]['@attributes']['status']);
				switch(scheduleDetails['job_list']['job'][i]['@attributes']['status'].toLowerCase()) {
					case "unloaded":
					case "stopped":
						break;
					default:
						this.currentWorkloadName = scheduleDetails['job_list']['job'][i]['workload']['@attributes']['value'];
				}
				thisOutput += "<tr style='background-color:" + rowColor + ";'><td><img style='float:none;' src='" + image + "'/></td><td>" + scheduleDetails['job_list']['job'][i]['@attributes']['id'] + "</td><td><img onclick=\"activeWMDWorkloadMonitors.get('"
							+		this.elementName + "').loadJobDetails('" + scheduleDetails['job_list']['job'][i]['@attributes']['id'] + "');\" src='./images/fw_bold.gif' style='float:left;'/></td>"
							+ 	"<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').selectWorkload('"  
							+		scheduleDetails['job_list']['job'][i]['workload']['@attributes']['value'] + "');\" src='./images/fw_bold.gif' style='float:left;'/></td></tr>";

				// if distributed, show servers
				if (scheduleDetails['schedule_type']['@attributes']['value'] == "distributed") {
					if (scheduleDetails['job_list']['job'][i]['url_list'] != undefined) {
						thisOutput += "<tr><td></td><td valign='top' colspan='3'><table width='100%'>";
						var numberOfUrls =  scheduleDetails['job_list']['job'][i]['url_list']['url'].length == undefined ? 1 : scheduleDetails['job_list']['job'][i]['url_list']['url'].length;
						if (numberOfUrls == 1) {
							image = this.getStatusImage(scheduleDetails['job_list']['job'][i]['url_list']['url']['@attributes']['server_status']);
							thisOutput += "<tr><td>" + scheduleDetails['job_list']['job'][i]['url_list']['url']['@attributes']['address'] + "</td>"
										+	"<td><img style='float:right;' src='" + image + "'/></td></tr>";
						} else {
							for(j=0; j < numberOfUrls; j++) {
								image = this.getStatusImage(scheduleDetails['job_list']['job'][i]['url_list']['url'][j]['@attributes']['server_status']);
								thisOutput += "<tr><td>" + scheduleDetails['job_list']['job'][i]['url_list']['url'][j]['@attributes']['address'] + "</td>"
											+	"<td><img style='float:right;' src='" + image + "'/></td></tr>";
							}
						}
						thisOutput += "</table></td></tr>";
					}
				}
			}
		}
		thisOutput += "</table>";
		return thisOutput;
	},
	
	getStatusImage : function(status) {
		switch(status.toLowerCase()) {
			case "unloaded":
				return './images/status/WMD_off.png';
			case "stopped":
				return './images/status/WMD_stopped.png';
			default:
				return './images/status/WMD_play.png';
			}
	},
	
	getMainControl : function(scheduleProfileDetails) {
		var image = null;
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		var rowColor = "";
		var scheduleDetails = scheduleProfileDetails;
		var workloadColumnTitle = "Distributed Workload";
		if (scheduleDetails['schedule_type']['@attributes']['value'] != "distributed") 
			workloadColumnTitle = "Workload";

			// put a button link for schedule details
		var thisOutput =  "</td></tr><tr><td>&nbsp;</td></tr>"
						+ "<tr><td align='center' class='scheduleTableCellButton' onclick='RaiseToTop(\"" + this.previewStage + "\", \"previewPanel\");'>Settings</td></tr>"
						+ "<tr><td>&nbsp;</td></tr></table>"
						+ "<table style='padding:0px;margin:0px;width:100%' cellpadding='0px' cellspacing='0px'>"
						+	"<tr><th>Status&nbsp;</th><th>Name&nbsp;</th><th>Details&nbsp;</th><th>" + workloadColumnTitle + "&nbsp;</th></tr>";

			// info for all jobs
		var numberOfJobs =  scheduleDetails['job_list']['job'].length == undefined ? 1 : scheduleDetails['job_list']['job'].length;
		if (numberOfJobs == 1) {
			rowColor = colorSet[0 % 2];
			image = this.getStatusImage(scheduleDetails['job_list']['job']['@attributes']['status']);
			switch(scheduleDetails['job_list']['job']['@attributes']['status'].toLowerCase()) {
				case "unloaded":
				case "stopped":
					break;
				default:
					this.currentWorkloadName = scheduleDetails['job_list']['job']['workload']['@attributes']['value'];
			}
		thisOutput += "<tr style='background-color:" + rowColor + ";'><td><img style='float:none;' src='" + image + "'/></td><td>" + scheduleDetails['job_list']['job']['@attributes']['id'] + "</td>"
					+	"<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadJobDetails('" + scheduleDetails['job_list']['job']['@attributes']['id']  
					+ 		"');\" src='./images/fw_bold.gif' style='float:left;'/></td>"
					+ "<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').selectWorkload('"  
					+		scheduleDetails['job_list']['job']['workload']['@attributes']['value'] + "');\" src='./images/fw_bold.gif' style='float:left;'/></td></tr>";
			} else {
				for(var i=0; i < numberOfJobs; i++) {
					rowColor = colorSet[i % 2];
					image = this.getStatusImage(scheduleDetails['job_list']['job'][i]['@attributes']['status']);
					switch(scheduleDetails['job_list']['job'][i]['@attributes']['status'].toLowerCase()) {
						case "unloaded":
						case "stopped":
							break;
						default:
							this.currentWorkloadName = scheduleDetails['job_list']['job'][i]['workload']['@attributes']['value'];
					}
					thisOutput += "<tr style='background-color:" + rowColor + ";'><td><img style='float:none;' src='" + image + "'/></td><td>" + scheduleDetails['job_list']['job'][i]['@attributes']['id'] + "</td>"
								+ "<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').loadJobDetails('" + scheduleDetails['job_list']['job'][i]['@attributes']['id']  
								+		"');\" src='./images/fw_bold.gif' style='float:left;'/></td>"
								+ "<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').selectWorkload('"  
								+		scheduleDetails['job_list']['job'][i]['workload']['@attributes']['value'] + "');\" src='./images/fw_bold.gif' style='float:left;'/></td></tr>";
				}
			}
		return thisOutput;
	},
	
	getJobDetails : function(job) {
		output ="";
		if (this.compactView) 
			output += "<tr><td colspan='6'><b>Details for Schedule Job: " + job['@attributes']['id'] + "</b></td></tr>";
			
		output += "<tr><td>&nbsp;</td><td>"+( job['url_list'] != undefined ? "Distributed" : "" )+" Workload: </td>"
				+	"<td>&nbsp;</td><td>" + job['workload']['@attributes']['value'] + "</td><td>&nbsp;</td>" 
				+	"<td><img onclick=\"activeWMDWorkloadMonitors.get('" + this.elementName + "').selectWorkload('" 
				+		job['workload']['@attributes']['value'] + "');\" src='./images/fw_bold.gif' style='float:right;'/></td></tr>";

		if (job['connection'] != undefined)
			output += "<tr><td>&nbsp;</td><td>Connection: </td><td>&nbsp;</td><td>" + job['connection']['@attributes']['value'] + "</td></tr>";
		if (job['task'] != undefined)
			output += "<tr><td>&nbsp;</td><td>Task Set: </td><td>&nbsp;</td><td>" + job['task']['@attributes']['value'] + "</td></tr>";
		if (job['start_at'] != undefined) 
			output += "<tr><td>&nbsp;</td><td>Start At: </td><td>&nbsp;</td><td>" + job['start_at']['@attributes']['value'] + "</td></tr>";
		if (job['stop_at'] != undefined)
			output += "<tr><td>&nbsp;</td><td>Stop At: </td><td>&nbsp;</td><td>" + job['stop_at']['@attributes']['value'] + "</td></tr>";
		if (job['run_limiter'] != undefined) 
			output += "<tr><td>&nbsp;</td><td>Limit Run To: </td><td>&nbsp;</td><td>" + job['run_limiter']['@attributes']['value'] + "</td></tr>";
		if (job['cron'] != undefined)
			output += "<tr><td>&nbsp;</td><td>Cron Schedule: </td><td>&nbsp;</td><td>" + job['cron']['@attributes']['value'] + "</td></tr>";
		if (job['wait'] != undefined) 
			output += "<tr><td>&nbsp;</td><td>Delay For: </td><td>&nbsp;</td><td>" + job['wait']['@attributes']['value'] + "</td></tr>";
		if (job['url_list'] != undefined) {
			output += "<tr><td colspan='4'><table>";
			var numberOfUrls =  job['url_list']['url'].length == undefined ? 1 : job['url_list']['url'].length;
			if (numberOfUrls == 1) {
				image = this.getStatusImage(job['url_list']['url']['@attributes']['server_status']);
				output += "<tr><td>&nbsp;</td><td>&nbsp;</td><td>" + job['url_list']['url']['@attributes']['address'] + "</td>"
						+ 	"<td>&nbsp;</td><td><img style='float:none;' src='" + image + "'/></td></tr>";
			} else {
				for(var j=0; j < numberOfUrls; j++) {
					image = this.getStatusImage(job['url_list']['url'][j]['@attributes']['server_status']);
					output += "<tr><td>&nbsp;</td><td>&nbsp;</td><td>" + job['url_list']['url'][j]['@attributes']['address'] + "</td>"
							+	 "<td>&nbsp;</td><td><img style='float:none;' src='" + image + "'/></td></tr>";
				}
			}
			output += "</table></td></tr>";
		}
		return output;
	},
	
	loadJobDetails : function(jobName) {
		var jobFound = false;
		var image = null;

		var scheduleDetails = this.scheduleProfileDetails;
		var numberOfJobs =  scheduleDetails['job_list']['job'].length == undefined ? 1 : scheduleDetails['job_list']['job'].length;
		var output = "<table style='padding:0px;margin:0px;' cellpadding='0px' cellspacing='0px' >";
		if (numberOfJobs == 1) {
			if (scheduleDetails['job_list']['job']['@attributes']['id'] == jobName) {
				jobFound = true;
				output+=getJobDetails(scheduleDetails['job_list']['job']);
			} 
		} else {
			for(var i=0; i < numberOfJobs; i++) {
				if (scheduleDetails['job_list']['job'][i]['@attributes']['id'] == jobName) {
					jobFound = true;
					output+=getJobDetails(scheduleDetails['job_list']['job'][i]);
				}
			}
		}
		if (!jobFound) {
			thisObject.setError("Schedule job '" + jobName + "' could not be found");
			return;
		}
		
		output += "</table>";

		var jobDetailsPanel = getPanel(this.previewStage, "WorkloadProfile", "main");
		var layout3 = ({
			target      : "JobDetails",
			raiseToTop  :"",
			windowStage : this.previewStage,
			windowType  : NORMAL,
			content     : {
							type:"panel",
							name:"main",
							windowOptionType:NAV_RELOAD_BUTTON, 
							overflow:"auto",
							PrimaryContainer:true,
							ContentType:"LINK",
							data:""
						}
			});

		loadNewPageLayout(layout3);
		jobDetailsPanel = getPanel(this.previewStage, "JobDetails", "main");
		jobDetailsPanel.setContent(output, "Job details for: <b>" + jobName + "</b>", null, null, null);
		RaiseToTop(this.previewStage, "JobDetails");
	},
	
	selectCurrentWorkload : function(workloadName) {
		var workloadProfilePanel = getPanel(this.previewStage, "WorkloadProfile", "main");
		
		if(workloadProfilePanel != null)
        	this.workloadProfilePanelReloadTime = workloadProfilePanel.refreshTimeOut;
		
		var layout3 = ({
				target      : "WorkloadProfile",
				title		: "Current Workload",
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

												"action":"WMDSingleWorkloadControl",
												"callbackID": this.previewStage + "_WorkloadProfile",
												"WMDServer":this.WMDServer,
												"WMDUser":this.WMDUser,
												"WMDWorkload": workloadName,
												"WMDParentControl": this.elementName,
												"compactView": !this.compactView
											}
										}
								}
					}
				});
  
		loadNewPageLayout(layout3);
		workloadProfilePanel = getPanel(this.previewStage, "WorkloadProfile", "main");
		if(workloadProfilePanel != null) 
			workloadProfilePanel.updateReloadTime(this.workloadProfilePanelReloadTime);
	},
	
	selectWorkload : function(workloadName) {
		var workloadProfilePanel = getPanel(this.previewStage, "WorkloadProfile", "main");
		if(workloadProfilePanel != null)
        	this.workloadProfilePanelReloadTime = workloadProfilePanel.refreshTimeOut;

		var targetName = "SelectedWorkloadProfile";
        if(!this.isScheduleSequential) 
			targetName = "WorkloadProfile";

		var layout3 = ({
				target      : targetName,
				title		: workloadName,
				raiseToTop  :"",
				windowStage : this.previewStage,
				windowType  : NORMAL,
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

												"action":"WMDSingleWorkloadControl",
												"callbackID": this.previewStage + "_WorkloadProfile",
												"WMDServer":this.WMDServer,
												"WMDUser":this.WMDUser,
												"WMDWorkload": workloadName,
												"WMDParentControl": this.elementName,
												"compactView": !this.compactView
											}
										}
								}
					}
				});
  
		loadNewPageLayout(layout3);
		workloadProfilePanel = getPanel(this.previewStage, "WorkloadProfile", "main");
		if(workloadProfilePanel != null)
			workloadProfilePanel.updateReloadTime(this.workloadProfilePanelReloadTime);
		RaiseToTop(this.previewStage, targetName);
	},
	
	setError : function($super,message) {
		$super("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+message+"</h2></td></tr></table>");
	},
		
	updateStatus: function(currentStatus) {
		if(this.scheduleProfileDetails == null) 
			this.reload();
		else 
			this.loadScheduleDetails();
	}
	
}));
