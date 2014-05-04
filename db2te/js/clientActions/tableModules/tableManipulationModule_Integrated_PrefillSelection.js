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
var TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTION_OPEN = false;

Event.observe(window, 'load', function() {
$('PageBody').observe('click', function() {
		var object = $('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR');
		if(object != null)
			$('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR').remove();
	});
});

TABLE_MANIPULATION_MODULES.set("Integrated_PrefillSelection", {
	
	openPrefillTable: null,
	openPrefillColumn: null,
	openPrefillEditableSelectBoxID: null,
	openPrefillData: null,
	
	requestPrefill: function(tableID, columnName, editableSelectBoxID) {
		var prefilleditableSelectBoxHolder = $(editableSelectBoxID + "_buttonHolder");
		if(columnName == null || columnName == "" || prefilleditableSelectBoxHolder == null) return;

		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if(tableObject == null ) return

		var columnObject = tableObject.baseTableData.components["column"][columnName];
		if(	columnObject == null ) return;
		if(columnObject.isPrefiled != null || columnObject.mask != null)
			prefilleditableSelectBoxHolder.update("<img class='prefillImage' src='./images/spacer.gif' onclick='TABLE_MANIPULATION_MODULES.get(\"Integrated_PrefillSelection\").showPrefillSelection(\"" + tableID + "\", \"" + columnName + "\", \"" + editableSelectBoxID + "\");Event.stop(event);'/>");
		else
			prefilleditableSelectBoxHolder.update("");
	},
	
	showPrefillSelection:function(tableID, columnName, editableSelectBoxID) {

		var object = $('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR');
		if(object != null) {
			if(this.openPrefillTable == tableID && this.openPrefillColumn == columnName && this.openPrefillData.length>0) {
				this.InsertPrefillData(tableID, columnName, editableSelectBoxID);
				return;
			}
			$('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR').remove();
		}
					
		this.openPrefillTable = tableID;
		this.openPrefillColumn = columnName;
		this.openPrefillEditableSelectBoxID = editableSelectBoxID;
		this.openPrefillData = [];
		
		var editableSelectBox = $(editableSelectBoxID);
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if(editableSelectBox == null || tableObject == null) return;
		
		var columnObject = tableObject.baseTableData.components["column"][columnName];
		
		if(columnObject == null) return;
		
		var output =  "<div id='TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR' onclick='Event.stop(event);' style='padding:0px;margin:0px;background-color:white;top:0px;left0px;position:absolute;z-index:" + getTopZindex() + ";width:" + editableSelectBox.getWidth() + "px'>"
					+ 	"<table cellpadding='0px' cellspacing='0px' style='width:100%;height:100%;position:static;'>"
					+ 		"<tbody>"
					+ 			"<tr>"
					+ 				"<td align='right' id=\"TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SEARCH_VALUE\">"
					+ 			"</td></tr>"
					+ 		"</tbody>"
					+ 	"</table>"
					+ "</div>";
		
		$("PageBody").insert(output);
		this.size(editableSelectBoxID);
		this.getPrefillData(tableID, columnName, editableSelectBoxID);
	},
	
	size: function(editableSelectBoxID) {
		var mainContainer = $('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR');
		if (mainContainer == null) return;
		
		var editableSelectBoxOffset = {
				left: 0,
				top: 0
			};
		var editableSelectBoxWidth = 20;
		var editableSelectBoxHeight = 20;
		
		var parentTrigger = $(editableSelectBoxID);
		if (parentTrigger != null) {
			editableSelectBoxOffset = parentTrigger.cumulativeOffset();
			editableSelectBoxWidth = parentTrigger.getWidth();
			editableSelectBoxHeight = parentTrigger.getHeight();
		} else {
			var editableSelectBoxLeft = CORE_Current_Mouse_X - 10;
			var editableSelectBoxTop = CORE_Current_Mouse_Y -10;
			editableSelectBoxOffset = {
				left: editableSelectBoxLeft,
				top: editableSelectBoxTop
			};
		}
		
		var speditableSelectBoxBottom = pageHeight - (editableSelectBoxOffset.top + editableSelectBoxHeight);
		var containerHeight = mainContainer.scrollHeight;

		if (speditableSelectBoxBottom >= containerHeight) 
			mainContainer.setStyle({ "top": editableSelectBoxOffset.top + editableSelectBoxHeight + "px", "left": editableSelectBoxOffset.left + "px" });
		else if (editableSelectBoxOffset.top >= containerHeight) 
			mainContainer.setStyle({ "top": (editableSelectBoxOffset.top - containerHeight) + "px", "left": editableSelectBoxOffset.left + "px" });
		else if (speditableSelectBoxBottom >= speditableSelectBoxTop)
			mainContainer.setStyle({ "top": editableSelectBoxOffset.top + editableSelectBoxHeight + "px", "left": editableSelectBoxOffset.left + "px" });
		else
			mainContainer.setStyle({ "top": (editableSelectBoxOffset.top - containerHeight) + "px", "left": editableSelectBoxOffset.left + "px" });
	},

	getPrefillData: function(tableID, columnName, editableSelectBoxID) {
		var thisObject = this;
		
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if(tableObject == null) return;

		var columnObject = tableObject.baseTableData.components["column"][columnName];
		if(columnObject == null) return;
		
		if(columnObject.isPrefiled == null) return;
		if(columnObject.isPrefiled.values != null) 
			for(var i=0;i<columnObject.isPrefiled.values.length;i++)
				this.openPrefillData.push({
								value: columnObject.isPrefiled.values[i], 
								text: columnObject.isPrefiled.values[i]
							});
		var value = "";
		var displayvalue = "";
		if(columnObject.mask != null) {
			$H(columnObject.mask).each(function(Mask) {
				if(Mask.value.mask != null) {
					value = Mask.key + " /*" + Mask.value.mask + "*/";
					displayvalue = Mask.value.mask;
				} else {
					value = Mask.key;
					displayvalue = Mask.key;
				}
				if(columnObject.localQueryDataType != DB2_NUMBER)
					value = "'" + value + "'";
				thisObject.openPrefillData.push({
								value: value, 
								text: displayvalue
				});
			});
			if(columnObject.nullMask != null) {
				if(columnObject.nullMask != null) {
					thisObject.openPrefillData.push({
										value: 'null /*' + columnObject.nullMask.value + '*/', 
										text: "<font style='color:red;font-weight: bold;'>null</font>"
					});
				}
			}	
			thisObject.InsertPrefillData(tableID, columnName);
		}
		if(this.openPrefillData.length == 0 && columnObject.prefillData == null && columnObject.isPrefiled != null) {
			var returnObject = {
				'tableID'	: tableID,
				'columnName' : columnName,
				'tableObject': tableObject,
				'columnObject' : columnObject,
				'thisObject' : this,
				'editableSelectBoxID' : editableSelectBoxID
			};
			if(columnObject.isPrefiled.table == null) {
				returnObject.tableObject = tableObject.baseTableData.localTableDeffinition;
				this.getData(returnObject);
			} else {
				var searchValueHolder = $("TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SEARCH_VALUE");
				if(searchValueHolder != null)
					searchValueHolder.update("<img style='float:none;' src='images/loadingpage_small.gif'/>");
				ObjectManager.getTableDefinition(columnObject.isPrefiled.table, null, "TABLE_MANIPULATION_MODULES.get('Integrated_PrefillSelection').getDataTableDef", null, null, true);
			}
		}
		else if(this.openPrefillData.length > 0 || columnObject.prefillData != null)
			this.loadPrefillColumnData(tableID, columnName, columnObject, editableSelectBoxID);
	},
	
	getDataTableDef: function(tableDefD) {
		this.getData( {
				'tableID'	: this.openPrefillTable,
				'columnName' : this.openPrefillColumn,
				'tableObject': tableDefD,
				'columnObject' : GET_GLOBAL_OBJECT('list_table', this.openPrefillTable).baseTableData.components["column"][this.openPrefillColumn],
				'thisObject' : this,
				'editableSelectBoxID' : this.openPrefillEditableSelectBoxID,
			});
	},

	getData: function(returnObject) {
		var editableSelectBoxID = returnObject.editableSelectBoxID;
		var thisObject = returnObject.thisObject;
		var tableID = returnObject.tableID;
		var columnName = returnObject.columnName;
		var tableObject = returnObject.tableObject;
		var columnObject = returnObject.columnObject;
		var DBMS = "";
		thisObject.loadPrefillColumnData(tableID, columnName, columnObject);
		POSTDATA = new Object();
		
		if(tableObject.useConnectWithTag != null)
			POSTDATA.USE_CONNECTION = getConnectionWithTag(tableObject.useConnectWithTag);
		if(POSTDATA.USE_CONNECTION == null)
			POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
		DBMS = getConnectionDBMS(POSTDATA.USE_CONNECTION);
		
		if (QUERY_BUILDER==undefined || DBMS==null) {
			thisObject.setErrorFormatted(DATABASE_NOT_CONNECTED_TEXT);
			return;
		}
		POSTDATA.SQL 					= QUERY_BUILDER.get(DBMS).buildDistinctColumnSelect(tableObject, columnObject) ;
		POSTDATA.action 				= "executeSQL";
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.maxRowReturn			= 1000;
		
		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null) return;
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) {
							openModalAlert("prefill error '" + result.returnMessage);
							return;
						}
						if(result != null) {
							var resultSet = result.returnValue.resultSet[0];
							columnObject.prefillData = resultSet.data;
							if(thisObject.openPrefillTable != tableID || thisObject.openPrefillColumn != columnName) return;
							thisObject.loadPrefillColumnData(tableID, columnName, columnObject, editableSelectBoxID);
						}
					}
			});
	},
	
	loadPrefillColumnData: function(tableID, columnName, columnObject, editableSelectBoxID) {
		var thisObject = this;
		var maskObject = columnObject.mask;
		if(columnObject.prefillData != null) {
			var aPrefillValue = "";
			var aPrefillText = "";
			columnObject.prefillData.each(function(value) {
				if(columnObject.localQueryDataType == DB2_NUMBER)
					aPrefillValue = value[0];
				else
					aPrefillValue = "'" + value[0] + "'";
				aPrefillText = value[0];
				
				if(maskObject != null) {
					if(maskObject[value[0]] != null) {
						if(maskObject[value[0]].mask != null) {
							aPrefillValue += " /* " + maskObject[value[0]].mask + " */";
							aPrefillText = maskObject[value[0]].mask;
						}
					}
				}

				thisObject.openPrefillData.push({
							value: aPrefillValue, 
							text: aPrefillText
					});
			});
		}
		this.InsertPrefillData(tableID, columnName, editableSelectBoxID);
	},
	
	InsertPrefillData:function(tableID, columnName, editableSelectBoxID) {
		if(this.openPrefillTable != tableID || this.openPrefillColumn != columnName) return;
		
		var searchValueHolder = $("TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SEARCH_VALUE");
		if(searchValueHolder == null) {
			this.showPrefillSelection(tableID, columnName, editableSelectBoxID);
			return;
		} 

		if(editableSelectBoxID==null)
			var output =  "<select onchange=\"$('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR').remove();"
						+ "\" onclick='Event.stop(event);' size="+Math.min(10,this.openPrefillData.length)+" style='width:100%;height:200px;'>";
		else
			var output =  "<select onchange=\"$('" + editableSelectBoxID + "_textInput').value = TABLE_MANIPULATION_MODULES.get('Integrated_PrefillSelection').openPrefillData[this.value].value;$('TABLE_MANIPULATION_MODULES_INTEGRATED_PREFILL_SELECTOR').remove();"
							+( $(editableSelectBoxID + '_textInput').onchange == undefined ? "" : "$('" + editableSelectBoxID + "_textInput').onchange();")
						+ "\" onclick='Event.stop(event);' size="+Math.min(10,this.openPrefillData.length)+" style='width:100%;'>";

		for(var i=0; i < this.openPrefillData.length; i++)
			output += "<option value='" + i + "'>" + this.openPrefillData[i].text + "</option>";
		output += "</select>";
		searchValueHolder.update(output);
	}
});