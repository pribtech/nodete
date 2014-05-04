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
TABLE_MANIPULATION_MODULES.set("Core_Filter", {
	
	//When present this object should return a menu JSON object to be added to the top right table menu bar
	panelLeftMenuObject: function(tableObject, menuArray) {},
	
	cellMouse2DownMenuObject: function(tableObject, menuArray, rowNumber, columnType, columnName) {
		if(tableObject.baseTableData.detailedView == true || tableObject.baseTableData.localTableDeffinition.modules.filter === false || tableObject.baseTableData.isSummarized ) return menuArray;
		if(columnType == "column") {
			var columnObject = tableObject.baseTableData.components[columnType][columnName];
			if((columnObject.canDrill == null || columnObject.canDrill == true) && columnObject.localQueryDataType != DB2_BLOB && columnObject.localQueryDataType != DB2_CLOB) {
				var mask = null;
				var value = tableObject.baseTableData.baseData[rowNumber][columnObject.localQueryDataIndex];
				
				if(value == null && columnObject.nullMask != null)
					mask = columnObject.nullMask;
				else if(columnObject.mask != null )
					if(columnObject.mask[value] != null)
						mask = columnObject.mask[value];
				
				value = TABLE_COLUMN_RENDERING_MODULES.get("column").display_mask(value, mask, tableObject, rowNumber, columnObject);
				
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Filter on: '" + value + "'",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_Filter\").specificSearch(" + tableObject.GUID + ",\"" + rowNumber + "\",\"" + columnName + "\")'"
				});
			}
		}
		return menuArray;
	},

	cellMouse1DoubleClickAction: function(tableObject, rowNumber, columnType, columnName) {
		if(tableObject.baseTableData.localTableDeffinition.modules.filter === false) return;
		this.specificSearch(tableObject.GUID, rowNumber, columnName);
	},
	
	specificSearch: function(tableID, rowNumber, columnName) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var rootNode = tableObject.baseTableData.where;
		var columnObject = tableObject.baseTableData.components["column"][columnName];
		var searchValue = tableObject.baseTableData.baseData[rowNumber][columnObject.localQueryDataIndex];
		var SearchType = "=";
		
		if(searchValue != null) {
			if(columnObject.localQueryDataType == DB2_STRING)
				searchValue = "'" + searchValue + "'";
		} else {
			SearchType = "is";
			searchValue = "null";
		}
		
		var searchNode = {
								type: "value",
								column: columnName,
								compareType: SearchType,
								value: searchValue
							};
		windowHistoryItem = {
			type: WINDOW_HISTORY_ACTION_EVENT,
			action: ""
		};
		
		getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Filter\").applySortObject(" + tableObject.GUID + ", " + Object.toJSON(rootNode) + ", PUSH_HISTORY_FORWARDS)", true);		
							
		if(rootNode == null)
			tableObject.baseTableData.where = searchNode;	
		else {
			if(rootNode.type.toLowerCase() == "group") {
				if(rootNode.Operand.toLowerCase() == "and")
					tableObject.baseTableData.where.groupNodes.push(searchNode);
				else
					tableObject.baseTableData.where = {
									type:"group",
									Operand: "AND",
									groupNodes: [searchNode,rootNode]
								};
			} else 
				tableObject.baseTableData.where = {
								type:"group",
								Operand: "AND",
								groupNodes: [searchNode,rootNode]
							};
		}
		tableObject.retrieveTableData();
	},
	
	applySortObject: function(tableID, rootWhereNode, historyRecordStat) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		
		if(historyRecordStat == DO_NOT_RECORD_HISTORY)
			tableObject.baseTableData.where = rootWhereNode;
		else if(historyRecordStat == PUSH_HISTORY_FORWARDS) {
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToForwardHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Filter\").applySortObject(" + tableObject.GUID + ", " + Object.toJSON(tableObject.baseTableData.where) + ", PUSH_HISTORY_BACKWARDS)", false);
			tableObject.baseTableData.where = rootWhereNode;
		} else if(historyRecordStat == PUSH_HISTORY_BACKWARDS) {
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Filter\").applySortObject(" + tableObject.GUID + ", " + Object.toJSON(tableObject.baseTableData.where) + ", PUSH_HISTORY_FORWARDS)", false);
			tableObject.baseTableData.where = rootWhereNode;
		}
		tableObject.retrieveTableData();
	}
});