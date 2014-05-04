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
CORE_CLIENT_ACTIONS.set("TE_M_Form",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_ConnectionForm", "DBConnectionNewConnectionForm");
			
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.callParameters = callParameters;
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		
		if(parentPanel != null)
			parentPanel.registerNestedObject(this.elementUniqueID, this);
		this.draw();
	},
	
	draw: function() {
		var menu = [];
		var thisObject = this;
		var output =  '<div class="groupTableTitle">Connection selector </div>'
				+ '<span class="groupTableContent"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td style="vertical-align: bottom;">'
				+ "<table width=100% cellpadding='3px' style='position:static;padding-top:5px;'>"
				+ "<tbody>"
				+ 	'<tr><td align="left"><b>Save data in schema</b></td><td ><input type="text" style="width:25em;" name="METRICS_SCHEMA"value="PURESCALE"/></td></tr>'
				+ 	"<tr><td align='left'><b>Monitor database:</b></td><td >"
				+ 		"<select name='MONITOR_CONNECTION' type='text' style='width:30em;'>"
				+ 			"<OPTION selected value=\"\" ></OPTION>";
		var CONNECTION_MANAGER_CONNECTION_LIST_Length = CONNECTION_MANAGER_CONNECTION_LIST.length;
		if(CONNECTION_MANAGER_CONNECTION_LIST_Length > 0)
			for(var i = 0; i < CONNECTION_MANAGER_CONNECTION_LIST_Length; i++)
				if(CONNECTION_MANAGER_CONNECTION_LIST[i]['authenticated'])
					output += "<OPTION value=\"" + CONNECTION_MANAGER_CONNECTION_LIST[i]['description'] + "\" >" + CONNECTION_MANAGER_CONNECTION_LIST[i]['description'].escapeHTML() + "</OPTION>";

		output += 		"</select></td></tr>"
				+ 	"<tr><td align='left'><b>Store collected information in:</b></td><td >"
				+ 		"<select name='METRICS_CONNECTION' type='text' style='width:30em;'>"
				+ 			"<OPTION selected value=\"\" ></OPTION>";

		if(CONNECTION_MANAGER_CONNECTION_LIST_Length > 0)
			for(var i = 0; i < CONNECTION_MANAGER_CONNECTION_LIST_Length; i++)
				if(CONNECTION_MANAGER_CONNECTION_LIST[i]['authenticated'])
					output += "<OPTION value=\"" + CONNECTION_MANAGER_CONNECTION_LIST[i]['description'] + "\" >" + CONNECTION_MANAGER_CONNECTION_LIST[i]['description'].escapeHTML() + "</OPTION>";

		output += "</select></td></tr></tbody></table></td></tr></tbody></table></span>";
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		if(parentPanel != null)
			parentPanel.setContent(output, 'Connection selector', "");
	}
}));