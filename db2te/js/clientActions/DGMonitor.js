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

var activeDGMonitors = $H();

CORE_CLIENT_ACTIONS.set("DGMonitor", Class.create(basePageElement, {
	initialize: function($super, callParameters) { 
		$super(callParameters.uniqueID, "DGMonitor");

				
		this.callParameters = callParameters;
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		this.compactView = callParameters.compactView;
		this.compactView = this.compactView == "true" || this.compactView == true ? true : false;
		
		this.generators = [];
		
		this.databaseConnection = [];
		
		this.menuPanel = "DGMenu" + getGUID();
		
		this.generatorPanel = "DGGenerator" +  getGUID();
		
		this.previewPanel = "DGPreviewPanel" + getGUID();
		
		this.previewStage = "DGPreviewStage" + getGUID();
		
		this.generatorStage = "DGGeneratorStage" + getGUID();
		
		this.splitPanel = "SplitPanel" + getGUID();
		
		activeDGMonitors.set(this.elementName, this);
		
		this.selectedGenerator = null;
		
		this.monitoredWMDSystem = null;
		
		this.forceUpdateOfAllOpenGenerators = false;
		
		this.reloadInProgress	= false;
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementName, this);
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = this.callBackText + '.reload()';
		
		this.draw();
		
	},
	
	reload: function() {
		this.forceUpdateOfAllOpenGenerators = true;
		this.updateSystemList();
	},
	
	destroy: function($super) {
		activeDGMonitors.unset(this.elementName);
		$super();
	},
	
	draw: function() {

		var layout = ({
						type:"splitPane",
						name:this.splitPanel,
						direction:"v",
						panelA: {
									type:"panel",
									name:this.generatorPanel,
									panelHeaders:{refreshEnabled:"true",refreshOptions:REFRESH_ON_NO_CONNECTION,scope:"local",autoRefreshControls:{time:-1,timeOptions:[2,3,5,10,15,30,60]}},
									overflow:"auto",
									PrimaryContainer:false,
									ContentType:"RAW",
									data:''
								},
							panelB: {
									type                :"stage",
									name                : this.generatorStage,
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
		if(!this.compactView)
		{
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
			
		parentPanel.loadLayout(layout, "Data Generator", null, 'hidden', menu);

		parentPanel.hideAddressBar();
		
		var generatorPanel = getPanel(this.parentStageID,this.parentWindowID,this.generatorPanel);
		if(generatorPanel != null)
		{
			generatorPanel.refreshType = "callback";
			generatorPanel.refreshCallback = this.callBackText + '.updateAvalibleUserGeneratorList()';
		}
		

		this.updateSystemList();
	},
	
	updateSystemList : function() {
		if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGSystemList",
			"returntype" : 'JSON'
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						var systemList = result.returnValue;
						if(systemList != null)
						{
							var output = "<nobr>Managing&nbsp;DG&nbsp;system&nbsp;<select onchange='" + thisObject.callBackText + ".setActiveSystem(this.value)'>";
							 
							var length = systemList.length;
							var i = 0;
							 
							if(thisObject.monitoredDGSystem == null && length > 0)
								thisObject.setActiveSystem(systemList[0][0]);
							 
							for(i=0; i<length; i++)
							{
								output += "<option " + (thisObject.monitoredDGSystem == systemList[i][0] ? "selected" : "") + " value='" + systemList[i][0] + "'>" + systemList[i][0] + "</option>";
							}
							 
							output += "</select></nobr>";
							 
							var systemListHolder = $(thisObject.elementUniqueID + "_ConnectionSelection");
							if(systemListHolder != null)
							{
								systemListHolder.update(output)	;
							}
						}
						thisObject.updateAvalibleUserGeneratorList();
						getPanel(thisObject.parentStageID,thisObject.parentWindowID,thisObject.generatorPanel).updateReloadTime(2);
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
		
	},
	
	setActiveSystem : function (activeSystem)
	{
		if(this.monitoredDGSystem != activeSystem)
			getStage(this.generatorStage).closeAllWindows();
		this.forceUpdateOfAllOpenGenerators = true;
		this.monitoredDGSystem = activeSystem;
		this.updateAvalibleUserGeneratorList();
	},
	
	updateAvalibleUserGeneratorList: function() {
		if(this.reloadInProgress) return;
	    this.reloadInProgress = true;
		var thisObject = this;
		
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.monitoredDGSystem,
			"DGMethod" : "GET",
			"DGAction" : "user/"
		};
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							openModalAlert("Invalid JSON object returned");
							getPanel(thisObject.parentStageID, thisObject.parentWindowID, thisObject.generatorPanel).updateReloadTime(-1);
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
						{
							initiateConnectionRefresh();
						}
						if(result.returnCode == "false")
						{
							if(Object.isString(result.returnValue))
							{
								openModalAlert(result.returnValue);
							}
							else if(Object.isString(result.returnValue.message))
							{
								openModalAlert(result.returnValue.message);
							}
							getPanel(thisObject.parentStageID, thisObject.parentWindowID, thisObject.generatorPanel).updateReloadTime(-1);
							return;
						}
						var userData = result.returnValue.user;
						if(userData != null)
						{
							thisObject.generators = [];
							if(Object.isArray(userData))
							{
								var length = userData.length;
								var i = 0;
								for(i=0; i<length; i++)
								{
									thisObject.extractGenerators(userData[i].generators.generator, userData[i]['@attributes'].ID);
								}
							}
							else 
							{
								thisObject.extractGenerators(userData.generators.generator, userData['@attributes'].ID);
							}
							thisObject.generators.sort(function(a, b){
								if(a[2] == b[2])
								{
									if(a[0] == b[0])
										return 0;
									else if(a[0] > b[0])
										return 1;
									return -1;
								} else if(a[2] > b[2])
									return 1;
								return -1;
							});
							thisObject.drawGenerator();
						}
				},
				'onComplete': function(transport) {
					thisObject.reloadInProgress	= false;
				}
		});
		
	},
	
	extractGenerators : function(generator, owner) {
		if(Object.isArray(generator))
		{
			var length = generator.length;
			var i = 0;
			for(i=0; i<length; i++)
			{
				this.generators.push([generator[i]['@attributes'].ID, generator[i]['@attributes'].status, owner]);
			}
		}
		else 
		{
			this.generators.push([generator['@attributes'].ID, generator['@attributes'].status, owner]);
		}
		
	},
	
	selectGenerator : function(event) {
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		if(!Event.isLeftClick(event)) return;
		var element = Event.element(event);
		if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0)
		{
			if(!element.tagName.toUpperCase() == 'TR' || !element.hasClassName('tableCellRoot'))
				element = Event.findElement(event, "tr.tableCellRoot");
			var returnInfo = stringSplit(element.id, /[.]/);
			
			var generatorName = returnInfo[2] + "." + returnInfo[3];
			if(this.selectedGenerator != null && this.selectedGenerator != generatorName)
			{
				$(this.elementName + ".DGGeneratorRow." + this.selectedGenerator).setStyle({ "backgroundColor" : this.oldSelectedGeneratorColor});
			}
			this.selectedGenerator = generatorName;
			var row = $(this.elementName + ".DGGeneratorRow." + this.selectedGenerator);
			this.oldSelectedGeneratorColor = row.getStyle("backgroundColor");
			row.setStyle({ "backgroundColor" : '#CCCCFF'});
			this.loadGeneratorDetails(returnInfo[2], returnInfo[3]);
		}
	},
	
	drawGenerator : function() {
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		var rowColor = "";
		var output = "<table onclick='" + this.callBackText + ".selectGenerator(event)' style='padding:0px;margin:0px;width:100%' cellpadding='0px' cellspacing='0px' >";
		var i = 0;
		var generatorWindow;
		var image = null;
		output += "<tr><td style='padding-left:5px;'>Name</td><td>Owner</td><td>Status</td><td></td></tr>";
		for(i=0; i<this.generators.length; i++)
		{
			rowColor = colorSet[i % 2];
			
			if(this.selectedGenerator == this.generators[i][0] + "." + this.generators[i][2])
			{
				this.oldSelectedGeneratorColor = rowColor;
				rowColor = '#CCCCFF';
			}
			
			switch(this.generators[i][1].toLowerCase())
			{
				case "unloaded":
					image = './images/status/WMD_off.png';
					break;
				case "stopped":
					image = './images/status/WMD_stopped.png';
					break;
				default:
					image = './images/status/WMD_play.png';
			}
			output += "<tr class='tableCellRoot' id='" + this.elementName + ".DGGeneratorRow." + this.generators[i][0] + "." + this.generators[i][2] + "' style='height:30px;background-color:" + rowColor + ";'><td style='padding-left:10px;'>" + this.generators[i][0] + "</td><td>" + this.generators[i][2] + "</td><td align='center'><img style='float:none;' src='" + image + "'/></td><td><img src='./images/fw_bold.gif'/></td><td><img src='./images/statusCritical.gif' onclick='"+ this.callBackText+".deleteGenerator(event, \""+this.generators[i][0]+"\",\""+this.generators[i][2]+"\")'/></td>";

			output += "</tr>";
			generatorWindow = activeDGMonitors.get(this.generatorStage + "_" + this.generators[i][0] + "_" + this.generators[i][2]);
			if(generatorWindow != null)
			{
				if(this.forceUpdateOfAllOpenGenerators)
					generatorWindow.reload();
				else
					generatorWindow.updateStatus(this.generators[i][1].toLowerCase());
			}
		}
		output += "</table>";
		this.forceUpdateOfAllOpenGenerators = false;
		getPanel(this.parentStageID, this.parentWindowID, this.generatorPanel).setContent(output);
	},

	deleteGenerator : function(event, generatorName, generatorUser) {
		var thisObject = this;
		var generatorWindow = getWindow(this.generatorStage, generatorName + "_" + generatorUser);
		if(generatorWindow != null)
		{
			generatorWindow.destroy();
		}
		var parameters = {		
			"USE_CONNECTION" : getActiveDatabaseConnection(),
			"action" : "DGproxy",
			"returntype" : 'JSON',
			"DGSystemName" : this.monitoredDGSystem,
			"DGMethod" : "DELETE",
			"DGAction" : "generator/" + generatorName + "@" + generatorUser
		};

		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,	
				'onSuccess': function(transport) {
					thisObject.updateAvalibleUserGeneratorList();
				},
				'onComplete': function(transport) {
				}
		});
		if(event != null)
			Event.stop(event);
		return false;
		
	},
	
	loadGeneratorDetails : function(generatorName, generatorUser) {
		var generatorWindow = getWindow(this.generatorStage, generatorName + "_" + generatorUser);
		
		if(generatorWindow == null)
		{
			loadNewPageLayout({
				"target":generatorName + "_" + generatorUser,
				"windowStage":this.generatorStage,
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
											action:"DGSingleGeneratorControl",
											callbackID: this.generatorStage + "_" + generatorName + "_" + generatorUser,
											DGServer:this.monitoredDGSystem,
											DGUser:generatorUser,
											DGGenerator: generatorName,
											DGParentControl: this.elementName,
											compactView: this.compactView
										}
									}
						}
				}
			});
			if(this.compactView)
				getPanel(this.parentStageID, this.parentWindowID, this.splitPanel).minimizeFrame(false);
		}
		else
		{
			RaiseToTop(this.generatorStage, generatorName + "_" + generatorUser);
		}
	}

}));
