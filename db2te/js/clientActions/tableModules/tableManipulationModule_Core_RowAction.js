/*******************************************************************************
 * Author: Misato Sakamoto
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
TABLE_MANIPULATION_MODULES.set("Core_RowAction", {
	
	rowMouse2DownMenuObject: function(tableObject, menuArray, rowNumber) {
		if(tableObject.baseTableData.localTableDeffinition.modules.edit === false) return menuArray;
		if(tableObject.baseTableData.detailedView == true) return menuArray;
		if(tableObject.baseTableData.isSummarized) return menuArray;
		
		if((tableObject.baseTableData.localTableDeffinition.queryType == "table") || (tableObject.baseTableData.localTableDeffinition.moduleOverride['createLike'])) {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Create Like",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_RowAction\").rowAction(\"" + tableObject.GUID + "\", \"Create Like\", \"createLike\", " + rowNumber + ");'"
			});
		}
		if((tableObject.baseTableData.localTableDeffinition.queryType == "table") || (tableObject.baseTableData.localTableDeffinition.moduleOverride['edit'])) {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Edit Row",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_RowAction\").rowAction(\"" + tableObject.GUID + "\", \"Edit Row Data\", \"edit\", " + rowNumber + ");'"
			});
		}
		if((tableObject.baseTableData.localTableDeffinition.queryType == "table") || (tableObject.baseTableData.localTableDeffinition.moduleOverride['del'])) {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Delete Row",
				elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_RowAction\").rowAction(\"" + tableObject.GUID + "\", \"Delete Row\", \"del\", " + rowNumber + ");'"
			});
		}
		return menuArray;
	},
	
	panelLeftMenuObject: function(tableObject, menuArray) {
		if(tableObject.baseTableData.localTableDeffinition.modules.edit === false) return menuArray;
		if(tableObject.baseTableData.detailedView) return menuArray;
		if(tableObject.baseTableData.isSummarized) return menuArray;
		
		if((tableObject.baseTableData.localTableDeffinition.queryType == "table") || (tableObject.baseTableData.localTableDeffinition.moduleOverride['insert']))
			menuArray.push({
					nodeType : "leaf",
					elementValue : "Insert Row",
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Core_RowAction\").rowAction(\"" + tableObject.GUID + "\", \"Insert Row\", \"insert\", " + null + ");'"
			});
		return menuArray;
	},
	
	rowAction: function(tableID, formTitle, actionName, rowNumber) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);

		var tempParamObject = $H();
		tempParamObject.set('ColumnInfo', tableObject.baseTableData.columnsInfo);
		if (rowNumber == null)
			tempParamObject.set('RowData', "");
		else
			tempParamObject.set('RowData', tableObject.baseTableData.baseData[rowNumber]);
		tempParamObject.set('Components', tableObject.baseTableData.components);
		tempParamObject.set('TableName', tableObject.baseTableData.getBaseQuery());
		tempParamObject.set('#Calling_Table_ID', tableID);
		
		var keyIndices = new Array();
		var sqlColNames = new Array();
		for (var i=0; i < tableObject.baseTableData.columnsInfo.name.length; i++) {
			sqlColNames[i] = tableObject.baseTableData.components.column[tableObject.baseTableData.columnsInfo.name[i]].sql_name;
			if (formTitle == "Edit Row Data") {
				for (var j=0; j < tableObject.baseTableData.primaryKeys.length; j++) {
					if (sqlColNames[i] == tableObject.baseTableData.primaryKeys[j])
						keyIndices.push(i);
				}
			}
		}
		
		tempParamObject.set('KeyIndices', keyIndices);
		tempParamObject.set('SQLColNames', sqlColNames);
		
		if (tableObject.baseTableData.localTableDeffinition.moduleOverride[actionName]) {
			runTEScript(this.elementName + "_OverrideRow_" + actionName, tableObject.baseTableData.localTableDeffinition.moduleOverride[actionName], null, null, null, tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
			return true;
		}  
		
		tempParamObject.set('Title', formTitle);
		
		runTEScript(this.elementName + "_Row_" + actionName, GLOBAL_TE_SCRIPT_STORE.get('EDIT_ROW_SCRIPT'), null, null, "TABLE_MANIPULATION_MODULES.get('Core_RowAction').processRowAction", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		return true;
	},
	
	processRowAction: function(returnStack) {
		var returnParameters = returnStack.defaultParameterList;
		var tableID = returnParameters.get('#Calling_Table_ID');
		var returnValue = returnStack.actionReturnValue;
		
		if(returnValue != "true") return;

		var adHoc = (returnParameters.get('adHoc')=='true');
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var sqlColNames = returnParameters.get('SQLColNames');
		var statement = "";
		var selectStmt = "";
		var bindParametersArray = {};	
		var bindParameters = {};
		var selectBindParameters = {};
		var firstvar = "";
		var conditionsEncoded = false;
		var conditions = null;
		var selectRequired = ! (returnParameters.get('Title') == "Insert Row" || returnParameters.get('Title') == "Create Like");
		
		/* Set SQL statement (and selectStmt) */
		if (!selectRequired) {
			statement += "INSERT INTO " + tableObject.baseTableData.getBaseQuery() + " ( ";
			for(var i = 0; i < tableObject.baseTableData.columnsInfo.name.length; i++) {
				if (returnParameters.get('Option_COLUMN_'+i) == undefined || returnParameters.get('Option_COLUMN_'+i) == "true") 
					statement += firstvar + sqlColNames[i];
				else
					continue
				firstvar = ", ";
			}
			firstvar = "";
			statement += ") VALUES (";
			for(i = 0; i < tableObject.baseTableData.columnsInfo.name.length; i++) {
				if ( returnParameters.get('Option_COLUMN_'+i) == undefined) 
					statement += firstvar + ( returnParameters.get('Null_COLUMN_'+i) == "true" ? "NULL" : "?"+(adHoc?"!value="+returnParameters.get('RowData')[i]+"?":"") );
				else if ( returnParameters.get('Option_COLUMN_'+i) == "true") 
					statement += firstvar + ( returnParameters.get('Null_COLUMN_'+i) == "true" ? "NULL" : "?"+(adHoc?"!value="+returnParameters.get('COLUMN_'+i)+"?":"") );
				else
					continue;
				firstvar = ", ";
			}
			statement += ")";
		} else  {
			selectStmt += "SELECT * FROM " + tableObject.baseTableData.getBaseQuery();
			if (returnParameters.get('Title') == "Edit Row Data")  {
				firstvar = "";
				statement += "UPDATE " + tableObject.baseTableData.getBaseQuery() + " SET ";
				for(var i = 0; i < tableObject.baseTableData.columnsInfo.name.length; i++) {
					if (returnParameters.get('Option_COLUMN_'+i) == "true") {
						statement += firstvar + sqlColNames[i] + ( returnParameters.get('Null_COLUMN_'+i) == "true" ? "=NULL" : "=?"+(adHoc?"!value="+returnParameters.get('COLUMN_'+i)+"?":""));
						firstvar = ", ";
					} 
				}
			} else if (returnParameters.get('Title') == "Delete Row") 
				statement += "DELETE FROM " + tableObject.baseTableData.getBaseQuery();

			var where = " WHERE "; 
 			for(i = 0; i < tableObject.baseTableData.columnsInfo.name.length; i++) {
 				if(tableObject.baseTableData.columnsInfo.type[i]=='clob') continue;
 				if(tableObject.baseTableData.columnsInfo.type[i]=='blob') continue;
				if (i != 0)
					where += " AND ";
				where += sqlColNames[i] + ( returnParameters.get('RowData')[i] == null ? " is NULL" : "=?"+(adHoc?"!value="+returnParameters.get('RowData')[i]+"?":"") );
			}
			statement += where;
			selectStmt += where;
		}
				
		/* return if nothing selected to change or insert (and action is not delete) */
		if (firstvar=="" && (returnParameters.get('Title') != "Delete Row"))
			return;

		if(adHoc) {
			miniLinkLoader({action:'ADHOC', termChar:'@', LoadSQLData:( selectRequired ? selectStmt + '\n@\n' + statement + '\n@\n' : statement )});
			return;
		}
		
		/* set bind parameters for insert or update statement */
		i = 0;
		if (returnParameters.get('Title') != "Delete Row") 
			for(var j = 0; j < tableObject.baseTableData.columnsInfo.name.length; j++)
				if (returnParameters.get('Option_COLUMN_'+i) == undefined ||   (returnParameters.get('Option_COLUMN_'+j) == "true") && (returnParameters.get('Null_COLUMN_'+j) !== "true"))
					bindParameters[++i] = {
							'name':tableObject.baseTableData.columnsInfo.name[j],
							'value': ( returnParameters.get('Option_COLUMN_'+i) == undefined ?  returnParameters.get('RowData')[i] : returnParameters.get('COLUMN_'+j) ),
							'dataType':tableObject.baseTableData.columnsInfo.type[j],
							'precision':tableObject.baseTableData.columnsInfo.precision[j],
							'scale':tableObject.baseTableData.columnsInfo.scale[j],
							'type':"DB2_PARAM_IN"
					};
		
		/* set bind parameters and condition */
		if (selectRequired) {
			j = 0;
			for(var k = 0; k < tableObject.baseTableData.columnsInfo.name.length; k++) {
				if (returnParameters.get('RowData')[k] != null) {
	 				if(tableObject.baseTableData.columnsInfo.type[k]=='clob') continue;
	 				if(tableObject.baseTableData.columnsInfo.type[k]=='blob') continue;
					j++;
					dataType=tableObject.baseTableData.columnsInfo.type[k];
					precision=tableObject.baseTableData.columnsInfo.precision[k];
					scale=tableObject.baseTableData.columnsInfo.scale[k];
					value=returnParameters.get('RowData')[k];
					bindParameters[(j+i)] = {
							'name':tableObject.baseTableData.columnsInfo.name[k] + "_original",
							'value':value,
							'dataType':dataType,
							'precision':precision,
							'scale':scale,
							'type':"DB2_PARAM_IN"
					};
					selectBindParameters[j] = {
							'name':tableObject.baseTableData.columnsInfo.name[k],
							'value':value,
							'precision':precision,
							'scale':scale,
							'dataType':dataType,
							'type':"DB2_PARAM_IN"
					};
				}
			}
			bindParametersArray = {
					'1':selectBindParameters,
					'2':bindParameters
			};
			
			conditionsEncoded = true;
			conditions = {
					'1': {
						"rowsreturned" : {
								"operator" : "<",
								"condition": 1,
								"onTrue":{
									'nextAction':"endRun",
									'setrunreturn':"false",
									'setrunmessage':"Row does not exist or data content changed."
								}
							}
						},
					'2': {
						"rowsreturned" : {
								"operator" : ">",
								"condition": 2,
								"onTrue":{
									'nextAction':"rollback",
									'setrunreturn':"false",
									'setrunmessage':"Row is not unique."
								}
							}
						}
			};    
		} else 
			bindParametersArray = bindParameters;
		
		var parameters = {	
				"action" : "executeSQL",
				"returntype" : 'JSON',
				"conditions" : Object.toJSON(conditions),
				"conditionsEncoded" : conditionsEncoded,
				"bindParameters" : Object.toJSON(bindParametersArray),
				"bindParametersEncoded" : true
		};
		
		if (selectRequired)	 {
			parameters['SQL[1]'] = selectStmt;
			parameters['SQL[2]'] = statement;
		} else 	
			parameters['SQL'] = statement;
		
		if(tableObject.baseTableData.localTableDeffinition.useConnectWithTag != null)
			parameters.USE_CONNECTION = getConnectionWithTag(tableObject.baseTableData.localTableDeffinition.useConnectWithTag);

		if(parameters.USE_CONNECTION == null)
			parameters.USE_CONNECTION = getActiveDatabaseConnection();
		
		new Ajax.Request( ACTION_PROCESSOR, {
				'method': 'POST',
				'parameters': parameters,
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null) {
						openModalAlert("Invalid JSON object returned ");
						return;
					}
					if(result.flagGeneralError == true && result.connectionError == true) {
						initiateConnectionRefresh();
						openModalAlert("Please connect to the database");
						return;
					} else if(result.flagGeneralError == true || isReturnCodeNotOK(result)) {
						openModalAlert(getReturnMessageFormatted(result));
						return;
					}
					getPanel(tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID).reloadPage();
				}
		});
	},
	
	actionCallback: function(returnStack) {
		var returnValue = returnStack.actionReturnValue;
		var returnObject = null;
		if(typeof(returnValue) == "object" && returnValue != null) {
			returnObject = returnValue;
			returnValue = returnObject['description'];
		}
		
		if("false" != String(returnValue).toLowerCase()) {			
			if(getActiveDatabaseConnection() != null)
				panelItem.value.reloadPage();

			this.connectionWatcher();
		}
	}
});