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
var flowGroupList = $H();

function registerFlowGroup(aFlowGroup) {
	return flowGroupList.set(aFlowGroup.elementUniqueID, aFlowGroup);
}
function removeFlowGroup(flowName){
	return flowGroupList.unset(flowName);
}
CORE_CLIENT_ACTIONS.set("flowgroup", Class.create(basePageElement,{
	initialize: function($super, callParameters) {
		
		$super(callParameters.uniqueID + "_flowGroup", "FLOWGROUP");
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).registerNestedObject(this);
		
		this.filter = callParameters.filter;
		this.flowGroupTitle = callParameters.title;
		this.subFolder = callParameters.subFolder;
		this.currentMenuLocation = callParameters.CurrentMenuLocation;
		this.description = callParameters.description;
		this.articalTitle = callParameters.articalTitle;
		this.menuExpansionType = callParameters.menuExpansionType;
		this.listStyleType = callParameters.listStyleType;
		this.defaultPage = callParameters.defaultPage;
		this.reloadOnConnectionChange = (callParameters.reloadOnConnectionChange=="true");
		this.flowMenu = null;
		this.LOCAL_STAGE_VARIABLES = null;
		registerFlowGroup(this);
		this.draw();
	},
	
	destroy: function($super) {
		var localCloseScript = GLOBAL_TE_SCRIPT_STORE.get('TUTORIAL_CLOSE_SCRIPT');
		if(localCloseScript != "" && localCloseScript != null) {
			var TEScript = new actionScript(this.parentPageID + localCloseScript.name, localCloseScript, this.LOCAL_STAGE_VARIABLES, null, null, null, this.parentPageID, null, null);
			TEScript.callAction('', '', null, null);
		}
		removeFlowGroup(this.elementUniqueID);
		$super();
	},
	
	draw: function() {
		var layout = ({
					name:"FLOW_GROUP_" + this.elementUniqueID,
					type:"splitPane",
					direction:"v",
					maxSize:50,
					showSplitSpacer:true,
					allowResize:true,
					panelA: {
						type:"panel",
						name:"GROUPING_LIST",
						PrimaryContainer:true,
						overflow:"hidden",
						ContentType:"RAW",
						data:'<div id="title">' + this.flowGroupTitle + '</div>' +
								'<table style="width:100%; height:100%;" cellpadding="0" cellspacing="0" align="left">' +
								(this.description != null && this.description != "" ? '<tr><td  style="height:1px;padding:5px;" align="left" valign="top" >' + this.description + '</td></tr>' : "" ) +
								(this.articalTitle != null && this.articalTitle != "" ? '<tr><td  style="height:1px;padding:2px;" align="left" valign="top" ><h2>' + this.articalTitle + '</h2></td></tr>' : "" ) +
								'<tr><td align="left" valign="top" >' +
								'<table cellpadding="0" cellspacing="0" style="width:100%; height:100%;"><tr><td align="left" valign="top" style="padding:5px;background:#f5f5f5;" id="' + this.elementUniqueID + '_Body"></td></tr></table>' +
								'</td></tr></table>'
                    },
					panelB: {
							type                : "stage",
							name                : this.elementUniqueID + "_stage",
							HasMenuBarContainer : TOP_TAB_TASK_BAR, 
							top                 : 0, 
							botton              : 0, 
							left                : 0,
							right               : 0,
							titleBarType        : NO_TITLE_BAR,
							windowOptionType    : NAV_RELOAD_BUTTON | NAV_FORWARD_BUTTON | NAV_BACK_BUTTON, 
							windowControlTypes  : NO_TITLE_BAR_OPTIONS,
							sizable             : WINDOW_IS_FULL
			}});
		
		getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).loadLayout(layout);
		
		var parentStageObject = getStage(this.elementUniqueID + "_stage");
		if(parentStageObject != null)
			this.LOCAL_STAGE_VARIABLES = parentStageObject.LOCAL_STAGE_VARIABLES;

		if(this.LOCAL_STAGE_VARIABLES != null) {
			var currentTime = new Date();
			var schema = "GRP" + currentTime.getTime() + "_" + getGUID();
			this.LOCAL_STAGE_VARIABLES.set("SCHEMA", schema);
		}
		this.loadMenu();
	},
	
	loadMenu: function() {
		var thisObject = this;
		
		if(this.flowMenu != null) this.flowMenu.destroy();
		
		this.flowMenu = null;
		
		POSTDATA = new Object();
		POSTDATA.uniqueID 				= this.elementUniqueID;
		POSTDATA.stageID 				= this.parentStageID;
		POSTDATA.windowID 				= this.parentWindowID;
		POSTDATA.panelID 				= this.parentPanelID;
		POSTDATA.returntype 			= 'JSON';
		
		POSTDATA.baseMenuFolder			= this.currentMenuLocation + '/' + this.subFolder;
		POSTDATA.defaultStage 			= this.elementUniqueID + "_stage";
		POSTDATA.filterList 			= this.filter;
		POSTDATA.action				 	= "menu";
		
		new Ajax.Request(ACTION_PROCESSOR, {
				'parameters': POSTDATA,
				'method': 'post',
				'onCreate': function() {
					var contentArea = $(thisObject.elementUniqueID + '_Body');
					if (contentArea != null)
						contentArea.update("<table width='100%' height='100%'  cellspacing='0' cellpadding='0' align='center' valign='center'>" +
    										"<tr height='200px'><td align='center' id='" + thisObject.elementUniqueID + "_LoadingIconArea'><img style='float:none;' style='width:100%' src='images/loadingpage.gif'/></td></tr>" +
    										"<tr height='30px'><td><span><h1 id='" + thisObject.elementUniqueID + "_LoadingTitleArea'>Loading</h1></span></td></tr>" +
    										"<tr><td id='" + thisObject.elementUniqueID + "_LoadingInformationArea'></td></tr>" +
    										"</table>");
				},
				'onSuccess': function(transport) {
					var baseMenu = transport.responseJSON;
					thisObject.flowMenu = createContextMenu(thisObject.elementUniqueID + '_Body', baseMenu, VERTICAL, thisObject.parentStageID, thisObject.parentWindowID, "GROUPING_LIST", thisObject.menuExpansionType, thisObject.listStyleType, thisObject.reloadOnConnectionChange);
					thisObject.flowMenu.openFirstLink(thisObject.defaultPage);
					thisObject.size();
				},
				'onFailure': function(transport) {
					var contentArea = $(thisObject.elementUniqueID + '_Body');
					if (contentArea != null)
						contentArea.update(transport.responseText, "Error Loading Page");
				}
		});
	},
	
	size: function() {
		var container = $(this.elementUniqueID + '_Body');
		var flowGroupSplit = getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get("FLOW_GROUP_" + this.elementUniqueID);
		if(container != null && flowGroupSplit != null)
			flowGroupSplit.setFixedPanelSize(container.scrollWidth + 10);
	}
}));