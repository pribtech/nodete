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
TABLE_MANIPULATION_MODULES.set("Developer_Menu", {
	
	
	//When present this object should return a menu JSON object to be added to the top right table menu bar
	panelLeftMenuObject: function(tableObject, menuArray) {
		if(IS_TOUCH_SYSTEM) return menuArray;
		if(!ALLOW_DEVELOPER_VIEW) return menuArray;
		
		var output = "<table width='500px'><tr><td>";
		
		output += "Reload table definition on reload: <input type='checkbox' onchange='TABLE_MANIPULATION_MODULES.get(\"Developer_Menu\").disableTableHistory(" + tableObject.GUID + ", this.checked);' " + (tableObject.baseTableData.forceDefinitionReload == true ? " checked " : "" ) + "/><br/>";
		
		output += "</td></tr></table>";
		
		var developerMenu = new floatingPanel(tableObject.elementUniqueID + '_Developer_Menu', 'RAW', output, tableObject.elementUniqueID + '_Developer_Menu_button', false, false);
		getPanel(tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID).registerNestedObject(tableObject.elementUniqueID + '_Developer_Menu', developerMenu);
		developerMenu.draw();

		
		menuArray.push({
				nodeType : "leaf",
				elementID : tableObject.elementUniqueID + '_Developer_Menu_button',
				elementValue : "Developer Options",
				elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + tableObject.elementUniqueID + '_Developer_Menu\').show_and_size(\'' + tableObject.elementUniqueID + '_Developer_Menu_button\');"'
		});
		return menuArray;
	},
	
	disableTableHistory: function(tableID, value) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if(tableObject != null) {
			tableObject.baseTableData.forceDefinitionReload = value;
		}
	}
});