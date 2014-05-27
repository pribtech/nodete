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
var ActiveFeeds = $H();

function reloadAllActiveFeeds() {
	ActiveFeeds.each(function(pair){
		pair.value.feedFetcher();
	});
}

CORE_CLIENT_ACTIONS.set("feedReader",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_" + getGUID(), "feedReader");
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		ActiveFeeds.set(this.GUID, this);
			
		this.parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		this.parentPanel.registerNestedObject(this.elementUniqueID, this);
		this.parentPanel.refreshType = "callBack";
		this.parentPanel.refreshCallback = this.callBackText + ".feedFetcher();";
		this.source = callParameters.source;

		this.draw();
	},
	
	destroy: function($super) {
		ActiveFeeds.unset(this.elementName);
		$super();
	},

	feedFetcher: function() {
		var thisObject = this;
		
		POSTDATA = new Object();
		POSTDATA.uniqueID 				= this.elementUniqueID;
		POSTDATA.stageID 				= this.parentStageID;
		POSTDATA.windowID 				= this.parentWindowID;
		POSTDATA.panelID 				= this.parentPanelID;
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.source				 = this.source;
		POSTDATA.action				 = "getFeedData";

		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				
				if(result == null) {
					thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>An invalid JavaScript object was returned</h2></td></tr></table>");
					return;
				}
				if(result.flagGeneralError == true && result.connectionError == true)
					initiateConnectionRefresh();
				if(result.flagGeneralError == true ||  isReturnCodeNotOK(result) ) {
					if(Object.isString(result.returnValue)) {
						thisObject.setError(getReturnMessageFormatted(result));
						return;
					}
					if(!thisObject.baseTableData.localTableDeffinition.ignoreSQLWarnings) {
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>" + result.returnValue.STMTMSG + "</h2></td></tr></table>");
						return;
					}
				}
				
				if(result != null) {
					thisObject.FeedsDataTable = result.returnValue;
					thisObject.updateData();
				}
			},
			
			'onException': function(transport,exception) {
				thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Exception while loading table data</h2>"+decodeURI(exception)+"</td></tr></table>");
			},
			
			'onFailure': function(transport) {
				if(transport.responseJSON!=null)
					if(transport.responseJSON.returnValue!=null) {
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+decodeURI(transport.responseJSON.returnValue)+"</h2></td></tr></table>");
						return;
					}
				thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error loading table data</h2></td></tr></table>");
			}
		});
	},
	
	setError: function(ErrorMSG) {
		var container = $(this.elementName + "_FeedList");
		if(container != null)
			container.update("<tr><td>" + ErrorMSG + "</td></tr>");
	},
	
 	toggleDetails: function(ID) {					
		var detailHolder = $(this.elementName + "_" + ID);
		var signHolder = $(this.elementName + "_" + ID + "_sign");
		
		if(detailHolder == null) return;

		if (!detailHolder.visible()) {
			detailHolder.show();
			if(signHolder != null)
				signHolder.src = 'images/minus.gif';
		} else {
			detailHolder.hide();
			if(signHolder != null)
				signHolder.src = 'images/plus.gif';
		}
	},

	updateData: function (displayType) {
		var dataTable = $(this.elementName + "_FeedList");
		if(dataTable == null) return;
		
		if(this.FeedsDataTable == null) {
			dataTable.update("<tr><td align='center'>No feeds found</td></tr>");
			return;
		}
		
		displayType = displayType != null ? displayType : 'default';
		displayType = displayType.toLowerCase();
		dataTable.update("");
		var FeedsBackColors = ['lightgrey', 'white'];
		var SourceColor = 0;
		var feedOutput = "";
		var sourceFeedListLength = this.FeedsDataTable.length;
		var storiesReturned = false;
		var j = 0;
		
		for(var i = 0; i < sourceFeedListLength; i++) {
			if(this.FeedsDataTable[i].items === null || !Object.isArray(this.FeedsDataTable[i].items)) continue;
			var numberOfStories = this.FeedsDataTable[i].items.length;
			if(this.FeedsDataTable[i].title != displayType && displayType != 'default' && displayType != 'all') continue;
			
			storiesReturned = true;
			SourceColor = (SourceColor+1)%2;
		
			dataTable.insert({bottom: "<tr style='background-color:" + FeedsBackColors[SourceColor] + "; cursor:pointer;' onclick=\"" + this.callBackText + ".toggleDetails('FeedList_" + i + "');\">" +
								"<td>" + "<img id='" + this.elementName + "_FeedList_"+ i +"_sign' src='images/plus.gif'>" +										
									"</td><td><b>" + (this.FeedsDataTable[i].title == null ? "No Source Info found" : this.FeedsDataTable[i].title) +
									"</b></td></tr>"});

			feedOutput = "<tr style='background-color:" + FeedsBackColors[SourceColor] + ";'><td colspan=\"2\"><div id='" + this.elementName + "_FeedList_"+ i +"' style='display:none; background-color:" + FeedsBackColors[SourceColor] + ";'><table cellpadding='2' cellspacing='0' style='margin: 0px; padding: 0px; width:100%; background-color:" + FeedsBackColors[SourceColor] + ";'>";
			for(j = 0; j < numberOfStories; j++) {
				feedOutput += "<tr style='background-color:" + FeedsBackColors[j%2] + "; cursor:pointer;' onclick=\"" + this.callBackText + ".toggleDetails('feedstory_" + i + "_" + j + "');\">" 
							+		"<td></td>"  
							+		"<td>" + "<img id='" + this.elementName + "_feedstory_" + i + "_" + j + "_sign' src='images/plus.gif'>" 
							+		"</td>" 
							+		"<td>" + (this.FeedsDataTable[i].items[j].dateDisplay != null ? this.FeedsDataTable[i].items[j].dateDisplay : "Unknown date") 
							+		"</td>" 
							+		"<td>" + (this.FeedsDataTable[i].items[j].title == null ? "no title" : this.FeedsDataTable[i].items[j].title) 
							+		"</td></tr>"
							+ "<tr style='background-color:" + FeedsBackColors[j%2] + ";'>" 
							+ 	"<td></td>"
							+ 	"<td></td>"  
							+ 	"<td colspan=\"2\"><div id='" + this.elementName + "_feedstory_" + i + "_" + j + "' style='display:none; background-color:" + FeedsBackColors[j%2] + ";'><table cellpadding='2' cellspacing='0' style='width:100%; background-color:" + FeedsBackColors[j%2] + ";'><tr><td>" + (this.FeedsDataTable[i].items[j].link != null ? "<a onclick='openURLonDefaultStageInIframe(\"" + this.FeedsDataTable[i].items[j].link + "\");'>" + this.FeedsDataTable[i].items[j].link +"</a>" : "" )
							+ 	"</td></tr><tr><td><table border='2' cellpadding='2'><tr><td>" + (this.FeedsDataTable[i].items[j].description != null ? this.FeedsDataTable[i].items[j].description : "") 
							+ 	"</td></tr></table></td></tr></table></div></td></tr>";
			}
			
			feedOutput += "</table></div></td></tr>";
			dataTable.insert({bottom: feedOutput});
		}
		if(!storiesReturned)
			dataTable.update("<tr><td align='center'>No news!</td></tr>");		
						
		this.parentPanel.setSize();
	},
	
	draw: function() {
		var menu = [];
		var output =  "<table id='" + this.elementName + "_FeedList' style='width:100%;' cellpadding='0' cellspacing='0' >"
					+	 "<tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>"
					+ "</table>";
		
		menu.push({
			nodeType : "leaf",
			elementID : this.elementName + "_FeedManager_button",
			elementValue : "Feed Manager",
			elementAction : "onClick=\"FLOATINGPANEL_activeFloatingPanels.get('" + this.elementName + "_FeedManager').show_and_size();\";" + this.callBackText + ".updateData();"
		});
		
		menu.push({
			nodeType : "leaf",
			elementID : this.elementName + "_refresh_button",
			elementValue : "Refresh Now",
			elementAction : 'onclick="' + this.callBackText + '.feedFetcher();"'
		});
		
		this.parentPanel.setContent(output, 'Feed Reader', null, null, menu);
				
		var feedManager = new floatingPanel(this.elementName + '_FeedManager', 'LINK', {'type':"ACTION", 'data':{'parameters':{'action':"feedManager"}}}, this.elementName + "_FeedManager_button", false, false);
		this.parentPanel.registerNestedObject(feedManager);
		feedManager.draw();
		this.feedFetcher();
	}
}));