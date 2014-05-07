/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *********************************************************************************/
TABLE_MANIPULATION_MODULES.set("ColumnHistory", {
	
	cellMouse1ClickAction: function(tableObject, rowNumber, columnType, columnName) {
		if(columnType != 'column') return;
		this.tableObject=tableObject;
		this.rowNumber=rowNumber;
		this.columnName=columnName;
		if(tableObject.baseTableData.history == null) return;
		if(tableObject.baseTableData.history.data.length == 0) return;
		var menuID = tableObject.GUID + "_ColumnHistory";
		tableObject.columnHistoryPanel = FLOATINGPANEL_activeFloatingPanels.get(menuID);
		if(tableObject.columnHistoryPanel==null) {
			tableObject.columnHistoryPanel = new floatingPanel(menuID, 'RAW', "", null , false, false);
			getPanel(tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID).registerNestedObject(menuID, tableObject.columnHistoryPanel);
			tableObject.columnHistoryPanel.refreshType="callback";
			tableObject.columnHistoryPanel.refreshCallback="TABLE_MANIPULATION_MODULES.get('ColumnHistory').draw()";
			tableObject.columnHistoryPanel.draw();
			tableObject.columnHistoryPanel.setContent(null, 'Column History', null, null);
		}
		this.tableObject.columnHistoryPanel.show_and_size();
		this.draw();
	},
	draw: function() {
		var columnObject = this.tableObject.baseTableData.components.column[this.columnName];
		var currentRow	= this.tableObject.baseTableData.baseData[this.rowNumber];
		var value=currentRow[columnObject.localQueryDataIndex];
		var columnObjectTimestamp = this.tableObject.baseTableData.components.column[this.tableObject.baseTableData.history.timestampColumn];
		var columnIndexTimestamp = this.tableObject.getColumnIndex(this.tableObject.baseTableData.history.timestampColumn);
		if(columnObjectTimestamp != null) {
			var timestampType = this.tableObject.baseTableData.columnsInfo.type[columnIndexTimestamp];
			var currentTime=currentRow[columnIndexTimestamp];
			if(timestampType='string') {
				if(currentTime.length>20)
					timestampType='timestamp';
				else
					timestampType='datetime';
			}
			var currentTime=currentTime.to(timestampType);
		}
		var output 	= "<table>"
					+ "<tr><th>Age</th><th>Value</th>"
					+ (columnObjectTimestamp == null ? "" : "<th>Time</th><th>Duration</th>" )
					+ (columnObject.isAccumulation ? "<th>Delta</th><th>Per Sec.</th>" : "")
					+ "</tr><tr><td>Current</td><td style='text-align:right;'>"+value+"</td>"
					+ (columnObjectTimestamp == null ? "" : "<td style='white-space: nowrap'>" + currentRow[columnIndexTimestamp] + "</td><td></td>" )
					+ (columnObject.isAccumulation ? "<td></td><td></td>" : "")
					+ "</tr>";
		var maxValue=value;
		var minValue=maxValue;
		var maxDiffNormalised=null;
		var minDiffNormalised=null;
		for(i = 0; i < this.tableObject.baseTableData.history.data.length; i++) {
			oldValue=value;
			oldRow=this.tableObject.findRow(currentRow,this.tableObject.baseTableData.history.data[i]);
			if(oldRow==null) {
				diff=null;
				value=null;
				lastTime=currentTime;
				diffTime=null;
			} else {
				value=oldRow[columnObject.localQueryDataIndex];
				if(value>maxValue) maxValue=value;
				if(value<minValue) minValue=value;
				if(columnObjectTimestamp != null) {
					lastTime=currentTime;
					currentTime=oldRow[columnIndexTimestamp].to(timestampType);
					diffTime=(lastTime-currentTime)/1000;
				}
				if(columnObject.isAccumulation) {
					diff=oldValue - value;
					diffNormalised=(diff/diffTime);
					if(maxDiffNormalised==null | diffNormalised>maxDiffNormalised) maxDiffNormalised=diffNormalised;
					if(minDiffNormalised==null | diffNormalised<minDiffNormalised) minDiffNormalised=diffNormalised;
				}
			}
			output +="<tr><td style='text-align:right;'>" + i + "</td><td style='text-align:right;'>" + value + "</td>"
					+ (columnObjectTimestamp == null ? "" : "<td>" + (oldRow==null?"":oldRow[columnIndexTimestamp]) + "</td><td style='text-align:right;'>" + diffTime + "</td>" )
					+ (columnObject.isAccumulation ? "<td style='text-align:right;'>" + diff + "</td><td style='text-align:right;'>" + (diffTime==null?"":diffNormalised.toFixed(1)) + "</td>" : "")
					+ "</tr>";
		}
		output += (columnObject.isAccumulation ? "<tr><td></td><td></td>" : "<tr><td style='text-align:right;'>Max:</td><td style='text-align:right;'>" + maxValue + "</td>" )
				+ (columnObjectTimestamp == null ? "" : "<td></td><td></td>" )
				+ (columnObject.isAccumulation ? "<td>Max:</td><td style='text-align:right;'>" + (maxDiffNormalised==null?"":maxDiffNormalised.toFixed(1)) + "</td>" : "")
				+ "</tr>"
				+ (columnObject.isAccumulation ? "<tr><td></td><td></td>" : "<tr><td style='text-align:right;'>Min:</td><td style='text-align:right;'>" + minValue + "</td>" )
				+ (columnObjectTimestamp == null ? "" : "<td></td><td></td>" )
				+ (columnObject.isAccumulation ? "<td>Min:</td><td style='text-align:right;'>" + (minDiffNormalised==null?"":minDiffNormalised.toFixed(1)) + "</td>" : "")
				+ "</tr>";
		output +="</table>";
		this.tableObject.columnHistoryPanel.setContent(output, 'History column: '+ (columnObject.title == null ? columnName : columnObject.title));
	}
});



	