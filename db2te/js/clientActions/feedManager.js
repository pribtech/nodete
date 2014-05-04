/*******************************************************************************
 *Copyright IBM Corp. 2007 All rights reserved.
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
var activeFeedManager = $H();

function reloadAllActiveFeedsManagers() {
	activeFeedManager.each(function(pair){
		pair.value.SourceFetcher();
	});	
}

CORE_CLIENT_ACTIONS.set("feedManager",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_" + getGUID(), "feedManager");
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		activeFeedManager.set(this.GUID, this);
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).registerNestedObject(this.elementUniqueID, this);
		
		this.sourceTableName = this.elementName + '_sourceTable';
		this.sourceDataTable = null;
		this.currentSelectedRow = null;
		this.draw();
		this.SourceFetcher();
	},

	selectRow: function(RowID)	{
		if(this.currentSelectedRow != RowID)  {
			var row = $(this.elementName + "_ActiveSourceList_" + this.currentSelectedRow);
			if(row != null) {
				var rowChildren = row.childElements();
				var numRowChildren = rowChildren.length;
				for(var i = 0; i < numRowChildren; i++)
					rowChildren[i].setStyle({'backgroundColor':'white'});
			}
		}
		this.currentSelectedRow = RowID;
		var row = $(this.elementName + "_ActiveSourceList_" + RowID);
		if(row != null) {
			var rowChildren = row.childElements();
			var numRowChildren = rowChildren.length;
			for(var i = 0; i < numRowChildren; i++)
				rowChildren[i].setStyle({'backgroundColor':'#CCCCFF'});
		}
	},

	runScript: function(elementNameSuffix,script) {
		if(this.currentSelectedRow == null || this.sourceDataTable == null) return;
		var tempParamObject = $H();
		tempParamObject.set('SOURCE_ID', this.currentSelectedRow);
		tempParamObject.set('SOURCE_TITLE', this.sourceDataTable[this.currentSelectedRow]['title']);
		tempParamObject.set('SOURCE_DESCRIPTION', this.sourceDataTable[this.currentSelectedRow]['description']);
		tempParamObject.set('SOURCE_LINK', this.sourceDataTable[this.currentSelectedRow]['link']);
		tempParamObject.set('SOURCE_ENABLED', (this.sourceDataTable[this.currentSelectedRow]['enabled']?"true":"false"));
		runTEScript(this.elementName + "_" + elementNameSuffix, GLOBAL_TE_SCRIPT_STORE.get(script), null, null, this.callBackText + ".actionCallback", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		return true;
	},
	
	removeSource: function() {
		return this.runScript("RemoveSourceScript", "FEED_REMOVE_SOURCE_SCRIPT");
	},

	createNewSource: function() {
		runTEScript(this.elementName + "_NewSourceScript", GLOBAL_TE_SCRIPT_STORE.get('FEED_NEW_SOURCE_DIALOG_SCRIPT'), null, null, this.callBackText + ".actionCallback", null, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		return true;
	},
	
	editSource: function() {
		this.runScript("EditSourceScript", "FEED_EDIT_SOURCE_DIALOG_SCRIPT");
	},
	
	actionCallback: function(returnStack) {
		if("true" == String(returnStack.actionReturnValue).toLowerCase()) {
			reloadAllActiveFeedsManagers();
			reloadAllActiveFeeds();
		}
	},
	
	SourceFetcher: function() {
		var thisObject = this;
			
		POSTDATA = new Object();
		POSTDATA.uniqueID 				= this.elementUniqueID;
		POSTDATA.stageID 				= this.parentStageID;
		POSTDATA.windowID 				= this.parentWindowID;
		POSTDATA.panelID 				= this.parentPanelID;
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.action				 	= "getFeedSources";
		
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result != null)
					thisObject.updateData(result.returnValue);
			},
			onComplete: function(transport) {
			}
		});
	},

	updateData: function (dataArray) {
		var rowSelectIndex = null;

		this.currentSelectedRow = null;
		var dataTable = $(this.elementName + "_ActiveSourceList");
		this.sourceDataTable = dataArray;
		if(dataTable != null && dataArray != null) {
			this.clearSourceList();
			var dataArray_Length = dataArray.length;
			if(dataArray_Length > 0) {
				for(var i = 0; i < dataArray_Length; i++) {
					tdAttributs = " ondblclick='" + this.callBackText + ".selectRow(" + i + ");" + this.callBackText + ".editSource();' onclick='" + this.callBackText + ".selectRow(" + i + ")' style='background-color:white;cursor: pointer;padding-left:5px;'";
					dataTable.insert({bottom:	"<tr id='" + this.elementName + "_ActiveSourceList_" + i + "'><td" + tdAttributs + ">" +
												"</td><td" + tdAttributs + ">" + dataArray[i]['title'] +
												"</td><td" + tdAttributs + ">" + dataArray[i]['description'] +
												"</td><td" + tdAttributs + ">" + dataArray[i]['link'] +
												"</td><td" + tdAttributs + ">" + (dataArray[i]['enabled']?"true":"false") +
												"</td></tr>"});
				}
			} else
				dataTable.update("<tr><td align='center'>No sources found</td></tr>");
		}
		if(rowSelectIndex == null)
			rowSelectIndex = 0;
		this.selectRow(rowSelectIndex);
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).size();
	},

	clearSourceList: function() {
		this.currentSelectedRow = null;
		var dataTable = $(this.elementName + "_ActiveSourceList");
		if(dataTable != null)
			dataTable.update("<tr><td></td><td ><b>Source&nbsp;Title&nbsp;</b></td><td><b>Description</b></td><td><b>Link</b></td><td><b>Enabled</b></td></tr>");
	},
	
	draw: function() {
		var sourceDataTable = this.sourceDataTable;
		var output = "<div style='width:700px;'>"
					+ 	"<table id='" + this.elementName + "_ActiveSourceList' style='width:100%;'cellspacing='0' >"
					+ 		"<td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td>"
					+ 	"</table>"
					+ "</div'>";
		menu = [
					{
						nodeType : "leaf",
						elementID : this.elementName+ "_newSource",
						elementValue : "New",
						elementAction : 'onclick="' + this.callBackText + '.createNewSource();"',
						elementSubNodes : null,
						elementSubNodeDirection : HORIZONTAL
					},
					{
						nodeType : "leaf",
						elementID : this.elementName+ "_editSource",
						elementValue : "Edit",
						elementAction : 'onclick="' + this.callBackText + '.editSource()"',
						elementSubNodes : null,
						elementSubNodeDirection : HORIZONTAL
					},
					{
						nodeType : "leaf",
						elementID : this.elementName+ "_removeSource",
						elementValue : "Remove",
						elementAction : 'onclick="' + this.callBackText + '.removeSource();"',
						elementSubNodes : null,
						elementSubNodeDirection : HORIZONTAL
					}
			];
			
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, 'Source manager', null, null, menu);
		
		this.clearSourceList();
	
	}
}));