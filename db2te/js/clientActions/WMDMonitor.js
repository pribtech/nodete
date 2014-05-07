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

var activeWMDMonitors = $H();

CORE_CLIENT_ACTIONS.set("WMDMonitor", Class.create(basePageElement, {
	initialize: function($super, callParameters) { 
		$super(callParameters.uniqueID, "WMDMonitor");
				
		this.callParameters = callParameters;
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		this.compactView = callParameters.compactView;
		this.compactView = this.compactView == "true" || this.compactView == true ? true : false;
		
		this.schedules = [];
		this.workloads = [];
		this.taskSets = [];
		this.databaseConnection = [];
		
		this.menuPanel = "WMDMenu" + getGUID();
		this.workloadPanel = "WMDWorkload" +  getGUID();
		this.previewPanel = "WMDPreviewPanel" + getGUID();
//		this.previewStage = "WMDPreviewStage" + getGUID();
		this.workloadStage = "WMDWorkloadStage" + getGUID();
		this.splitPanel = "SplitPanel" + getGUID();
		
		activeWMDMonitors.set(this.elementName, this);
		
		this.selectWorkload = null;
		this.selectSchedule = null;
		this.monitoredWMDSystem = null;
		
		this.forceUpdateOfAllOpenWorkloadProfiles = false;
		
		this.reloadInProgress	= false;
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementName, this);
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = this.callBackText + '.reload()';
		
		this.draw();
		
	},
	
	reload: function() {
		this.forceUpdateOfAllOpenWorkloadProfiles = true;
		this.updateSystemList();
	},
	
	destroy: function($super) {
		activeWMDMonitors.unset(this.elementName);
		$super();
	},
	
	draw: function() {
		var layout = ({
						type:"splitPane",
						name:this.splitPanel,
						direction:"v",
						panelA: {
									type:"panel",
									name:this.workloadPanel,
									panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[2,3,5,10,15,30,60]}},
									overflow:"auto",
									PrimaryContainer:false,
									ContentType:"RAW",
									data:''
								},
							panelB: {
									type                :"stage",
									name                : this.workloadStage,
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
		});
		if(!this.compactView) {
			layout.showSplitSpacer = true;
			layout.maxSize = 300;
		}
		var menu = [
				{
					nodeType: "leaf",
					elementValue : null,
					elementID : this.elementUniqueID + '_ConnectionSelection'
				}
			];
			
		var parentPanel = getPanel(this.parentStageID,this.parentWindowID,this.parentPanelID);
		parentPanel.loadLayout(layout, "Workload MultiUser Driver", null, 'hidden', menu);
		parentPanel.hideAddressBar();
		
		var workloadPanel = getPanel(this.parentStageID,this.parentWindowID,this.workloadPanel);
		if(workloadPanel != null) {
			workloadPanel.refreshType = "callback";
			workloadPanel.refreshCallback = this.callBackText + '.updateAvalibleUserWorkloadAndScheduleList()';
		}

		this.updateSystemList();
	},
	
	updateSystemList : function() {
		if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDSystemList",
			"returntype" : 'JSON'
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						var systemList = result.returnValue;
						if(systemList != null) {
							var output = "<nobr>Managing&nbsp;WMD&nbsp;system&nbsp;<select onchange='" + thisObject.callBackText + ".setActiveSystem(this.value)'>";
							var length = systemList.length;
							 
							if(thisObject.monitoredWMDSystem == null && length > 0)
								thisObject.setActiveSystem(systemList[0][0]);
							 
							for(var i=0; i<length; i++)
								output += "<option " + (thisObject.monitoredWMDSystem == systemList[i][0] ? "selected" : "") + " value='" + systemList[i][0] + "'>" + systemList[i][0] + "</option>";
							 
							output += "</select></nobr>";
							 
							var systemListHolder = $(thisObject.elementUniqueID + "_ConnectionSelection");
							if(systemListHolder != null)
								systemListHolder.update(output)	;
						}
						thisObject.updateAvalibleUserWorkloadAndScheduleList();
						getPanel(thisObject.parentStageID,thisObject.parentWindowID,thisObject.workloadPanel).updateReloadTime(2);
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
	},
	
	setActiveSystem : function (activeSystem) {
		if(this.monitoredWMDSystem != activeSystem)
			getStage(this.workloadStage).closeAllWindows();
		this.forceUpdateOfAllOpenWorkloadProfiles = true;
		this.monitoredWMDSystem = activeSystem;
		this.updateAvalibleUserWorkloadAndScheduleList();
	},
	
	updateAvalibleUserWorkloadAndScheduleList: function() {
		if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.monitoredWMDSystem,
			"WMDMethod" : "GET",
			"WMDAction" : "user/"
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null) {
							thisObject.setError("Update available user workload and schedule list invalid JSON object returned");
							getPanel(thisObject.parentStageID, thisObject.parentWindowID, thisObject.workloadPanel).updateReloadTime(-1);
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if(result.returnCode == "false") {
							if(Object.isString(result.returnValue))
								thisObject.setError("Update available user Workload and schedule list. "+result.returnValue);
							else if(Object.isString(result.returnValue.message))
								thisObject.setError("Update available user Workload and schedule list. " + result.returnValue.message);
							getPanel(thisObject.parentStageID, thisObject.parentWindowID, thisObject.workloadPanel).updateReloadTime(-1);
							return;
						}
						var userData = result.returnValue.user;
						if(userData != null) {
							thisObject.workloads = [];
							thisObject.schedules = [];
							if(Object.isArray(userData)) {
								var length = userData.length;
								for(var i=0; i<length; i++) 
									thisObject.extractWorkloads(userData[i].workloads.workload_profile, userData[i]['@attributes'].ID);
								for(var i=0; i<length; i++)
									if(userData[i].schedules!=null)
										thisObject.extractSchedules(userData[i].schedules.schedule_profile, userData[i]['@attributes'].ID);
							} else {
								thisObject.extractWorkloads(userData.workloads.workload_profile, userData['@attributes'].ID);
								if(userData.schedules!=null)
									thisObject.extractSchedules(userData.schedules.schedule_profile, userData['@attributes'].ID);
							}

							if (thisObject.schedules != null && thisObject.schedules != undefined && thisObject.schedules.length != 0) {
								thisObject.schedules.sort(function(a, b){
									return a[2] == b[2] ? ( a[0] == b[0] ? 0 : (a[0] > b[0] ? 1 : -1) )
											: (a[2] > b[2] ? 1 : -1 );
								});
							}

							thisObject.workloads.sort(function(a, b){
								return a[2] == b[2] ? ( a[0] == b[0] ? 0 : (a[0] > b[0] ? 1 : -1) )
													: (a[2] > b[2] ? 1 : -1 );
							});
							thisObject.drawWorkload();
						}
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
		
	},
	
	extractWorkloads : function(workload, owner) {
		if(Object.isArray(workload)) {
			for(var i=0; i<workload.length; i++)
				this.workloads.push([workload[i]['@attributes'].ID, workload[i]['@attributes'].status, owner]);
		}
		else 
			this.workloads.push([workload['@attributes'].ID, workload['@attributes'].status, owner]);
	},

	extractSchedules : function(schedule, owner) {
		if (schedule == null || schedule == undefined) return;
		if(Object.isArray(schedule)) {
			for(var i=0; i<schedule.length; i++)
				this.schedules.push([schedule[i]['@attributes'].ID, schedule[i]['@attributes'].status, owner]);
		} else 
			this.schedules.push([schedule['@attributes'].ID, schedule['@attributes'].status, owner]);
	},

	selectWorkLoad : function(event) {
		
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		if(!Event.isLeftClick(event)) return;
		var element = Event.element(event);
		if(CORE_MOUSE_DOWN_ACTIONS.keys().length != 0) return;
		if(!element.tagName.toUpperCase() == 'TR' || !element.hasClassName('tableCellRoot'))
			element = Event.findElement(event, "tr.tableCellRoot");
		var returnInfo = stringSplit(element.id, /[.]/);
		
		var workloadName = returnInfo[2] + "." + returnInfo[3];
		if(this.selectWorkload != null && this.selectWorkload != workloadName)
			$(this.elementName + ".WMDWorkloadRow." + this.selectWorkload).setStyle({ "backgroundColor" : this.oldSelectedWorkloadColor});
		this.selectWorkload = workloadName;
		var row = $(this.elementName + ".WMDWorkloadRow." + this.selectWorkload);
		this.oldSelectedWorkloadColor = row.getStyle("backgroundColor");
		row.setStyle({ "backgroundColor" : '#CCCCFF'});
		this.loadWorkloadDetails(returnInfo[2], returnInfo[3]);
	},

	selectScheduleFunction : function(event) {
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		if(!Event.isLeftClick(event)) return;
		var element = Event.element(event);
		if(CORE_MOUSE_DOWN_ACTIONS.keys().length != 0) return;
		if(!element.tagName.toUpperCase() == 'TR' || !element.hasClassName('tableCellRoot'))
			element = Event.findElement(event, "tr.tableCellRoot");
		var returnInfo = stringSplit(element.id, /[.]/);
		
		var scheduleName = returnInfo[2] + "." + returnInfo[3];
		if(this.selectSchedule != null && this.selectSchedule != scheduleName)
			$(this.elementName + ".WMDWorkloadRow." + this.selectSchedule).setStyle({ "backgroundColor" : this.oldSelectedWorkloadColor});
		this.selectSchedule = scheduleName;
		var row = $(this.elementName + ".WMDWorkloadRow." + this.selectSchedule);
		this.oldSelectedWorkloadColor = row.getStyle("backgroundColor");
		row.setStyle({ "backgroundColor" : '#CCCCFF'});
		this.loadScheduleDetails(returnInfo[2], returnInfo[3]);
	},
	
	drawWorkload : function() {
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		var rowColor = "";
		var output = "";
		if (this.schedules==undefined || this.schedules==null || this.schedules.length==0)
			output = "";
		else {
			output += "<table onclick='" + this.callBackText + ".selectScheduleFunction(event)' style='padding:0px;margin:0px;width:100%' cellpadding='0px' cellspacing='0px' >";
			var i = 0;
			var scheduleWindow;
			var image = null;
			output += "<tr><td style='padding-left:5px;'><h3>Schedule Name</h3></td><td>Owner</td><td>Status</td><td></td></tr>";
			for(i=0; i<this.schedules.length; i++) {
				rowColor = colorSet[i % 2];
				
				if(this.selectSchedule == this.schedules[i][0] + "." + this.schedules[i][2]) {
					this.oldSelectedWorkloadColor = rowColor;
					rowColor = '#CCCCFF';
				}
				
				switch(this.schedules[i][1].toLowerCase()) {
					case "unloaded":
						image = './images/status/WMD_off.png';
						break;
					case "stopped":
						image = './images/status/WMD_stopped.png';
						break;
					default:
						image = './images/status/WMD_play.png';
				}
				output += "<tr class='tableCellRoot' id='" + this.elementName + ".WMDWorkloadRow." + this.schedules[i][0] + "." + this.schedules[i][2] + "' style='height:30px;background-color:" 
						+ rowColor + ";'><td style='padding-left:10px;'>" + this.schedules[i][0] + "</td><td>" + this.schedules[i][2] 
						+ "</td><td align='center'><img style='float:none;' src='" + image 
						+ "'/></td><td><img src='./images/fw_bold.gif'/></td><td><img src='./images/statusCritical.gif' onclick='"
						+ this.callBackText+".deleteSchedule(event, \""+this.schedules[i][0]+"\",\""+this.schedules[i][2]+"\")'/></td>"
						+ "</tr>";
				
				scheduleWindow = activeWMDWorkloadMonitors.get(this.workloadStage + "_" + this.schedules[i][0] + "_" + this.schedules[i][2]);
				if(scheduleWindow != null) {
					if(this.forceUpdateOfAllOpenWorkloadProfiles)
						scheduleWindow.reload();
					else
						scheduleWindow.updateStatus(this.schedules[i][1].toLowerCase());
				}
			}
			output += "</table><br/>";
		}

		output += "<table onclick='" + this.callBackText + ".selectWorkLoad(event)' style='padding:0px;margin:0px;width:100%' cellpadding='0px' cellspacing='0px' >";
		var i = 0;
		var workloadWindow;
		var image = null;
		output += "<tr><td style='padding-left:5px;'><h3>Workload Name</h3><td>Owner</td><td>Status</td><td></td></tr>";
		for(var i=0; i<this.workloads.length; i++) {
			rowColor = colorSet[i % 2];
			
			if(this.selectWorkload == this.workloads[i][0] + "." + this.workloads[i][2]) {
				this.oldSelectedWorkloadColor = rowColor;
				rowColor = '#CCCCFF';
			}
			
			switch(this.workloads[i][1].toLowerCase()) {
				case "unloaded":
					image = './images/status/WMD_off.png';
					break;
				case "stopped":
					image = './images/status/WMD_stopped.png';
					break;
				default:
					image = './images/status/WMD_play.png';
			}
			output += "<tr class='tableCellRoot' id='" + this.elementName + ".WMDWorkloadRow." + this.workloads[i][0] + "." 
					+ this.workloads[i][2] + "' style='height:30px;background-color:" + rowColor + ";'><td style='padding-left:10px;'>" + this.workloads[i][0] + "</td><td>" + this.workloads[i][2] + "</td><td align='center'><img style='float:none;' src='" + image + "'/></td><td><img src='./images/fw_bold.gif'/></td><td><img src='./images/wmd_unload.png' onmouseover=\"this.src='./images/wmd_unload_over.png'\" onmouseout=\"this.src='./images/wmd_unload.png';\" onclick='"+ this.callBackText+".deleteWorkload(event, \""+this.workloads[i][0]+"\",\""+this.workloads[i][2]+"\")'/></td>"
					+ "</tr>";
			
			workloadWindow = activeWMDWorkloadMonitors.get(this.workloadStage + "_" + this.workloads[i][0] + "_" + this.workloads[i][2]);
			if(workloadWindow != null) {
				if(this.forceUpdateOfAllOpenWorkloadProfiles)
					workloadWindow.reload();
				else
					workloadWindow.updateStatus(this.workloads[i][1].toLowerCase());
			}
		}
		output += "</table>";
		this.forceUpdateOfAllOpenWorkloadProfiles = false;
		getPanel(this.parentStageID, this.parentWindowID, this.workloadPanel).setContent(output);
	},

	deleteWorkload : function(event, workloadName, workloadUser) {
		var thisObject = this;
		var workloadWindow = getWindow(this.workloadStage, workloadName + "_" + workloadUser);
		if(workloadWindow != null)
			workloadWindow.destroy();
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.monitoredWMDSystem,
			"WMDMethod" : "DELETE",
			"WMDAction" : "workload/" + workloadName + "@" + workloadUser
		};

		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					thisObject.updateAvalibleUserWorkloadAndScheduleList();
				},
				'onComplete': function(transport) {
				}
		});
		if(event != null)
			Event.stop(event);
		return false;
	},
	
	deleteSchedule : function(event, scheduleName, scheduleUser) {
		var thisObject = this;
		var scheduleWindow = getWindow(this.workloadStage, scheduleName + "_" + scheduleUser);
		if(scheduleWindow != null)
			scheduleWindow.destroy();
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "WMDproxy",
			"returntype" : 'JSON',
			"WMDSystemName" : this.monitoredWMDSystem,
			"WMDMethod" : "DELETE",
			"WMDAction" : "schedule/" + scheduleName + "@" + scheduleUser
		};

		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					thisObject.updateAvalibleUserWorkloadAndScheduleList();
				},
				'onComplete': function(transport) {
				}
		});
		if(event != null)
			Event.stop(event);
		return false;
	},
	
	loadWorkloadDetails : function(workloadName, workloadUser) {

		var workloadWindow = getWindow(this.workloadStage, workloadName + "_" + workloadUser);
		if(workloadWindow == null) {
			loadNewPageLayout({
				"target":workloadName + "_" + workloadUser,
				"windowStage":this.workloadStage,
				"raiseToTop":"y",
				"content":{
						type:"panel",
						name:this.previewPanel,
						PContentType:"LINK",
	        						PrimaryContainer:true,
							        data:{
									type:"ACTION",
									data:{
										parameters:{
											action:"WMDSingleWorkloadControl",
											callbackID: this.workloadStage + "_" + workloadName + "_" + workloadUser,
											WMDServer:this.monitoredWMDSystem,
											WMDUser:workloadUser,
											WMDWorkload: workloadName,
											WMDParentControl: this.elementName,
											compactView: this.compactView
										}
									}
						}
				}
			});
			if(this.compactView)
				getPanel(this.parentStageID, this.parentWindowID, this.splitPanel).minimizeFrame(false);
		} else 
			RaiseToTop(this.workloadStage, workloadName + "_" + workloadUser);
	},

	loadScheduleDetails : function(scheduleName, scheduleUser) {
		var scheduleWindow = getWindow(this.workloadStage, scheduleName + "_" + scheduleUser);
		if(scheduleWindow == null) {
			loadNewPageLayout({
				"target":scheduleName + "_" + scheduleUser,
				"windowStage":this.workloadStage,
				"raiseToTop":"y",
				"content":{
						type:"panel",
						name:this.previewPanel,
						PContentType:"LINK",
	        						PrimaryContainer:true,
							        data:{
									type:"ACTION",
									data:{
										parameters:{
											action:"WMDSingleScheduleControl",
											callbackID: this.workloadStage + "_" + scheduleName + "_" + scheduleUser,
											WMDServer:this.monitoredWMDSystem,
											WMDUser:scheduleUser,
											WMDSchedule: scheduleName,
											WMDParentControl: this.elementName,
											compactView: this.compactView
										}
									}
						}
				}
			});
			if(this.compactView)
				getPanel(this.parentStageID, this.parentWindowID, this.splitPanel).minimizeFrame(false);
		} else 
			RaiseToTop(this.workloadStage, scheduleName + "_" + scheduleUser);
	},
	
	setError : function(message) {
		getPanel(this.parentStageID, this.parentWindowID, this.workloadPanel).setContent("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+message+"</h2></td></tr></table>");
	}
}));
