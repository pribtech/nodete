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
TABLE_MANIPULATION_MODULES.set("Core_Search", {
	
	panelLeftMenuObject: function(tableObject, menuArray) {
		if(tableObject.baseTableData.detailedView == true || tableObject.baseTableData.localTableDeffinition.modules.search === false || tableObject.baseTableData.isSummarized ) return menuArray;
		
		if(tableObject.baseTableData.detailedView == true) return menuArray;
		var sortPanel = new floatingPanel(tableObject.GUID + '_SortDialog', 'RAW', "", tableObject.GUID + '_SortDialog_button', false, false);
		getWindow(tableObject.parentStageID,tableObject.parentWindowID).WindowContainers.get(tableObject.parentPanelID).registerNestedObject(tableObject.GUID + '_SortDialog', sortPanel);
		sortPanel.draw();
		
		menuArray.push({
				nodeType : "leaf",
				elementID : tableObject.GUID + '_SortDialog_button',
				elementValue : "Search",
				elementAction : 'onClick="TABLE_MANIPULATION_MODULES.get(\'Core_Search\').updateOnNoChage(' + tableObject.GUID + ');FLOATINGPANEL_activeFloatingPanels.get(\'' + tableObject.GUID + '_SortDialog\').show_and_size(\'' + tableObject.GUID + '_SortDialog_button\');"'
		});
		return menuArray;
	},
	
	updateOnNoChage:function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var sortChange = $(tableID + "_SortPanelChangeNotification");
		if(tableObject.baseTableData.SortManipulationHasOccured == null || tableObject.baseTableData.SortManipulationHasOccured == false)
			this.draw(tableID);
		else if(sortChange != null) {
			if(tableObject.baseTableData.searchStartJSONText != null && tableObject.baseTableData.searchStartJSONText != Object.toJSON(tableObject.baseTableData.where))
				sortChange.show();
			else
				sortChange.hide();
		}
	},

	draw: function(tableID) {
		var sortPanel = FLOATINGPANEL_activeFloatingPanels.get(tableID + '_SortDialog');
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);

		tableObject.baseTableData.SortManipulationHasOccured = false;

		var nodeStack = [];
		var indexStack = [];
		var output = "";

		rootNode = tableObject.baseTableData.where;
		tableObject.baseTableData.searchStartJSONText = Object.toJSON(rootNode);
		rootNode = eval("(" + tableObject.baseTableData.searchStartJSONText + ")");
		
		if(rootNode == null)
			rootNode = {
								type:"group",
								Operand: "AND",
								groupNodes: [{
								type: "value",
								column: "",
								compareType: "",
								value: ""
							}]
							};
		if(rootNode.type.toLowerCase() != "group")
			rootNode = {
								type:"group",
								Operand: "AND",
								groupNodes: [rootNode]
							};
		tableObject.baseTableData.searchManipulationWhereObject = rootNode;
		
		output += "<table style='width:500px;padding-right:20px' cellpadding='0px' cellspacing='0px'>"
					+ "<tbody>"
						+ "<tr>"
							+ "<td id='" + tableID + "_SortPanelChangeNotification' style='display:none;background-color:lightgrey;'>"
								+ "<table style='width:100%'>"
									+ "<tbody>"
										+ "<tr><td>External Changes</td>"
											+ "<td align='right'>"
											+	 "<button onclick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').draw(" + tableObject.GUID + ");\">Reset search fields</button>"
											+ "</td>"
										+ "</tr>"
									+ "</tbody>"
								+ "</table>"
							+ "</td>"
						+ "</tr>"
						+ "<tr><td id='" + tableID + "_SortPanelParameters'></td></tr>"
						+ "<tr><td id='" + tableID + "_SortPanelRootNode'></td></tr>"
					+ "</tbody>"
				+ "</table>";
		
		var menu = [{
				nodeType : "leaf",
				elementValue : "Reset",
				elementAction : "onclick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').draw(" + tableObject.GUID + ");\""
		},{
				nodeType : "leaf",
				elementValue : "Apply search",
				elementAction : "onclick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').applySearchFilter(" + tableObject.GUID + ");\""
		}];
		
		sortPanel.setContent(output, 'Table sort manager', null, null, menu);
		this.insertParameters(tableObject);
		this.insertGroupInto(tableObject, tableID + "_SortPanelRootNode", rootNode, "");
		
		var holdingContainer = FLOATINGPANEL_activeFloatingPanels.get(tableID + '_SortDialog');
		if(holdingContainer != null)
			if(holdingContainer.size != null)
				holdingContainer.size();
	},
	
	insertParameters: function(tableObject) {
		var locationObject = $(tableObject.GUID + "_SortPanelParameters");
		if(tableObject.baseTableData.parameters == null) return;
		if(tableObject.baseTableData.parameters.length <= 0) return;
		locationObject.insert({bottom:'<div class="groupTableTitle">Query parameters:</div>'});
		var thisObject=this;
		tableObject.baseTableData.parameters.each(function (parm) {
			var output = "<div style='margin-left:5px;margin-bottom:5px;padding:2px;width=100%;height=100%;border-width:1px;border-style:solid;border-color:black;'>"
						+ 	"<table style='width:100%;height:100%;'cellpadding='0px' cellspacing='0px'>"
						+ 		"<tbody>"
						+ 			"<tr><td style='background-color:#EDEDED;'>"
						+ 				parm.title + " ("+columnTypeName(parm.type)+ ")"
						+ 				"</td></tr>"
						+ 			"<tr><td>"
						+ 				"<input"+columnTypeInputOnChange(tableObject.GUID,parm.type,tableObject.GUID + '_SortDialog')+thisObject.editOnFocus(tableObject.GUID,parm.type,parm.name )+" id='" + tableObject.GUID+ "_parameters_" + parm.name + "' type='text' id='value' style='width:95%;display:block;' name='TE_DATABASE_LOGIN_COMMENT'/>"
						+ 			"</td></tr>"
						+ 		"</tbody>"
						+ 	"</table>"
						+ "</div>";
			locationObject.insert({bottom:output});
			$(tableObject.GUID + "_parameters_" + parm.name).value = parm.value;
		});
		locationObject.insert({bottom:'<div class="groupTableTitle">Search operation:</div>'});
	},
	
	insertGroupInto: function(tableObject, locationID, groupNode, accessPath){
		var locationObject = $(locationID);
		if(!locationObject) return;
		var id = getGUID();
		var output = "<div id='" + locationID + "_" + id + "_Main' style='margin-left:5px;margin-bottom:5px;padding:2px;width=100%;height=100%;border-width:1px;border-style:solid;border-color:black;'>"
					+ "<table style='width:100%;height:100%;'cellpadding='0px' cellspacing='0px'>"
						+ "<tbody>"
							+ "<tr><td style='padding:3px;background-color:black;'>"
								+ "<table style='width:100%;' cellpadding='0px' cellspacing='0px'><tbody><tr><td><font style='color:white;'>&nbsp;&nbsp;Group:&nbsp;</font>"
										+ "<button onClick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').addObject(" + tableObject.GUID + ", 'CONDITION', '" + locationID + "_" + id + "', '" + accessPath + "');\">Add condition</button>&nbsp;"
										+ "<button onClick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').addObject(" + tableObject.GUID + ", 'GROUP', '" + locationID + "_" + id + "', '" + accessPath + "');\">Add group</button>"
									+ "</td><td align='right'><font style='color:white;'>Type:&nbsp;</font><select type='text'onchange='TABLE_MANIPULATION_MODULES.get(\"Core_Search\").updateObject(" + tableObject.GUID + ", \"" + accessPath + ".Operand\", this.value)'>"
											+ "<OPTION value=\"AND\" " + (groupNode.Operand.toUpperCase() == "AND" ? "selected" : "") + ">AND</OPTION>"
											+ "<OPTION value=\"OR\" " + (groupNode.Operand.toUpperCase() == "OR" ? "selected" : "") + ">OR</OPTION>"
										+ "</select>"
										+ "<button onClick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').removeObject(" + tableObject.GUID + ", '" + locationID + "_" + id + "', '" + accessPath + "');\">X</button></td></tr>" 
								+"</tbody></table>"
							+ "</td></tr>"
							+ "<tr><td id='" + locationID + "_" + id + "' style=''></td></tr>"
						+"</tbody>"
				+ "</table>"
				+ "</div>";
		locationObject.insert({bottom:output});
			
		var length = groupNode.groupNodes.length;
		for(var i=0; i < length; i++) {
			if(	groupNode.groupNodes[i].type.toLowerCase() == "group")
				this.insertGroupInto(tableObject, locationID + "_" + id, groupNode.groupNodes[i], accessPath + ".groupNodes[" + i + "]");
			else
				this.insertSearchNode(tableObject, locationID + "_" + id, groupNode.groupNodes[i], accessPath + ".groupNodes[" + i + "]");
		}
	},
	
	insertSearchNode: function(tableObject, locationID, searchNode, accessPath) {
		var locationObject = $(locationID);
		if(!locationObject) return;

		var id = getGUID();
		var output = "<div id='" + locationID + "_" + id + "_Main' style='margin-left:5px;margin-bottom:5px;padding:2px;width=100%;height=100%;border-width:1px;border-style:solid;border-color:black;'>"
				+ "<table style='width:100%;height:100%;'cellpadding='0px' cellspacing='0px'>"
				+  	"<tbody>"
				+  		"<tr><td style='background-color:#EDEDED;'>"
				+  			"<table style='width:100%;' cellpadding='0px' cellspacing='0px'><tbody><tr><td>&nbsp;&nbsp;Condition:</td>"
				+  				"<td align='right'>Column:&nbsp;<select type='text'onclick='AllowAutoClosingOfFloatingObject = false;' onchange='TABLE_MANIPULATION_MODULES.get(\"Core_Search\").updateObject(" + tableObject.GUID + ", \"" + accessPath + ".column\", this.value);TABLE_MANIPULATION_MODULES.get(\"Integrated_PrefillSelection\").requestPrefill(" + tableObject.GUID + ", this.value, \"" + locationID + "_" + id + "_editableSelect\");'>"
				+  					"<OPTION value=\"\"></OPTION>";
										$H(tableObject.baseTableData.components.column).each(function(value) { if(value.value.isSearchable & (value.value.localQueryDataType == null || (value.value.localQueryDataType != DB2_CLOB && value.value.localQueryDataType != DB2_BLOB))) output += "<OPTION value='" + value.key.toUpperCase() + "' " + (searchNode.column.toUpperCase() == value.key.toUpperCase() ? "selected" : "") + " >" + (value.value.title != null ? value.value.title : value.key)+ "</OPTION>"; });
		output += 						"</select>"
				+ 							"<button onClick=\"TABLE_MANIPULATION_MODULES.get('Core_Search').removeObject(" + tableObject.GUID + ", '" + locationID + "_" + id + "', '" + accessPath + "');\">X</button>"
				+  				"</td></tr></tbody></table>"
				+  		"</td></tr>"
				+  		"<tr><td>"
				+  			"<table style='width:100%;' cellpadding='0px' cellspacing='0px'>"
				+  				"<tbody><tr><td style='width:10px;'>"
				+  					"<select type='text' onclick='AllowAutoClosingOfFloatingObject = false;' onchange='TABLE_MANIPULATION_MODULES.get(\"Core_Search\").updateObject(" + tableObject.GUID + ", \"" + accessPath + ".compareType\", this.value)'>"
				+  						"<OPTION value=\"\"></OPTION>";
		if(searchNode.compareType == null || searchNode.compareType == "") searchNode.compareType = SQL_COMPARISON_OPERATORS[0];
			SQL_COMPARISON_OPERATORS.each(function(value) { output += "<OPTION value='" + value + "' " + (searchNode.compareType == value ? "selected" : "") + " >" + value + "</OPTION>";});
		output +=					 "</select>"	
				+ 				 "</td><td>"
				+  					"<table id='" + locationID + "_" + id + "_editableSelect' style='width:95%;border:1px solid black;'cellpadding='0px' cellspacing='0px'>"
				+ 						"<tbody><tr><td style='width:100%;'>"
				+ 							"<input id='" + locationID + "_" + id + "_editableSelect_textInput' type='text' id='value' style='border:none;width:100%;display:block;' name='TE_DATABASE_LOGIN_COMMENT' onchange='TABLE_MANIPULATION_MODULES.get(\"Core_Search\").updateObject(" + tableObject.GUID + ", \"" + accessPath + ".value\", this.value)'/>"
				+ 						"</td><td id='" + locationID + "_" + id + "_editableSelect_buttonHolder' style='width:0%;'>"
				+ 					"</td></tr></tbody></table>"
				+ 			"</td></tr></tbody></table>"
				+ 		"</td></tr>"
				+ 	"</tbody>"
				+ "</table>"
				+"</div>";
			locationObject.insert({bottom:output});
			$(locationID + "_" + id + "_editableSelect_textInput").value = searchNode.value;
			if(searchNode.column != "" && searchNode.column != null)
				TABLE_MANIPULATION_MODULES.get("Integrated_PrefillSelection").requestPrefill(tableObject.GUID, searchNode.column, locationID + "_" + id + "_editableSelect");
	},
	
	addObject: function(tableID, type, locationID, accessPath) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.baseTableData.SortManipulationHasOccured = true;
		if(	type.toUpperCase() == "GROUP") {
			var NewObject = {
								type:"group",
								Operand: "AND",
								groupNodes: [{
								type: "value",
								column: "",
								compareType: "",
								value: ""
							}]
							}; 
			
			var groupNodes = eval("tableObject.baseTableData.searchManipulationWhereObject" + accessPath + ".groupNodes;");
			groupNodes.push(NewObject);
			this.insertGroupInto(tableObject, locationID, NewObject, accessPath + ".groupNodes[" + (groupNodes.length-1) + "]");
		} else {
			var NewObject = {
								type: "value",
								column: "",
								compareType: "",
								value: ""
							};
			
			var groupNodes = eval("tableObject.baseTableData.searchManipulationWhereObject" + accessPath + ".groupNodes;");
			groupNodes.push(NewObject);
			this.insertSearchNode(tableObject, locationID, NewObject, accessPath + ".groupNodes[" + (groupNodes.length-1) + "]");
		}
		var holdingContainer = FLOATINGPANEL_activeFloatingPanels.get(tableID + '_SortDialog');
		if(holdingContainer != null)
				holdingContainer.size();
	},
	
	removeObject:function(tableID, locationID, accessPath) {
		
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.baseTableData.SortManipulationHasOccured = true;
		eval("tableObject.baseTableData.searchManipulationWhereObject" + accessPath + " = null;");
		$(locationID + "_Main").remove();

		if(tableObject.baseTableData.searchManipulationWhereObject == null) {
			var rootNode = {
								type:"group",
								Operand: "AND",
								groupNodes: [{
								type: "value",
								column: "",
								compareType: "",
								value: ""
							}]
						}; 
			tableObject.baseTableData.searchManipulationWhereObject = rootNode;
			this.insertGroupInto(tableObject, tableID + "_SortPanelRootNode", rootNode, '');

		}
		
		var holdingContainer = FLOATINGPANEL_activeFloatingPanels.get(tableObject.GUID + '_SortDialog');
		if(holdingContainer != null)
			if(holdingContainer.size != null)
				holdingContainer.size();
	},
	
	updateObject:function(tableID, accessPath, value) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.baseTableData.SortManipulationHasOccured = true;
		eval("tableObject.baseTableData.searchManipulationWhereObject" + accessPath + " = value;");
	},
	
	applySearchFilter : function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var rootNode = tableObject.baseTableData.searchManipulationWhereObject;
		this.removeNullSearchNode(rootNode);

		var parameterArray = null;
		if( tableObject.baseTableData.parameters != null ) {
			if(tableObject.baseTableData.parameters.length > 0) {
				parameterArray = [];
				var paramLength = tableObject.baseTableData.parameters.length;
				var i = 0;
				for(i=0; i< paramLength; i++) {
					parameterArray.push({
						name: tableObject.baseTableData.parameters[i].name,
						title: tableObject.baseTableData.parameters[i].title,
						value : $(tableID + "_parameters_" + tableObject.baseTableData.parameters[i].name).value,
						type: tableObject.baseTableData.parameters[i].type
					});
				}
			}
		}
		
		this.applySearchObject(tableID, {where:rootNode, parameters: parameterArray}, PUSH_HISTORY_BACKWARDS);
		
		tableObject.baseTableData.searchManipulationWhereObject = null;
		tableObject.baseTableData.SortManipulationHasOccured = null;
		tableObject.baseTableData.searchStartJSONText = null;
		var holdingContainer = FLOATINGPANEL_activeFloatingPanels.get(tableID + '_SortDialog');
		if(holdingContainer != null)
			if(holdingContainer.close != null)
				holdingContainer.close();
	},
	
	removeNullSearchNode: function(rootNode) {
		var groupNode = null;
		
		if(rootNode != null) {
			for(var i = 0; i < rootNode.groupNodes.length; i++) {
				groupNode = rootNode.groupNodes[i];
				if(groupNode == null){
					rootNode.groupNodes.splice(i,1);
					i--;
				}else if(groupNode.type.toLowerCase() === "value" && groupNode.column == "" && groupNode.compareType == "" && groupNode.value == ""){
					rootNode.groupNodes.splice(i,1);
					i--;
				}else if(groupNode.type.toLowerCase() === "group"){
					this.removeNullSearchNode(rootNode.groupNodes[i]);
				}
			}
		}
	},
	
	applySearchObject: function(tableID, oldHistoryObject, historyRecordStat) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		
		var newHistoryObject = {
				where	: tableObject.baseTableData.where,
				parameters : tableObject.baseTableData.parameters	
			};
			
		tableObject.baseTableData.where = oldHistoryObject.where;
		tableObject.baseTableData.parameters = oldHistoryObject.parameters;
		tableObject.baseTableData.fetchResultsAfterRow = 0;
		
		if(historyRecordStat == PUSH_HISTORY_FORWARDS)
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToForwardHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Search\").applySearchObject(\"" + tableObject.GUID + "\", " + Object.toJSON(newHistoryObject) + ", PUSH_HISTORY_BACKWARDS)", false);
		else if(historyRecordStat == PUSH_HISTORY_BACKWARDS)
			getWindow(tableObject.parentStageID, tableObject.parentWindowID).pushActionOnToBackHistory("TABLE_MANIPULATION_MODULES.get(\"Core_Search\").applySearchObject(\"" + tableObject.GUID + "\", " + Object.toJSON(newHistoryObject) + ", PUSH_HISTORY_FORWARDS)", false);

		tableObject.retrieveTableData();
	},
	
	editOnFocus: function(GID,type,title){
		switch (type) {
			case 'date':
			case 'time':
			case 'timestamp':
				return ' onfocus="TABLE_MANIPULATION_MODULES.get(\'Core_Search\').editAttribute('+GID+',this,\''+type+'\',\''+title+'\');"';
		}
		return '';
	},
	
	editAttribute: function(GID,element,type,title) {
		var tempParamObject = $H();
		tempParamObject.set('GID', GID);
		tempParamObject.set('element', element);
		tempParamObject.set('type', type);
		tempParamObject.set('title', title);
		runTEScript(element.id + "_editAttribute", GLOBAL_TE_SCRIPT_STORE.get('editAttribute'), null, null,"TABLE_MANIPULATION_MODULES.get('Core_Search').actionCallBack", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, element.id + "_editAttribute");
	},
	
	actionCallBack : function(returnStack) {
		var holdingContainer = FLOATINGPANEL_activeFloatingPanels.get(returnStack.localVariables.get('GID') + '_SortDialog');
		if(holdingContainer != null)
				holdingContainer.show_and_size();
	}
});