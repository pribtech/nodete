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
TABLE_MANIPULATION_MODULES.set("Integrated_PageSwitcher", {
	
	//When present this object should return a menu JSON object to be added to the top right table menu bar
	generateText: function(tableObject) {
		var rowsPerPage 		= parseInt(tableObject.baseTableData.maxResultsToFetch);
		var startingRow			= parseInt(tableObject.baseTableData.fetchResultsAfterRow);
		var totalRowsInResult 	= tableObject.baseTableData.totalRows;
		var rowsPrinted 		= parseInt(tableObject.baseTableData.rowsReturned);
		var endFound = true;
		
		var rowString = "<a onclick='TABLE_MANIPULATION_MODULES.get(\"Integrated_PageSwitcher\").resultsPerPageSelector(" + tableObject.GUID + ");Event.stop(event);'>View&nbsp;results&nbsp;</a>";
			rowString += "<select onchange='TABLE_MANIPULATION_MODULES.get(\"Integrated_PageSwitcher\").moveTablePage(" + tableObject.GUID + ", this.value, PUSH_HISTORY_BACKWARDS)'>";
	
		if(!Object.isNumber(totalRowsInResult) || !Object.isString(totalRowsInResult)) {
//			endFound = totalRowsInResult.endFound;
			endFound =(totalRowsInResult<rowsPerPage+startingRow);
			totalRowsInResult = totalRowsInResult.rowsFound;
		} else
			totalRowsInResult = parseInt(totalRowsInResult);

		if(startingRow >= 0) {
			var tmprowString = "";
			var nowStartingHere = startingRow;
			for(i = 0; i < 4 && nowStartingHere > 0; i++) {
				nowStartingHere = nowStartingHere - rowsPerPage;
				nowStartingHere = nowStartingHere > 0 ? nowStartingHere : 0 ;

				tmprowString = "<option value='" + nowStartingHere + "'>" + (nowStartingHere+1 )+ " to "+(nowStartingHere + rowsPerPage) + "</option>" + tmprowString;
			}
			if(nowStartingHere > 0) {
				nowStartingHere = nowStartingHere - rowsPerPage;
				nowStartingHere = nowStartingHere > 0 ? nowStartingHere : 0 ;
				if(nowStartingHere == 0)
					tmprowString = "<option value='" + nowStartingHere + "'>" + (nowStartingHere+1) + " to " + (nowStartingHere + rowsPerPage) + "</option>" + tmprowString;
				else
					tmprowString = "<option value='" + (nowStartingHere + rowsPerPage) + "'> ...." + (nowStartingHere + rowsPerPage) + "</option>" + tmprowString;
			}
			rowString += tmprowString;
		}

		rowString += "<option SELECTED>"+(rowsPrinted == 0?"0" : (startingRow + 1) + " to " + ( startingRow + rowsPrinted) ) + "</option>";

		if(rowsPrinted >= rowsPerPage) {
			var nowStartingHere = startingRow + rowsPerPage;
			for(i = 0; i < 4 && nowStartingHere < totalRowsInResult; i++) {
				nextStartingHere = nowStartingHere + rowsPerPage;
				rowString += "<option value='" + nowStartingHere + "'>" + (nowStartingHere+1) + " to " + (nextStartingHere > totalRowsInResult && !endFound ? "..." : nextStartingHere) + "</option>";
				nowStartingHere = nextStartingHere;
			}
			if(nowStartingHere < totalRowsInResult) {
				nextStartingHere = nowStartingHere + rowsPerPage;
				nextStartingHere = nextStartingHere < totalRowsInResult ? "...." : " to " + totalRowsInResult ;

				rowString += "<option value='" + nowStartingHere + "'>" + (nowStartingHere+1) + nextStartingHere + "</option>";
				nowStartingHere = nextStartingHere;
			}
		}
		return rowString + "</select>";
	},
	
	moveTablePage: function(tableID, startingPoint, historyRecordStat) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		
		if(historyRecordStat == DO_NOT_RECORD_HISTORY)
			tableObject.baseTableData.fetchResultsAfterRow = parseInt(startingPoint);
		else if(historyRecordStat == PUSH_HISTORY_FORWARDS) {
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToForwardHistory("TABLE_MANIPULATION_MODULES.get(\"Integrated_PageSwitcher\").moveTablePage(" + tableObject.GUID + ", " + tableObject.baseTableData.fetchResultsAfterRow + ", PUSH_HISTORY_BACKWARDS)", true);
			tableObject.baseTableData.fetchResultsAfterRow = parseInt(startingPoint);
		} else if(historyRecordStat == PUSH_HISTORY_BACKWARDS) {
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Integrated_PageSwitcher\").moveTablePage(" + tableObject.GUID + ", " + tableObject.baseTableData.fetchResultsAfterRow + ", PUSH_HISTORY_FORWARDS)", true);
			tableObject.baseTableData.fetchResultsAfterRow = parseInt(startingPoint);
		}
		tableObject.retrieveTableData();
	},
	
	resultsPerPageSelector: function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var baseRowFetchNum = tableObject.baseTableData.baseMaxResultsToFetch;
		var pageSpread = [0.5, 1, 1.5, 2.5, 4, 6.5, 10.5];
		var pageSpreadLength = pageSpread.length;
		var i = 0;
		var currentPageNum = 0;
		var basemenu = [{
									nodeType: 'LEAF',
									elementValue: 'Row Per Page:',
									elementAction: "return;"
								}];
								
		for(i=0; i < pageSpreadLength; i++) {
			currentPageNum = Math.floor(baseRowFetchNum* pageSpread[i]);
			
			basemenu.push({
							nodeType: 'LEAF',
							elementValue: (currentPageNum == tableObject.baseTableData.maxResultsToFetch ? "&bull; ": "") + currentPageNum,
							elementAction: "onclick='TABLE_MANIPULATION_MODULES.get(\"Integrated_PageSwitcher\").setResultsPerPage(" + tableObject.GUID + ", " + currentPageNum + ");'"
						});
			
		}
		
		openGeneralContextMenu(basemenu);
	},

	setResultsPerPage: function(tableID, displayNum) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.baseTableData.maxResultsToFetch = displayNum;
		tableObject.retrieveTableData();
	}
});