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
TABLE_COLUMN_RENDERING_MODULES.set("action", {
	
	groupTitle: "Actions",
	
	columnCheck: function(baseTableObject, columnName) {
		var actionObject = baseTableObject.components.action[columnName];
		actionObject.title = actionObject.title == null ? "" : actionObject.title;
		actionObject.titleNoQuots = actionObject.title.replace("'", "&#39;").replace('"', "&quot;");
		if( baseTableObject.isSummarized ) actionObject.includeInSubMenu =  false;
		return true;
	},
		
	render: function(tableObject, rowToRender, actionObject, maskingColumn) {
		if(!isDatabaseConnectionVersion(actionObject)) return "";
		if( tableObject.baseTableData.isSummarized ) return "";
		maskingColumn = maskingColumn == null ? "" : maskingColumn;
		var icon = actionObject.icon != null ? actionObject.icon : "images/sout.gif";
		return "<img style='display:inline;float:none;' alt='&#8659;' title='" + actionObject.titleNoQuots + "' onclick='TABLE_COLUMN_RENDERING_MODULES.get(\"action\").load(event, \"" + tableObject.GUID + "\"," + rowToRender + ", \"" + actionObject.name + "\", \"" + maskingColumn + "\");' class='tableAction' border='0' src='" + icon + "'>";
	},
	
	load: function(event, TableID, rowToRender, actionObjectName, maskingColumn) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', TableID);
		if(tableObject == null) return false;
		var actionScriptObject = null;
		var blockData = $H();
		blockData.set("$tableObject",tableObject);
		if(tableObject.baseTableData.localTableDeffinition.useConnectWithTag != null)
			blockData.set('useConnectWithTag', tableObject.baseTableData.localTableDeffinition.useConnectWithTag);
		
		$H(tableObject.baseTableData.resultSetIndexByColumnName).each(function(node) {
			blockData.set(node.key,tableObject.baseTableData.baseData[rowToRender][node.value]);
		});
		
		if(maskingColumn == "")
			actionScriptObject = tableObject.baseTableData.components.action[actionObjectName];
		else
			actionScriptObject = TABLE_COLUMN_RENDERING_MODULES.get('column').getObject("action", maskingColumn, rowToRender, tableObject);
	
		var TEScriptMain = new actionScript(tableObject.baseTableData.tableName + '_' + actionScriptObject.name, actionScriptObject.actionScript , null, tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID, tableObject.parentPageID);
		TEScriptMain.callAction(blockData, '', '', null);
		
		if(event)
			Event.stop(event);
		return false; 
	},
	
	getDisplayClass : function(refernceObject) {
		return "table-Object";
	}
});