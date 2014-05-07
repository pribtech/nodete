/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 *  modified by: Peter Prib
 * 
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012-2014 All rights reserved
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
TABLE_MANIPULATION_MODULES.set("Core_TableOptions", {

	panelLeftMenuObject: function(tableObject, menuArray) {
		if(tableObject.baseTableData.localTableDeffinition.dataRetrievalAction != null) return menuArray;
		
		var tempElementSubNodes = [];
		tempElementSubNodes.push({
			nodeType : "leaf",
			elementID : tableObject.GUID + '_SettingsDialog_button',
			elementValue : "Settings",  
			elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").settings(" + tableObject.GUID + ");'"
		});

		if(ENABLE_VIEW_QUERY || ALLOW_DISPLAY_OF_XML) {
			if(ENABLE_VIEW_QUERY)
				tempElementSubNodes.push({
					nodeType : "leaf",
					elementValue : "Query",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").viewQuery(" + tableObject.GUID + ");'"
				});
			
			if(ALLOW_DISPLAY_OF_XML) {
				tempElementSubNodes.push({
					nodeType : "leaf",
					elementValue : "XML profile",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").viewXML(" + tableObject.GUID + ");'"
				});
				tempElementSubNodes.push({
					nodeType : "leaf",
					elementValue : "Download XML profile",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").downloadXML(" + tableObject.GUID + ");'"
				});
			}
			if(ENABLE_VIEW_QUERY)
				tempElementSubNodes.push({
						nodeType : "leaf",
						elementValue : "Profile Query",
						elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").ProfileQuery(" + tableObject.GUID + ");'"
				});
			
		}		
		menuArray.push({
			nodeType : "branch",
			elementValue : "View",
			elementAction : '',
			elementSubNodes : tempElementSubNodes
			});
		return menuArray;
	},
	
	columnHeadMouse2DownMenuObject: function(tableObject, menuArray, columnType, columnName) {
		for (i=0;i<tableObject.baseTableData.displayColumns.length;i++)
			if(tableObject.baseTableData.displayColumns[i].name==columnName) break;
		var hasBreak = (tableObject.baseTableData.displayColumns[i].break != "" );
		if(tableObject.moveColumn==null) {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Move",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").setMoveDisplayColumn(" + tableObject.GUID + ",\"" + columnName + "\")'"
			});
		} else {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Move Before",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").moveDisplayColumnTo(" + tableObject.GUID + ",\"" + columnName + "\")'"
			});
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Move After",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").moveDisplayColumnTo(" + tableObject.GUID + ",\"" + columnName + "\",1)'"
			});
		}
		menuArray.push({
			nodeType : "leaf",
			elementValue : "Hide",
			elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").setHideColumn(" + tableObject.GUID + ",\"" + columnName + "\")'"
		});
		menuArray.push({
			nodeType : "leaf",
			elementValue : (hasBreak?"No Break":"Break"),
			elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").set"+(hasBreak?"NoBreak":"Break")+"Column(" + tableObject.GUID + ",\"" + columnName + "\")'"
		});
		return menuArray;
	},
	
	rowMouse2DownMenuObject: function(tableObject, menuArray, rowNumber) {
		if(tableObject.baseTableData.detailedView == true) return menuArray;
		menuArray.push({
				nodeType : "leaf",
				elementValue : "View row details",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").loadDetailedView(" + tableObject.GUID + ", " + rowNumber + ");'"
		});

		// Loads all the references/actions available within the table into the sub menu for easy access

		this.setMenuArrayGroup(tableObject, menuArray, rowNumber, "reference", "References", tableObject.baseTableData.components.reference);
		this.setMenuArrayGroup(tableObject, menuArray, rowNumber, "action", "Actions", tableObject.baseTableData.components.action);
		return menuArray;
	},
	
	rowHeadMouse1DoubleClickAction: function(tableObject, rowNumber) {
		this.loadDetailedView(tableObject.GUID, rowNumber);
	},
	
	cellMouse2DownMenuObject: function(tableObject, menuArray, rowNumber, columnType, columnName) {
		if(columnType == "column") {
			var columnObject = tableObject.baseTableData.components[columnType][columnName];
			if(columnObject.localQueryDataType == DB2_BLOB)
				menuArray.push({
					nodeType : "leaf",
					elementValue : "View Base64",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").displayContent(" + tableObject.GUID + ",\"" + rowNumber + "\",\"" + columnName + "\")'"
				});
			else if(columnObject.localQueryDataType == DB2_CLOB)
				menuArray.push({
					nodeType : "leaf",
					elementValue : "View Content",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").displayContent(" + tableObject.GUID + ",\"" + rowNumber + "\",\"" + columnName + "\")'"
				});
			
			if(columnObject.localQueryDataType == DB2_BLOB || columnObject.localQueryDataType == DB2_CLOB)
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Render content",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").renderContent(" + tableObject.GUID + ",\"" + rowNumber + "\",\"" + columnName + "\")'"
				});
		}
		return menuArray;
	},
	
	downloadXML: function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		window.open('data:text/plain;charset=utf-8;Content-Disposition: inline; filename=data.txt ,'+ encodeURIComponent(getXmlNodeAsString(tableObject.baseTableData.sourceDOM)), "child");
//		window.open( DB2MC_SERVER + '/action.php?schema=' + (tableObject.schema == null ? "" : encodeURIComponent(tableObject.schema)) + '&table=' + (tableObject.table == null ? "" : encodeURIComponent(tableObject.table)) + '&action=viewXML&forceSave=true&USE_CONNECTION=' + this.useConnection(tableObject));
	},
	
	displayContent: function(tableID, rowNumber, columnName) {
		var displayType = "RAW";
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var columnObject = tableObject.baseTableData.components["column"][columnName];
		
		if(columnObject.localQueryDataIndex == null)  {
			columnObject.localQueryDataIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
			columnObject.localQueryDataType = DB2_DATA_TYPE_CLASSIFICATION[tableObject.baseTableData.columnsInfo.type[columnObject.localQueryDataIndex].toLowerCase()];
			if(columnObject.localQueryDataType == null)
				columnObject.localQueryDataType = DB2_STRING;
		}
		
		var valueToDisplay = tableObject.baseTableData.baseData[rowNumber][columnObject.localQueryDataIndex];

		if(columnObject.localQueryDataType == DB2_CLOB || columnObject.localQueryDataType == DB2_STRING)
			valueToDisplay = valueToDisplay.escapeHTML();
		loadLink({
				type:"leaf",
				target: "_blank",
				window: "_blank",
				windowStage: tableObject.parentStageID,
				connectionRequired: false,
				formList: null,
				type: displayType,
				data: "<pre>" + valueToDisplay + "</pre>"
			});
	},
	
	getPrimaryKeyFromDB: function(tableObject){
		var schema = tableObject.baseTableData.tableCallParameters.schema;
		var tableName = tableObject.baseTableData.tableCallParameters.table;
		if(schema==null)    schema = tableObject.schema
		if(tableName==null) tableName = tableObject.table
		if(schema==null)   return;
		if(tableName==null) return;
		
		POSTDATA = new Object();
		if(tableObject.baseTableData.localTableDeffinition.useConnectWithTag != null)
			POSTDATA.USE_CONNECTION = getConnectionWithTag(tableObject.baseTableData.localTableDeffinition.useConnectWithTag);
		if(POSTDATA.USE_CONNECTION == null)
			POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
		
		POSTDATA['SQL[CORE_DATA_QUERY]'] = QUERY_BUILDER.get( getConnectionDBMS(POSTDATA.USE_CONNECTION)).primaryKeyQuery(schema, tableName) ;
		if(POSTDATA['SQL[CORE_DATA_QUERY]'] ==  null) return;
		POSTDATA.action 				= "executeSQL";
		POSTDATA.returntype 			= 'JSON';
		
		new Ajax.Request(ACTION_PROCESSOR, {
				'parameters': POSTDATA,
				'method': 'post',
				'asynchronous': false,
				'onCreate': function() {
					if(tableObject.firstLoad)
						tableObject.setError("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:100%;height:100%;position:static;' cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center' valign='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr><tr><td align='center'><h2>Loading Data</h2></td></tr></table>");
				},
				'onComplete' : function() {
					tableObject.firstLoad = false;
				},
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if (result.returnValue.STMTReturn['CORE_DATA_QUERY'].resultSet[0].data.length !== 0)
						tableObject.baseTableData.localTableDeffinition.primaryKeys = result.returnValue.STMTReturn['CORE_DATA_QUERY'].resultSet[0].data;

				},
				'onException': function(transport,exception) {
					tableObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Exception while loading table data</h2>"+exception+"</td></tr></table>");
				},
				'onFailure': function(transport) {
					tableObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error loading table data</h2></td></tr></table>");
				}
			});
	},

	loadDetailedView: function(tableID, rowNumber) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		
		if(tableObject.baseTableData.localTableDeffinition.detailsAction != null) {
			var actionScriptObject = tableObject.baseTableData.localTableDeffinition.detailsAction;
		
			var blockData = $H();
			blockData.set("$tableObject",tableObject);
			
			$H(tableObject.baseTableData.resultSetIndexByColumnName).each(function(node) {
				blockData.set(node.key,tableObject.baseTableData.baseData[rowNumber][node.value]);
			});

			var TEScriptMain = new actionScript(tableObject.baseTableData.tableName + '_' + actionScriptObject.name, actionScriptObject , blockData, tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID, tableObject.parentPageID);
			TEScriptMain.callAction(blockData, '', '', '');
		} else {
			var parameters = new Object();
			
			if(tableObject.baseTableData.localTableDeffinition.primaryKeys.length === 0)
				this.getPrimaryKeyFromDB(tableObject);	
			
			if(tableObject.baseTableData.localTableDeffinition.primaryKeys.length > 0) {
				parameters.searchObject = {
										type:"group",
										Operand: "AND",
										groupNodes: []
									}; 
				tableObject.baseTableData.localTableDeffinition.primaryKeys.each(function(columnName) {
					var columnObject = tableObject.baseTableData.components["column"][columnName];
					
					if(columnObject.localQueryDataIndex == null)  {
						columnObject.localQueryDataIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
						columnObject.localQueryDataType = DB2_DATA_TYPE_CLASSIFICATION[tableObject.baseTableData.columnsInfo.type[columnObject.localQueryDataIndex].toLowerCase()];
						if(columnObject.localQueryDataType == null)
							columnObject.localQueryDataType = DB2_STRING;
					}
			
					var searchValue = tableObject.baseTableData.baseData[rowNumber][columnObject.localQueryDataIndex];
					var SearchType = "=";
			
					if(searchValue != null) {
						if(columnObject.localQueryDataType == DB2_STRING)
							searchValue = "'" + searchValue + "'";
					} else {
						SearchType = "is";
						searchValue = "null";
					}
					
					parameters.searchObject.groupNodes.push({
									type: "value",
									column: columnName,
									compareType: SearchType,
									value: searchValue
								}); 
				});
				 
			} else {
				parameters.displayRowData = tableObject.baseTableData.baseData[rowNumber];
				parameters.displayRowColumnInfo = tableObject.baseTableData.columnsInfo;
			}
			
			parameters.action = "display";
			parameters.schema = tableObject.schema;
			parameters.table = tableObject.table;
			
			loadLink({
				type:"leaf",
				target: "detail",
				window: tableObject.parentWindowID,
				windowStage: tableObject.parentStageID,
				connectionRequired: false,
				formList: null,
				type: "LINK",
				data: {
						parameters: parameters
					}
				});
		}	
	},
	
	ProfileQuery: function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var profileQuery = "";
		
		if(tableObject.baseTableData.queryType == null)
			profileQuery = "SELECT * FROM " + tableObject.baseTableData.getBaseQuery();
	
		switch(tableObject.baseTableData.queryType.toLowerCase()) {
			case 'table':
				profileQuery = "SELECT * FROM " + tableObject.baseTableData.getBaseQuery();
				break;
			case 'inlinequery':
				profileQuery = tableObject.baseTableData.getBaseQuery();
				break;
			case 'function':
				var functionInside = "";
				if(tableObject.baseTableData.parameters != null) {
					var parmLength = tableObject.baseTableData.parameters.each(function (parm) {
						if(functionInside!="") functionInside += ",";
						var value = ( parm.value != null ? parm.value : "''");
						if(!Object.isNumber(value)) 
							value = value.replace(/[\\]/g, "\\\\").replace(/[']/g, "\\'").replace(/[\n]/g, "\\n");
						functionInside += columnTypeValueInsertion(parm.type,value);
					});
				}
				profileQuery = queryBase.getBaseQuery() + (functionInside != "" ? "(" + functionInside + ")" : "");
				break;
		}

		miniLinkLoader({action:'ADHOC', LoadSQLData:profileQuery});	
	},
	
	renderContent: function(tableID, rowNumber, columnName) {
		var displayType = "RAW";
		var type = "text";
		var action = "echo";
		var HTMLEncoded = "false";
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var columnObject = tableObject.baseTableData.components["column"][columnName];
		
		if(columnObject.localQueryDataIndex == null)  {
			columnObject.localQueryDataIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
			columnObject.localQueryDataType = DB2_DATA_TYPE_CLASSIFICATION[tableObject.baseTableData.columnsInfo.type[columnObject.localQueryDataIndex].toLowerCase()];
			if(columnObject.localQueryDataType == null)
				columnObject.localQueryDataType = DB2_STRING;
		}
		
		var valueToDisplay = tableObject.baseTableData.baseData[rowNumber][columnObject.localQueryDataIndex];
		
		if(columnObject.localQueryDataType == DB2_BLOB) {
			type = "blob";
			action = "echoBase64";
		} else if(columnObject.localQueryDataType == DB2_CLOB || columnObject.localQueryDataType == DB2_STRING) {
			valueToDisplay = valueToDisplay.escapeHTML();
			HTMLEncoded = "true";
		}
		
		var id = getGUID();
		
		var output = '<div id="EXTERNAL_FORM_LOAD_' + id + '" style="display:none"><form id="EXTERNAL_FORM_LOAD_' + id + '_FORM'
					+ 	'" target="_blank" action="' + DB2MC_SERVER + "/" + ACTION_PROCESSOR + '?action=' + action + '" method="POST"><textarea name="data" >' + valueToDisplay
					+ '</textarea><input type="hidden" name="type" value="' + type + '"/> <input type="hidden" name="HTMLEncoded" value="' + HTMLEncoded + '"/></form></div>';

		$('PageBody').insert(output);
		submiteFormToNewWindowInStage('EXTERNAL_FORM_LOAD_' + id + '_FORM',tableObject.parentStageID);
		$('EXTERNAL_FORM_LOAD_' + id).remove();
	},
	moveDisplayColumnTo: function(tableID,to,offset) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if(tableObject.moveColumn==null) return;
		tableObject.baseTableData.displayColumns.move(
				 tableObject.getDisplayColumnIndex(tableObject,tableObject.moveColumn)
				,tableObject.getDisplayColumnIndex(tableObject,to)+(offset==null?0:offset)
				);
		tableObject.moveColumn=null;
		tableObject.redrawAll();
	},	
	setMoveDisplayColumn: function(tableID,columnName) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.moveColumn=columnName;
	},	
	setHideColumn: function(tableID,columnName,inputElement) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		try {
			tableObject.getDisplayColumn(tableObject,columnName).isUserHidden=(inputElement==null ||inputElement.checked);
			tableObject.redrawAll();
		} catch (e) {
			alert('setHideColumn '+ e);
		}
		if(inputElement==null) 
			this.settingsDraw(tableObject);
	},
	setBreakColumn: function(tableID,columnName,inputElement) {
		if(inputElement!=null)
			if(!inputElement.checked) {
				this.setNoBreakColumn(tableID,columnName);
				return;
			}
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.getDisplayColumn(tableObject,columnName).break="column";
		tableObject.renderTableData();
	},	
	setNoBreakColumn: function(tableID,columnName) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		tableObject.getDisplayColumn(tableObject,columnName).break="";
		tableObject.renderTableData();
	},	
	setMenuArrayGroup: function(tableObject, menuArray, rowNumber, renderingModule ,groupName, menuObject) {
		var subMenu = [];
		for (var columnName in menuObject) {
			var menuObjectColumn = menuObject[columnName];
			if(menuObjectColumn.includeInSubMenu) {
				subMenu.push({
					nodeType : "leaf",
					elementValue : menuObjectColumn.titleNoQuots,
					elementAction : "onClick='TABLE_COLUMN_RENDERING_MODULES.get(\""+renderingModule+"\").load(event, " + tableObject.GUID + "," + rowNumber + ", \"" + menuObjectColumn.name + "\", \"\");'"
				});
				copyDatabaseVersion(menuObjectColumn,subMenu[subMenu.length-1]);
			}
		}

		if(subMenu.length == 0) return;
		if(subMenu.length > 4) {
			menuArray.push({
							nodeType : "branch",
							elementValue : groupName,
							elementAction : null,
							elementSubNodes : subMenu,
							elementSubNodeDirection : HORIZONTAL
						});
			return;
		}
		if(subMenu.length > 0) {
			menuArray.push({
							nodeType : "LINE",
							elementValue : groupName
						});
			for (var i=0;i<subMenu.length;i++)
				menuArray.push(subMenu[i]);
		}
	},
	
	settings: function(tableID) {
		try { 
			var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
			if(tableObject==null) return;
			if(tableObject.settingsPanel==null) {
				var panelId=tableObject.GUID + '_SettingsDialog'
				tableObject.settingsPanel = new floatingPanel(panelId, 'RAW', "", panelId + '_button', false, false);
				tableObject.settingsPanel.refreshType= "callback";
				tableObject.settingsPanel.refreshCallback="TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").settingsDraw("+tableID+")";
				getPanel(tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID).registerNestedObject(panelId, tableObject.settingsPanel);
				tableObject.settingsPanel.draw();
			}
			tableObject.settingsPanel.setContent('<h3>Definition Not Loaded</h3>','Settings');
			this.settingsDraw(tableObject);
			tableObject.settingsPanel.show_and_size(null,false);
		} catch(e) {
			openModalAlert('Setting error: '+e);
		}
	},
	
	settingsDraw: function(tableObject) {
		if(typeof tableObject  == 'string') tableObject = GET_GLOBAL_OBJECT('list_table', tableObject);
		if(tableObject==null) return;
		var output = "<table ><tbody>"
			+ 	"<tr><th>Column</th><th>Hide</th><th>Break</th></tr>";
		for (var i= 0; i < tableObject.baseTableData.columnsInfo.name.length; i++)	{
			columnName=tableObject.baseTableData.columnsInfo.name[i];
			displayColumn=tableObject.getDisplayColumn(tableObject,columnName);
			if(displayColumn==null) continue;
			if(!displayColumn.isVisible) continue;
			var column=tableObject.baseTableData.components.column[columnName];
			output += 	"<tr><td>"+column.title+"</td>"
					+	"<td><input type='checkbox' name='"+columnName+"_hide' "+(displayColumn.isUserHidden?"checked='checked'":"")+"' " 
					+			"onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").setHideColumn(" + tableObject.GUID + ",\"" + columnName + "\",this)'"
					+		"/></td>"
					+	"<td><input type='checkbox' name='"+columnName+"_break' "+(tableObject.getDisplayColumn(tableObject,columnName).break=="column"?"checked='checked'":"")+"' " 
					+			"onClick='TABLE_MANIPULATION_MODULES.get(\"Core_TableOptions\").setBreakColumn(" + tableObject.GUID + ",\"" + columnName + "\",this)'"
					+		"/></td>"
					+	 "</tr>";   tableObject.getDisplayColumn(tableObject,columnName).break="column";
		}
		output += 	"</tbody></table>";
		tableObject.settingsPanel.setContent(output);
	},
	
	useConnection: function(tableObject) {
		var useConnection = null;
		if(tableObject.baseTableData.localTableDeffinition.useConnectWithTag != null)
			useConnection = getConnectionWithTag(tableObject.baseTableData.localTableDeffinition.useConnectWithTag);
		if(useConnection == null)
			useConnection = getActiveDatabaseConnection();
		return useConnection;
	},
	
	viewQuery: function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		miniLinkLoader({action:'ADHOC', LoadSQLData:tableObject.getQuery()});	
	},
	
	viewXML: function(tableID) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		openURLonDefaultStageInIframe( DB2MC_SERVER + '/action.php?schema=' + (tableObject.schema == null ? "" : encodeURIComponent(tableObject.schema)) + '&table=' + (tableObject.table == null ? "" : encodeURIComponent(tableObject.table)) + '&action=viewXML&USE_CONNECTION=' + this.useConnection(tableObject));
	}

});