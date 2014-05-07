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
TABLE_MANIPULATION_MODULES.set("Core_Sort",{

	columnHeaderInterface: function(displayColumn, tableObject) {
		if(tableObject.baseTableData.localTableDeffinition.modules.sort === false) return "";
		if(displayColumn == null) return "";
		if(tableObject.baseTableData.components[displayColumn.type] == null) return "";
		if(tableObject.baseTableData.components[displayColumn.type][displayColumn.name] == null) return "";
		var output = "";
		if(tableObject.baseTableData.components[displayColumn.type][displayColumn.name].sort_enable == true) {
			sortDirection = null;
			sortIndex = null;
			var i = 1;
			tableObject.baseTableData.orderBy.each(function(sortElement) { 
				if(sortElement.column == displayColumn.name && sortIndex == null) {
					sortDirection = sortElement.direction;
					sortIndex = i;
				}
				i++;
			});
			if(sortIndex == null)
				sortIndex = "";
			
			if(sortDirection != null)
				sortDirection = sortDirection.substr(0,1).toUpperCase();
			
			output += "<td style='width:10px'>"
					+	"<table cellpadding='0' cellspacing='0'>"
					+		"<tbody>"
					+			"<tr>"
					+				"<td style='width=30'>"
					+					"<table cellpadding='0' " +	(sortDirection == null ? " class='sort-Box-Blank' ": " class='sort-Box' ")
					+						"cellspacing='0'>"
					+						"<tbody><tr>"
					+							"<td title='Sort ascending' id='" + tableObject.elementUniqueID + "_ColumnSortUp_" + displayColumn.name + "'>"
					+							 	this.getImage(tableObject.GUID, displayColumn.name, "UP", (sortDirection == 'A'), sortIndex)		
					+							"</td>"
					+							"</tr><tr>"
					+							"<td title='Sort descending' id='" + tableObject.elementUniqueID + "_ColumnSortDown_" + displayColumn.name + "'>"
					+								this.getImage(tableObject.GUID, displayColumn.name, "DOWN", (sortDirection == 'D'), sortIndex)
					+							 "</td>"
					+							"</tr>"
					+						"</tbody>"
					+					"</table>"
					+				"</td>"
					+				"<td id='" + tableObject.elementUniqueID + "_ColumnSortIndex_" + displayColumn.name + "' class='sort-Index'>"
					+					sortIndex
					+ 				"</td>"
					+			"</tr>"
					+		"</tbody></table>"
					+ "</td>";
		}
		return output;
	},

	getImage: function(tableID, columnName, direction, enabled, index) {
		index = index == null || index == "" ? -1 : index;
		var sortDirection = "";
		var sortClass = "sort-";
		var sortStatus = enabled ? "true" : "false";
		if(direction.toUpperCase() == "UP") {
			sortDirection = "A";
			sortClass += "UP-";
		} else {
			sortDirection = "D";
			sortClass += "DOWN-";
		}
		sortClass += ( enabled ? "ENABLED" : "DISABLED" );
		return "<img class='" + sortClass + "' src='./images/spacer.gif' onclick='TABLE_MANIPULATION_MODULES.get(\"Core_Sort\").doSort(\"" + tableID + "\",\"" + columnName + "\",\"" + sortDirection + "\", " + sortStatus + ", " + index + ")'/>";
	},
	clearSortIndicators: function(tableObject) {
		var thisObject = this;
		
		tableObject.baseTableData.orderBy.each(function(sortElement) { 
			var upImage = $(tableObject.elementUniqueID + "_ColumnSortUp_" + sortElement.column);
			var downImage = $(tableObject.elementUniqueID + "_ColumnSortDown_" + sortElement.column);
			var sortIndex = $(tableObject.elementUniqueID + "_ColumnSortIndex_" + sortElement.column);
			if(upImage != null) upImage.update(thisObject.getImage(tableObject.GUID, sortElement.column, "UP", false, -1));
			if(downImage != null) downImage.update(thisObject.getImage(tableObject.GUID, sortElement.column, "DOWN", false, -1));
			if(sortIndex != null) sortIndex.update("");
		});	
	},
	
	setSortIndicators: function(tableObject) {
		var thisObject = this;
		var i = 1;
		var size = tableObject.baseTableData.orderBy.length;
		
		tableObject.baseTableData.orderBy.each(function(sortElement) { 
			var sortDirection = sortElement.direction.substr(0,1).toUpperCase() == "A" ? true : false;
			var upImage = $(tableObject.elementUniqueID + "_ColumnSortUp_" + sortElement.column);
			var downImage = $(tableObject.elementUniqueID + "_ColumnSortDown_" + sortElement.column);
			var sortIndex = $(tableObject.elementUniqueID + "_ColumnSortIndex_" + sortElement.column);
			if(upImage != null) upImage.update(thisObject.getImage(tableObject.GUID, sortElement.column, "UP", sortDirection, i));
			if(downImage != null) downImage.update(thisObject.getImage(tableObject.GUID, sortElement.column, "DOWN", !sortDirection, i));
			if(sortIndex != null && size > 1) sortIndex.update(i);
			i++;
		});	
	},
	
	applyOrderByObject: function(tableID, rootOrderByNode, historyRecordStat) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		this.clearSortIndicators(tableObject);
		
		if(historyRecordStat == DO_NOT_RECORD_HISTORY)
			tableObject.baseTableData.orderBy = rootOrderByNode;
		else if(historyRecordStat == PUSH_HISTORY_FORWARDS) {
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToForwardHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Sort\").applyOrderByObject(\"" + tableObject.GUID + "\", " + Object.toJSON(tableObject.baseTableData.orderBy) + ", PUSH_HISTORY_BACKWARDS)", false);
			tableObject.baseTableData.orderBy = rootOrderByNode;
		} else if(historyRecordStat == PUSH_HISTORY_BACKWARDS) {
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Sort\").applyOrderByObject(\"" + tableObject.GUID + "\", " + Object.toJSON(tableObject.baseTableData.orderBy) + ", PUSH_HISTORY_FORWARDS)", false);
			tableObject.baseTableData.orderBy = rootOrderByNode;
		}
		this.setSortIndicators(tableObject);
		tableObject.retrieveTableData();
	},
	
	doSort: function(tableID, columnName, direction, enabled, index) {
		tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		this.clearSortIndicators(tableObject);
		getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Sort\").applyOrderByObject(\"" + tableObject.GUID + "\", " + Object.toJSON(tableObject.baseTableData.orderBy) + ", PUSH_HISTORY_FORWARDS)", true);
		
		if(index == -1) {
			if(tableObject.baseTableData.orderBy == null)
				tableObject.baseTableData.orderBy = [];
			tableObject.baseTableData.orderBy.push({
				column:	columnName, 
				direction: direction
			});
		} else {
			if(tableObject.baseTableData.orderBy != null)
				if(!enabled)
					tableObject.baseTableData.orderBy[index-1].direction = direction;
				else
					tableObject.baseTableData.orderBy.splice(index-1,1);
		}

		this.setSortIndicators(tableObject);
		tableObject.retrieveTableData();
	},
	columnHeadMouse1DoubleClickAction: function(tableObject, columnType, columnName) {
		
		if(columnType != "column" || tableObject.baseTableData.localTableDeffinition.modules.sort === false) return;

		this.clearSortIndicators(tableObject);
		
		getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Sort\").applyOrderByObject(\"" + tableObject.GUID + "\", " + Object.toJSON(tableObject.baseTableData.orderBy) + ", PUSH_HISTORY_FORWARDS)", true);
		
		var haveSetSort = false;
		
		if(tableObject.baseTableData.orderBy != null)
			if(tableObject.baseTableData.orderBy.length == 1)
				if(tableObject.baseTableData.orderBy[0].column = columnName) {
					if(tableObject.baseTableData.orderBy[0].direction.substr(0,1).toUpperCase() == "A")
						tableObject.baseTableData.orderBy[0].direction = "D";
					else
						tableObject.baseTableData.orderBy[0].direction = "A";
					haveSetSort = true;
				}
		
		if(!haveSetSort)
			tableObject.baseTableData.orderBy = [{
				column:	columnName, 
				direction: "A"
			}];
		
		this.setSortIndicators(tableObject);
		tableObject.retrieveTableData();
	}
});