/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 *Updated author: Peter Prib
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011-2014 All rights reserved.
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
/*
	The has array TABLE_COLUMN_RENDERING_MODULES contains a list of function to render columns of a given type. 
	the function definition is as follows:
	function(object baseTableData, int rowToRender, columnRenderingInfo)
	*/
var TABLE_COLUMN_RENDERING_MODULES = $H();

var TABLE_ROW_MODULES = $H();

var TABLE_MANIPULATION_MODULES = $H();

CORE_CLIENT_ACTIONS.set("list_table",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_list_table", "list_table");
		delete callParameters.action;
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		this.parentGUID = callParameters.$parentGUID;
		this.settingsDOM=getDOMParsed('<settings>'+(callParameters.$settings==null?'':callParameters.$settings)+'</settings>');
		this.displayCharts = callParameters.$displayCharts;
		this.childObjects=[];		
		this.tableObjects = {};
		this.InResizeEvent = false;
		this.ENABLE_APD_DEBUG = callParameters.ENABLE_APD_DEBUG == null ? false : callParameters.ENABLE_APD_DEBUG;
		this.pageCallParameters = callParameters;
		this.setBaseParameter('schema');
		this.setBaseParameter('table');
		this.useConnection = callParameters.useConnection;
		this.maxResultsToFetch = callParameters.maxResultsToFetch;
		this.queryOpt = callParameters.queryOpt;
		this.maxExecutionTime = AD_HOC_MAX_EXECUTION_TIME;
		this.disableLeftMenu = callParameters.disableLeftMenu != null ? (Object.isString() ? (callParameters.disableLeftMenu == 'true' ? true : false) : callParameters.disableLeftMenu ) : false;
		this.refreshScope = callParameters.refresh == null ? 'replace' :callParameters.refresh;
		this.setBaseParameter('displayColumnsSet');
		this.setBaseParameter('extendedTitle','');
		this.firstLoad = true;
		this.errorIsShowen == false;
		this.reloadIndicatorThreshHold = null;
		this.retrieveId=0;		
		this.objectIsDead = false;
		this.callParameters=callParameters;
		this.getParameter('notifyOnReady');

		if(this.parentStageID!=null) {
			this.parentPanel = getPanel(this.parentStageID, this.parentWindowID,this.parentPanelID);
			this.parentPanel.registerNestedObject(this.elementUniqueID, this);
		}

		if(this.table=='$parentGUID') {
			var tableObject = GET_GLOBAL_OBJECT('list_table', this.parentGUID);
			if(tableObject== null) 
				return;
			this.parentPanel.refresh = false;
			this.parentPanel.refreshType = "noAction";
			this.baseTableData=tableObject.baseTableData;
			this.processDisplaySetup();
			this.draw();
			this.processParameters();
			this.parentPanel.clearLoadIndicator();
			try{
				this.retrieveTableData();
			} catch(e) {
				tableObject.displayCharts=null;
				openModalAlert(" Chart: " +this.chartName + " Error: " + e);
			}
			tableObject.childObjects.push(this);
			return;
		}

		if(callParameters.INITIALIZE_TABLE_DISPLAY == true || callParameters.INITIALIZE_TABLE_DISPLAY == null) {
			var tableName = "";
			var resetPageStage = false;
			if(this.parentPanel!=null)
				this.baseTableData = this.parentPanel.pageState;
	
			tableName = this.schema != null && this.schema != "" ? this.schema + "." + this.table : this.table;
	
			if(this.baseTableData == null) resetPageStage = true;
			else if(this.baseTableData.localTableDeffinition == null) resetPageStage = true;
			else if(this.baseTableData.fullTableName != tableName) resetPageStage = true;
	
			if(resetPageStage) {
				if(this.parentPanel!=null) {
					this.parentPanel.refreshType = "callback";
					this.parentPanel.refreshCallback = 'true;';
				}
				this.baseTableData = {
					fullTableName : tableName,
					tableName : this.table,
					baseResultSet : 0,
					tableCallParameters : callParameters,
					localTableDeffinition : null,
					queryType : "",
					queryOpt : this.queryOpt,
					baseQuery : "",
					commonTableExpressions : null,
					otherTablesToInclude : null,
					displayColumns : null,
					displayColumnsSet : null,
					resultSetIndexByColumnName : null,
					components : null,
					parameters : null,
					orderBy : null,
					where : null,
					baseData : null,
					columnsInfo : null,
					isRowCountComplete : false,
					isSummarized : (getNodesByXPath(this.settingsDOM,this.settingsDOM,'/settings/summarize').length>0),
					baseData : null,
					updateTime : null,
					primaryKeys : null,
					rowsReturned : 0,
					totalRows : 0,
					fetchResultsAfterRow : 0,
					baseMaxResultsToFetch : 100,
					baseMaxExecutionTime : 120,
					maxResultsToFetch : 100,
					titleHeight : 0,
					forceDefinitionReload: callParameters.forceDefinitionReload == null ? false : callParameters.forceDefinitionReload,
					loadInProgress: false,
					output: null
				};
				if(this.parentPanel!=null) {
					this.parentPanel.pageState = this.baseTableData;
					this.parentPanel.startServerLoadIndicator();
				}
				ObjectManager.getTableDefinition(this.table, this.schema, this.callBackText + ".setTableDefinition", this.callBackText + ".setErrorMessage", this.callBackText + ".setLoading", this.baseTableData.forceDefinitionReload, callParameters.baseFolder, callParameters.definitionRetrievalAction, callParameters.definitionRetrievalParameters);
			} else {
				this.parentPanel.refreshType = "callback";
				this.parentPanel.refreshCallback = 'GLOBAL_OBJECT_HOLDER.get(' + this.GUID + ').retrieveTableData()';
	
				if(this.baseTableData.forceDefinitionReload) {
					this.parentPanel.startServerLoadIndicator();
					ObjectManager.removeTableDefinition(this.table, this.schema);
					ObjectManager.getTableDefinition(this.table, this.schema, this.callBackText + ".setTableDefinition", this.callBackText + ".setErrorMessage", this.callBackText + ".setLoading", this.baseTableData.forceDefinitionReload, callParameters.baseFolder, callParameters.baseFolder, callParameters.definitionRetrievalAction, callParameters.definitionRetrievalParameters);
				} else {
					this.processDisplaySetup();
					this.draw();
					this.retrieveTableData();
				}
			}
		}
	},

	setBaseParameter: function(parameter,defaultValue) {
		if(this.pageCallParameters['$'+parameter]!=null)
			this[parameter]=this.pageCallParameters['$'+parameter];
		else if(this.pageCallParameters[parameter]!=null ) {
			this[parameter]=this.pageCallParameters[parameter];
			delete this.pageCallParameters[parameter];
		}
		if(this[parameter]!=null) return;
		if(defaultValue==undefined) return; 
		this[parameter]=defaultValue;
	},

	getParameter: function(parameter,xpath,defaultValue) {
		var settingValue=getNodesByXPath(this.settingsDOM,this.settingsDOM,'/settings/'+(xpath==null?parameter:xpath));
		if(settingValue.length==1)
			this[parameter]=settingValue[0];
		if(this.callParameters['$'+parameter]!=null)
			this[parameter]=this.callParameters['$'+parameter];
		if(this[parameter]!=null) return;
		if(defaultValue==undefined) return; 
		this[parameter]=defaultValue;
	},
		
	setTableDefinition: function(tableDefinitionObject) {
		if(this.parentPanel!=null)
			this.parentPanel.setClientLoadIndicator();
		
		//Table definition is cloned internally to avoid contamination across views 
		tableDefinitionObject = cloneObject(tableDefinitionObject);
		if (tableDefinitionObject.getBaseQuery==null)
			tableDefinitionObject.getBaseQuery = function () { 
				if(typeof this.baseQuery == "string")
					return this.baseQuery;
				var query=""
				for(var i=0;i<this.baseQuery.length;i++) {
					if(isDatabaseConnectionVersion(this.baseQuery[i]))
				 		query+=this.baseQuery[i].value;
				}
				return query;
		  	};
		
		this.baseTableData.sourceDOM=getDOMParsed(tableDefinitionObject.sourceXML);
		this.baseTableData.localTableDeffinition 	= tableDefinitionObject;
		this.baseTableData.tableName 				= tableDefinitionObject.tableName == "" ? this.table : tableDefinitionObject.tableName;
		this.baseTableData.queryType 				= tableDefinitionObject.queryType;
		this.baseTableData.queryOpt 				= (this.queryOpt==null?tableDefinitionObject.queryOpt:this.queryOpt);
		this.baseTableData.baseResultSet 			= tableDefinitionObject.baseResultSet;
		this.baseTableData.baseQuery 				= tableDefinitionObject.baseQuery;
		this.baseTableData.getBaseQuery 			= tableDefinitionObject.getBaseQuery;
		this.baseTableData.commonTableExpressions 	= tableDefinitionObject.commonTableExpressions;
		this.baseTableData.otherTablesToInclude 	= tableDefinitionObject.otherTablesToInclude;
		this.baseTableData.baseMaxResultsToFetch 	= parseInt(tableDefinitionObject.rowsPerPage);
		this.baseTableData.baseMaxExecutionTime 	= parseInt(tableDefinitionObject.maxExecutionTime);
		this.baseTableData.maxResultsToFetch 		= (this.maxResultsToFetch==null ? parseInt(tableDefinitionObject.rowsPerPage) : this.maxResultsToFetch);
		this.baseTableData.maxExecutionTime			= (this.maxExecutionTime == null? parseInt(tableDefinitionObject.maxExecutionTime) : this.maxExecutionTime);
		this.baseTableData.displayColumns 			= tableDefinitionObject.displayColumns;
		this.baseTableData.displayColumnsSet 		= tableDefinitionObject.displayColumnsSet;
		this.baseTableData.components 				= tableDefinitionObject.components;
		this.baseTableData.parameters 				= tableDefinitionObject.parameters;
		this.baseTableData.orderBy 					= tableDefinitionObject.orderBy;
		this.baseTableData.primaryKeys 				= tableDefinitionObject.primaryKeys;
		this.baseTableData.reloadindicator 			= tableDefinitionObject.reloadindicator;
		this.baseTableData.output 					= tableDefinitionObject.output;
		this.baseTableData.history 					= tableDefinitionObject.history;
		this.baseTableData.callTableManipulationModules = this.callTableManipulationModules;

		if(this.parentPanel!=null) {
			this.parentPanel.refreshType = "callback";
			this.parentPanel.refreshCallback = this.callBackText + '.retrieveTableData()';
		}
		
		this.processSummarization();
		this.processDisplaySetup();
		if(this.parentPanel!=null)
			this.draw();
		this.processParameters();
		if(this.parentPanel!=null)
			this.parentPanel.clearLoadIndicator();
		this.retrieveTableData();
	},

	processSummarization: function() {
		var dimensions=getNodesByXPath(this.settingsDOM,this.settingsDOM,'/settings/summarize/dimension');
		this.baseTableData.isSummarized=(dimensions.length>0);
		if(!this.baseTableData.isSummarized) return;
		this.baseTableData.summary=[];
		for(var i=0;i<dimensions.length;i++) {
		   	var dimensionName = dimensions[i].getAttribute('column').toUpperCase();
		   	if (dimensionName == null)
		   		throw 'No name specified for summarize dimension';
		   	var dimensionLevel = dimensions[i].getAttribute('level');
		   	if (dimensionLevel == null)
		   		throw 'No level specified for summarize dimension';
			var component = this.baseTableData.components.column[dimensionName];
			if (component == null)
		   		throw 'Column '+dimensionName+' not found specified for summarize dimension';
			if (component.dimension == null | component.dimension == "" )
		   		throw 'Column '+dimensionName+' is not a dimension in table definition for summarize dimension';
		   	this.baseTableData.summary[dimensionName]=dimensionLevel;
		}
	},

	processParameters: function(pageCallParameters) {
		var thisObject = this;
		var paramLength = thisObject.baseTableData.parameters.length;
		var i = 0;
		var param = null;
		var oldCompareOps = {
								"eq":"=",
								"lt":"<",
								"gt":">",
								"lteq":"<=",
								"gteq":">=",
								"neq":"<>",
								"like":"LIKE",
								"nlike":"NOT LIKE",
								"not":"NOT LIKE",
								"null":"IS NULL",
								"nnull":"IS NOT NULL",
								"between":"BETWEEN"
							};

		var allCallParameters = (pageCallParameters==null?$H(this.pageCallParameters):$H(pageCallParameters));
		allCallParameters.each(function(aCallParameter) {
			var key=aCallParameter.key.toUpperCase();
			var component = thisObject.baseTableData.components.column[key];
			var valueToCompaire = "null";
			
			if(component != null) {
				var compareOp = allCallParameters.get("compare" + aCallParameter.key);
				if(compareOp == null) compareOp = "eq";
				if(oldCompareOps[compareOp.toLowerCase()]!==undefined) compareOp = oldCompareOps[compareOp.toLowerCase()];
				
				if(Object.isString(aCallParameter.value) && component.fieldType==undefined) {
					valueToCompaire = "'" + aCallParameter.value + "'";
				} else {
					if(aCallParameter.value == null) {
						compareOp = "IS";
						valueToCompaire = 'NULL';
					} else if(component.fieldType != 'n' && aCallParameter.value.length>2 && aCallParameter.value.substr(0,1)!="'")
						valueToCompaire = "'" + aCallParameter.value + "'";
					else
						valueToCompaire = aCallParameter.value;	
				}

				var searchNode = {
						type: "value",
						column: key,
						compareType: compareOp,
						value: valueToCompaire
					};

				if(thisObject.baseTableData.where == null)
					thisObject.baseTableData.where = searchNode;	
				else {
					if(	thisObject.baseTableData.where.type.toLowerCase() == "group"
					&& thisObject.baseTableData.where.Operand.toLowerCase() == "and" ) {
						thisObject.baseTableData.where.groupNodes.push(searchNode);
					} else {
						thisObject.baseTableData.where = {
										type:"group",
										Operand: "AND",
										groupNodes: [searchNode,thisObject.baseTableData.where]
									};
					}
				}
			}
			
			if(thisObject.baseTableData.parameters == null) return;

			for(i=0; i<paramLength; i++) 
				if(thisObject.baseTableData.parameters[i].name.toUpperCase() == key)
					thisObject.baseTableData.parameters[i].value = aCallParameter.value;
		});

	},

	destroy: function($super) {
		if(this.table!="$parentGUID")
			if(this.baseTableData!=null)
				if(this.baseTableData.forceDefinitionReload)
					ObjectManager.removeTableDefinition(this.table, this.schema)
		this.objectIsDead = true;
		if (this.doSizeOperation != null)
			clearTimeout(this.doSizeOperation);
		this.doSizeOperation = null;
		$super();
	},
	getDisplayColumns: function() {
		if(this.displayColumnsSet==null)
			return this.baseTableData.displayColumns;
		if(this.baseTableData.displayColumnsSet==undefined) 
			throw 'Display set: "'+this.displayColumnsSet+'" no display sets defined for table';
		if(this.baseTableData.displayColumnsSet[this.displayColumnsSet]==undefined) 
			throw 'Display set: "'+this.displayColumnsSet+'" not found';
		return this.baseTableData.displayColumnsSet[this.displayColumnsSet];
	},
	processDisplaySetup: function() {
		var tempDisplayColumns = this.getDisplayColumns();
		var thisObject = this;
		var elementUniqueID = this.elementUniqueID;
		var GUID = this.GUID;
		var displayClass = "";
		var columnIndex = 0;

		this.baseTableData.displayColumns = [];

		tempDisplayColumns.each(function(Column) {
			if(Column.control) {
				thisObject.baseTableData.display=[];
				thisObject.baseTableData.display.titleDepth=(Column.titleDepth==''?1:2);
				return;
			}
			var tempComponentGroup = thisObject.baseTableData.components[Column.type];
			if(tempComponentGroup == null) {
				openModalAlert(  encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES.TABLE_COMPONENT_GROUP_ERROR, { COMPONENT_NAME:Column.name, COMPONENT_TYPE:Column.type}));
				return;
			}
			var tempComponent = tempComponentGroup[Column.name];
			if(tempComponent == null) {
				openModalAlert( encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES.TABLE_COMPONENT_ERROR, { COMPONENT_NAME:Column.name, COMPONENT_TYPE:Column.type}));
				return;
			}

			renderingClass = TABLE_COLUMN_RENDERING_MODULES.get(Column.type);
			displayClass = "";
			if(renderingClass != null)
				if(renderingClass.getDisplayClass != null)
					displayClass = renderingClass.getDisplayClass(tempComponent);

			if(renderingClass.columnCheck != null)
				if(!renderingClass.columnCheck(thisObject.baseTableData, Column.name))
					return;
				
			tempComponent['visible'] = true;
			thisObject.baseTableData.displayColumns.push({
							'isVisible':Column.isVisible,
							'isUserHidden':Column.isUserHidden,
							'isSummaryHidden':false,
							'index' : columnIndex,
							'type': Column.type,
							'maxSize': Column.maxSize,
							'name': Column.name,
							'title': Column.title,
							'transform': Column.transform,
							'typeName' : Column.type + "_" + Column.name,
							'ptypeNameD' : "\"" + Column.type + "\",\"" + Column.name + "\"",
							'ptypeNameS' : "'" + Column.type + "','" + Column.name + "'",
							'renderingClass' : renderingClass,
							'td1' : "<td class='tableCellRoot " + elementUniqueID + "_ColumnClass_" + Column.type + "_" + Column.name + " " + elementUniqueID + "_RowClass_",
							'td2' : "' id='" + GUID + ".dataTableCell." + Column.type + "." + Column.name + ".",
							'td3' : "'>",
							'div1' : "<div class='" + displayClass + " " + elementUniqueID + "_ColumnContainerClass_" + Column.type + "_" + Column.name + " " + elementUniqueID + "_RowContainerClass_",
							'div2' : "' id='" + elementUniqueID + "_CellValueHolder_" + Column.type + "_" + Column.name + "_",
							'div3' : "' style='height:20px;postition:relative;'>",
							'break': Column['break']
						});
			columnIndex++;
		});
	},
	getDBMS: function(){
		return getConnectionDBMS(this.getUseConnection());
	},
	getDisplayColumnIndex: function(tableObject,columnName) {
		for (var i=0;i<tableObject.baseTableData.displayColumns.length;i++)
			if(tableObject.baseTableData.displayColumns[i].name==columnName) return i;
		throw columnName + " not found in display columns";
	},
	getDisplayColumn: function(tableObject,columnName) {
		return tableObject.baseTableData.displayColumns[tableObject.getDisplayColumnIndex(tableObject,columnName)];
	},
	getUseConnection: function(){
		if(this.baseTableData.localTableDeffinition.useConnectWithTag != null)
			return getConnectionWithTag(this.baseTableData.localTableDeffinition.useConnectWithTag);
		return getActiveDatabaseConnection();
	},
	getQueryBuilder: function(){
 		DBMS = this.getDBMS();
		if(QUERY_BUILDER.get(DBMS) != null) return QUERY_BUILDER.get(DBMS);
		this.setErrorFormatted(DATABASE_NOT_CONNECTED_TEXT);
		return null;
	},
	getQuery: function(){
		this.baseTableData.dynamicHistoricalXMLQuery = true;
		var output = this.getQueryBuilder().buildSelect(this.baseTableData);
		this.baseTableData.dynamicHistoricalXMLQuery = null;
		return output;
	},
	redrawAll: function(){
		this.redraw();
		this.renderTableData();
	},
	retrieveTableData: function(retrieveId,useConnection) {
		if(this.table=='$parentGUID') {
			this.renderTableData();
			return;
		}
		var baseTableData = this.baseTableData;
		if(this.baseTableData.isSummarized) {
		    if(this.dimensionTypesToLoad==null) {
				var dimensionTypes=getNodesByXPath(this.baseTableData.sourceDOM,this.baseTableData.sourceDOM,'//@dimension');
				this.dimensionTypesToLoad=1;
				for(var i=0;i<dimensionTypes.length;i++) { 
					var dimensionType=getDOMParsed('tableDefinitions/dimensions/'+dimensionTypes[i].value+'.xml',null,this.retrieveTableData,this);
					if(dimensionType==null) this.dimensionTypesToLoad++;
				}
			} 
			if (--this.dimensionTypesToLoad>0)
		 		return;
		 	this.setTitle();
		}
		
		if(retrieveId==undefined) {
			if(baseTableData.loadInProgress) return;
			
			baseTableData.loadInProgress = true;
			this.retrieveOutstanding=0;
			this.retrieveStack=[];
			this.errorStack=[];
			this.processingRetrieve=false;
			this.firstResult=true;
			
			if(this.useConnection!=undefined) {
				retrieveTableDataDatabaseConnection(this,++this.retrieveId,this.useConnection);
				return;
			} 
		}
		this.retrieveOutstanding++;

		var elementUniqueID = this.elementUniqueID;
		var thisObject = this;
		var timeSinceLastLoad = new Date().getTime() / 1000;
		
		if(this.reloadIndicatorThreshHold != null)
			timeSinceLastLoad = timeSinceLastLoad - this.reloadIndicatorThreshHold;
		
		if((this.baseTableData.reloadindicator.ageIndicator && timeSinceLastLoad > this.baseTableData.reloadindicator.threshHold) && timeSinceLastLoad > 5)
			this.markOldData(1);
		
		var sqlCount = 0;
		var queryArray = null;
		var tableColumnRenderingModule = null;
		var DBMS = null;
		var POSTDATA = new Object();
		POSTDATA.retrieveId = this.retrieveId;
		
		POSTDATA.USE_CONNECTION = (useConnection==undefined ? this.getUseConnection() : getDatabaseConnectionId(useConnection));
		POSTDATA.ENABLE_APD_DEBUG = this.ENABLE_APD_DEBUG;
		
		if(thisObject.baseTableData.localTableDeffinition.dataRetrievalAction == null)	{
			DBMS = (useConnection==undefined?this.getDBMS():getDatabaseConnectionDBMS(useConnection));
			if (DBMS==null) {
				if(this.useConnection!=null)
						return;
				this.errorStack[this.errorStack.length]={'connection': useConnection , 'error': CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.DATABASE_NOT_CONNECTED_TEXT};
				this.setErrorFormatted(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.DATABASE_NOT_CONNECTED_TEXT);
				baseTableData.loadInProgress = false;
				this.lastDataRetrieveOK=false;
				if(thisObject.notifyOnReady)
					setTimeout(callEval.bind(this,this.notifyOnReady,this),1);
				return;
			}
			if(QUERY_BUILDER.get(DBMS) == null) {
				this.errorStack[this.errorStack.length]={'connection': useConnection , 'error': encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.QUERY_BUILDER_NOT_FOUND,{DBMS:DBMS})};
				this.setErrorFormatted(encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.QUERY_BUILDER_NOT_FOUND,{DBMS:DBMS}));
				baseTableData.loadInProgress = false;
				this.lastDataRetrieveOK=false;
				if(thisObject.notifyOnReady)
					setTimeout(callEval.bind(this,this.notifyOnReady,this),1);
				return;
			}
			var keys = $H(thisObject.baseTableData.components).keys();
			var keyLength = keys.length;
			for(var i=0; i<keyLength; i++)	{
				tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
				if(tableColumnRenderingModule == null) continue;
				if(tableColumnRenderingModule.ContainsSecondaryQueries != true) continue;
				queryArray = tableColumnRenderingModule.secondaryQueries(thisObject);
				if(Object.isString(queryArray)) {
					if(queryArray != "")
						POSTDATA['SQL[' + (sqlCount++) + ']'] = queryArray;
					continue;
				} 
				if(queryArray == null) continue; 
				if(queryArray.length == 0) continue;
				queryArray.each(function(value) { 
					if(Object.isString(value))
							POSTDATA['SQL[' + (sqlCount++) + ']'] = value;
					else
							POSTDATA['SQL[' + value.name + ']'] = value.sql;
				});
			}		
			
			POSTDATA['SQL[CORE_DATA_QUERY]'] = QUERY_BUILDER.get(DBMS).buildSelect(this.baseTableData,this.baseTableData.fetchResultsAfterRow+this.baseTableData.maxResultsToFetch+10);
			POSTDATA.action 				= "executeSQL";
			POSTDATA.returntype 			= 'JSON';
			POSTDATA.displayXML 			= true;
			POSTDATA.displayCLOB			= true;
			POSTDATA.displayXMLinline 		= true;
			POSTDATA.displayCLOBinline 		= true;
			POSTDATA.displayBLOB 			= true;
			POSTDATA.displayDBCLOB 			= true;
			POSTDATA.getRowCount			= true;
			POSTDATA.returnFromRow			= this.baseTableData.fetchResultsAfterRow;
			POSTDATA.maxExecutionTime		= this.baseTableData.maxExecutionTime;
			POSTDATA.maxRowReturn			= this.baseTableData.maxResultsToFetch;
			//Optimization since we do not need to display the queries 
			POSTDATA.doNotReturnSQL 		= !ALLOW_DEVELOPER_VIEW;
			POSTDATA.queryOpt				= this.baseTableData.queryOpt;
		} else {
			$H(this.pageCallParameters).each(function (parm) {
				POSTDATA[parm.name] = parm.value;
			});
			this.baseTableData.parameters.each(function (parm) {
				POSTDATA[parm.name] = parm.value;
			});
			
			POSTDATA.returntype = 'JSON';
			POSTDATA.action 	= this.baseTableData.localTableDeffinition.dataRetrievalAction;
		}
		
		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
						if(thisObject.parentPanel==null) return;
						thisObject.parentPanel.startServerLoadIndicator();
						if(this.errorIsShowen || thisObject.firstLoad || (thisObject.baseTableData.reloadindicator.fullScreenNotifier && timeSinceLastLoad > thisObject.baseTableData.reloadindicator.threshHold))
							thisObject.setError("<table id='" + elementUniqueID + "_Object_To_Fit_To_Panel' style='width:" + thisObject.width + "px;height:" + thisObject.height + "px;position:static;'cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr></table>");
					},
					'onComplete' : function(transport) {
						if(thisObject.retrieveId > transport.request.parameters.retrieveId ) return;
						if(thisObject.parentPanel!=null)
							thisObject.parentPanel.clearLoadIndicator();
						if (thisObject.firstLoad) {
							thisObject.firstLoad = false;
							try{							
								thisObject.displayChildCharts();
							} catch (e) {
								thisObject.setErrorFormatted("Error processing charts "+e.toString());
							}
						}
						baseTableData.loadInProgress = false;
						thisObject.reloadIndicatorThreshHold = new Date().getTime() / 1000;
						if(thisObject.notifyOnReady)
							setTimeout(callEval.bind(thisObject,thisObject.notifyOnReady,thisObject),1);
					},
					'onSuccess': function(transport) {
						if(thisObject.retrieveId > transport.request.parameters.retrieveId ) return;
						thisObject.retrieveOutstanding--;
						if(thisObject.processingRetrieve) {
							thisObject.retrieveStack.push(transport);
							return;
						} 
						thisObject.processingRetrieve=true;
						thisObject.lastDataRetrieveOK=false;

						if(thisObject.parentPanel!=null)
							thisObject.parentPanel.setClientLoadIndicator();
						if(thisObject.objectIsDead) return;
						
						if(thisObject.connectionOfData==null)
							thisObject.connectionOfData=transport.request.parameters.USE_CONNECTION;
						else if(thisObject.connectionOfData!=transport.request.parameters.USE_CONNECTION) {
							thisobject.baseTableData.baseData=[];
							thisobject.baseTableData.history.data=[];
							thisObject.connectionOfData=transport.request.parameters.USE_CONNECTION;
						}
						
						var retrievedData=transport;
						while(retrievedData!=null) {
							thisObject.processingRetrieve=true;
							try{thisObject.processRetrievedData(retrievedData);}
							catch (e) {
								thisObject.errorStack[thisObject.errorStack.length]={'connection': transport.request.parameters.USE_CONNECTION , 'error': e };
								if(thisObject.retrieveOutstanding+thisObject.retrieveStack.length>0 ) {
									if ((e instanceof Array?e[0]:e).substr(0,13) =='No connection') {
										retrievedData=thisObject.retrieveStack.shift();
										continue;
									}
								}
								if(e instanceof Array)
									thisObject.setErrorFormatted(e[0],e[1]);
								else 
									thisObject.setErrorFormatted(decodeURI(e));
								return;
							}
							retrievedData=thisObject.retrieveStack.shift();
							thisObject.processingRetrieve=false;
						}
						thisObject.lastDataRetrieveOK=true;
						thisObject.renderTableData();
						try{
							for(var i=0;i<thisObject.childObjects.length;i++) 
								thisObject.childObjects[i].renderTableData();
						} catch (e) {
							thisObject.setErrorFormatted("Error rendering dependent object " , e.toString());
						};
					},
					'onException': function(transport,exception) {
						thisObject.lastDataRetrieveOK=false;
						thisObject.retrieveOutstanding--;
						if(thisObject.retrieveId > transport.parameters.retrieveId ) return;
						var error = (exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.message : exception ));
						thisObject.errorStack[thisObject.errorStack.length]={'connection': transport.parameters.USE_CONNECTION , 'error':error};
						baseTableData.loadInProgress = false;
						thisObject.setErrorFormatted("Error loading table data" , error);
					},
					'onFailure': function(transport,exception) {
						thisObject.lastDataRetrieveOK=false;
						thisObject.retrieveOutstanding--;
						if(thisObject.retrieveId > transport.request.parameters.retrieveId ) return;
						baseTableData.loadInProgress = false;
						if(transport.responseJSON!=null)
							if(transport.responseJSON.returnValue!=null) {
								thisObject.setErrorFormatted(decodeURI(transport.responseJSON.returnValue));
								return;
							}
						var error = (exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.name+" : "+exception.description : exception ));
						thisObject.errorStack[thisObject.errorStack.length]={'connection': transport.request.parameters.USE_CONNECTION , 'error':error};
						thisObject.setErrorFormatted("Error loading table data ",(exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.name+" : "+exception.description : exception )));
					}
			});
	},
	displayChildCharts: function() {
		var chartName=(this.displayCharts==null ? [] : this.displayCharts.split(',') );
		for(var i=0;i<chartName.length;i++) {
			chartSettings=getNodesByXPath(this.baseTableData.sourceDOM,this.baseTableData.sourceDOM,"table/charts/chart[@name='"+chartName[i]+"']");
			if(chartSettings.length==0) continue;
			target=getPanel(this.parentStageID, this.parentWindowID,chartName[i]);
			if(target==null) continue;
			loadLink({
				 type:"leaf"
				,target: chartName[i]
				,window: this.parentWindowID
				,windowStage: this.parentStageID
				,connectionRequired: false
				,formList: null
				,type: "LINK"
				,data:{
					parameters:{
						 $parentGUID: this.GUID
						,action: "chart"
						,table: "$parentGUID"
						,refTarget: chartName[i]
						,$chartName: chartName[i]
						}
					}
				});
		}
	},
	test: {
		 "eq"		: function(data,operand) {return (data==operand);}
		,"="		: function(data,operand) {return (data==operand);}
		,gt			: function(data,operand) {return (data>operand);}
		,">"		: function(data,operand) {return (data>operand);}
		,ge			: function(data,operand) {return (data>=operand);}
		,">="		: function(data,operand) {return (data>=operand);}
		,lt			: function(data,operand) {return (data<operand);}
		,"<"		: function(data,operand) {return (data<operand);}
		,le			: function(data,operand) {return (data<=operand);}
		,"<="		: function(data,operand) {return (data<=operand);}
		,contains	: function(data,operand) {return (data.search(value)>0);}
		,isnull		: function(data) {return data==null;}
		,"is null"	: function(data) {return data==null;}
		,isempty	: function(data){return data=="";}
		,"is empty"	: function(data){return data=="";}
		,"empty"	: function(data){return data=="";}
		,rowfirst	: function(array,i,operand) {return i<(operand==null?1:operand);}
		,rowlast	: function(array,i,operand) {return i>=(array.length-(operand==null?1:operand));}
	},
	getAttribute: function(node,name,error) {
		try{
			return node.getAttribute(name);
		} catch(e) {
			throw "filter "+node.nodeName+" cannot find expected attribute "+name;
		}
	},
	findColumnIndex: function(columnName) {
		for (var i= 0; i < this.baseTableData.columnsInfo.name.length; i++)
			if(this.baseTableData.columnsInfo.name[i]==columnName) return i;
		throw "column "+columnName+" not found";
	},
	findInternalColumnIndex: function(columnName) {
		try{
			return this.baseTableData.components.column[columnName.toUpperCase()].localQueryDataIndex
	    } catch(e) {
			throw "column "+columnName+" not found";
		}
	},
	getRowFilters: function(node,dom,resultSet) {
		var rowFilters=[];
		if(node==null) return rowFilters;
		if(dom==null) dom=this.baseTableData.sourceDOM;
		if(typeof node === "string") {
			var filters=getNodesByXPath(dom,dom,node);
			if(filters.length==0) rowFilters;
		} else
			var filters=[node];
		for(var f=0;f<filters.length;f++) {
			filter=getNodesByXPath(dom,filters[f],'./*');
			for(var i=0;i<filter.length;i++) {
   				operator=this.getAttribute(filter[i],"operator").toLowerCase();
   				rowFilters[i]={};
   				rowFilters[i].operand = filter[i].getAttribute('value');
				switch(filter[i].nodeName) {
					case 'column':
		   				var columnName = this.getAttribute(filter[i],"name");
		   				if (columnName==null) throw 'No column name specified for column row filter';
		   				rowFilters[i].column=this.getColumn(resultSet,columnName);
		   				if(this.test[operator]==null)
		   					throw 'Operator "'+operator+'" invalid column filter';
		   				rowFilters[i].match=this.test[operator];
		   				rowFilters[i].isColumnTest=true;
		   				continue;
		   			case 'row':
		   				if(this.test["row"+operator]==null)
		   					throw 'Operator "'+operator+'" invalid row filter';
		   				rowFilters[i].match=this.test["row"+operator];
		   				rowFilters[i].isColumnTest=false;
		   				continue;
			   		default:
	   					throw 'Invalid filter '+filter[i].nodeName;
		   		}
			}
		}
		return rowFilters;
	},
	matchFilter: function(filters,table,i) {
		if(filters==null) return false;
		for( var j=0 ; j<filters.length ; j++)
			if(filters[j].isColumnTest) {
				if( filters[j].match(table[i][filters[j].column],filters[j].operand) ) return true;
			} else
				if( filters[j].match(table,i,filters[j].operand) ) return true;
		return false;
	},
	copyFilteredRows: function(source,target,filters) {
		if(source==null || target==null) return;
		if(arguments.length<2) return;
		row:for(var i=0;i<source.length;i++)	{
			for(var j=2;j<arguments.length;j++) {
				if(arguments[j]==null) continue;
				if(this.matchFilter(arguments[j],source,i)) continue row;
			}
			target.push(source[i]);
		}
	},
	getFilteredRows: function(table,filters) {
		if(arguments.length<2) return table;
		if(filters==null) return table;
		var resultSet=[];
		for(var j=1;j<arguments.length;j++) this.copyFilteredRows(table,resultSet,arguments[j]);
		return resultSet;
	},
	filterRows: function(resultSet) {
		if(this.baseTableData.filters.length==0) return;
		resultSet.data = this.getFilteredRows(resultSet.data,this.baseTableData.filters);
		resultSet.rowsReturned=resultSet.data.length;
	},
	getColumn: function(resultSet,column) {
		var columnUpper=column.toUpperCase();
		for(var i = 0; i < resultSet.columnsInfo.name.length; i++)
			if(columnUpper == resultSet.columnsInfo.name[i].toUpperCase())
		    	return i;
		throw 'Error, column "'+column+'" not found in result set';
	},
	getExpressionResult : function(expression,baseTableData,row) {
		switch (expression.operator) {
			case 'constant':
				return expression.value;
			case 'column':
				try{
					columnIndex=baseTableData.resultSetIndexByColumnName[expression.name.toUpperCase()];
					if(columnIndex!=undefined)
						return baseTableData.baseData[row][columnIndex];
				} catch(e) {				}
			case 'parameter':
				for(var i=0;i<baseTableData.parameters.length;i++)
					if(baseTableData.parameters[i].name==expression.name) break;
				if(i<baseTableData.parameters.length)
					return baseTableData.parameters[i].value;
				throw expression.operator+' "'+expression.name+'" not found';
			default:
				if(expression.operands.length<1)
					throw "Expression requires at least 1 operand";
				var value=this.getExpressionResult(expression.operands[0],baseTableData,row);
				for(var i = 1; i < expression.operands.length; i++)
					switch (expression.operator) {
						case 'concat':
						case '||':
						case '+':
							value+=this.getExpressionResult(expression.operands[i],baseTableData,row);
							break;
						case '-':
							value-=this.getExpressionResult(expression.operands[i],baseTableData,row);
							break;
						case '*':
							value *= this.getExpressionResult(expression.operands[i],baseTableData,row);
							break;
						case '/':
							value/=this.getExpressionResult(expression.operands[i],baseTableData,row);
							break;
						default:
							throw 'Unknown operator "'+expression.operator+'" in expression';
					} 
				return value;
		}
	},
	processRetrievedData: function(transport) {
		var result = transport.responseJSON;
		if(result == null) return;

		if(result.flagGeneralError == true && result.connectionError == true)
			initiateConnectionRefresh();
		var baseTableData = this.baseTableData;
		if(result.flagGeneralError || result.returnCode == "false") {
			if(Object.isString(result.returnValue)) throw result.returnValue;
			if(!baseTableData.localTableDeffinition.ignoreSQLWarnings) 
				throw [result.returnValue.STMTMSG , result.returnValue.STMT];
		}
		if(baseTableData.localTableDeffinition.dataRetrievalAction == null) {
			if (!result.returnValue.STMTReturn['CORE_DATA_QUERY'].statementSucceed ) 
				throw [result.returnValue.STMTReturn['CORE_DATA_QUERY'].STMTMSG , result.returnValue.STMTReturn['CORE_DATA_QUERY'].STMT];
			var resultSet=result.returnValue.STMTReturn['CORE_DATA_QUERY'].resultSet[baseTableData.baseResultSet ];
		} else var resultSet = result.returnValue;

		if(resultSet.data.length>0) {
			this.baseTableData.filters=this.getRowFilters('/table/filters',this.baseTableData.sourceDOM,resultSet);
			this.filterRows(resultSet);
			var value=null;
			for (column in this.baseTableData.components.column) {
				generated = this.baseTableData.components.column[column].generated;
				if(generated == undefined) continue;
				if(generated == null) continue;
				generateAction=generated.split(',');
				var action=generateAction[0].toLowerCase();
				switch (action) {
					case 'timestamp':
						var d=new Date();
						month=d.getMonth()+1;
						day=d.getDate();
						hour=d.getHours();
						minute=d.getMinutes();
						second=d.getSeconds();
						value=d.getFullYear()+'-'+(month<10?'0':'')+month+'-'+(day<10?'0':'')+day
							+ ' '+(hour<10?'0':'')+hour +':'+(minute<10?'0':'')+minute+':'+(second<10?'0':'')+second
							+ '.'+'000000';
						break;
					case 'connection':
						value=transport.request.parameters.USE_CONNECTION;
						break;
					case 'getstringafterdelimiter':
					    var columnIndex=this.getColumn(resultSet,generateAction[1]);
					    var wordPosition=parseInt(generateAction[2]);
					    var delimiter=generateAction[3];
					   	break;
					case 'normalize':
					case 'percent':
					case 'percentage':
					    var normalizerIndex=this.baseTableData.components.column[generateAction[2].toUpperCase()].dataIndex;
					    if(normalizerIndex==null) {
					    	for(var j=0;j<resultSet.columnsInfo.name.length;j++) 
					    		this.baseTableData.components.column[resultSet.columnsInfo.name[j].toUpperCase()].dataIndex=j;
						    normalizerIndex=this.baseTableData.components.column[generateAction[2].toUpperCase()].dataIndex;
					    }
					    if(normalizerIndex==null) 
							throw 'Error in generate column: "'+generated+'" error: '+generateAction[2]+' not found';
					    var valueIndex=this.baseTableData.components.column[generateAction[1].toUpperCase()].dataIndex;
					    if(valueIndex==null) 
							throw 'Error in generate column: "'+generated+'" error: '+generateAction[1]+' not found';
						break;
					case 'regexp':
					    var columnIndex=this.getColumn(resultSet,generateAction[1]);
					    try{
							var regPattern=new RegExp(generateAction[2],generateAction[3]);
						} catch(e) {
							throw "generated error in RegExp "+generateAction[2]+" error: "+e;
						}
						break
					case 'substring':
					case 'substr':
					    var columnIndex=this.getColumn(resultSet,generateAction[1]);
					    var startPosition=parseInt(generateAction[2]);
					    var stringLength=parseInt(generateAction[3]);
						break;
					case 'word':
						if(generateAction[3]==undefined)
							wordPattern=/\s+/g;
						else
						    wordPattern=new RegExp('/'+generateAction[3]+'/','g');
					    var columnIndex=this.getColumn(resultSet,generateAction[1]);
					    var wordPosition=parseInt(generateAction[2])-1;
					    var wordPositionLimit=wordPosition+2;
						break;
					default:
						throw 'Invalid generate column: "'+generated+'"';
				}
				if(resultSet.data.length>0) {
					this.baseTableData.components.column[column].localQueryDataIndex=resultSet.data[0].length;
					for(var i=0;i<resultSet.data.length;i++) {
						switch (action) {
						    case 'getstringafterdelimiter':
						    	value=getStringAfterDelimiter(resultSet.data[i][columnIndex],wordPosition,delimiter);
						    	break;
							case 'normalize':
							    normalizer = resultSet.data[i][normalizerIndex];
						    	value = (normalizer==0 ? null : resultSet.data[i][valueIndex]/normalizer);
						    	break;
							case 'percent':
							case 'percentage':
							    normalizer = resultSet.data[i][normalizerIndex];
						    	value = (normalizer==0 ? null : 100*resultSet.data[i][valueIndex]/normalizer);
						    	break;
						    case 'regexp':
						    	value=resultSet.data[i][columnIndex].split(regPattern,1)[0];
						    	break;
						    case 'substr':
						    	if(isNaN(stringLength))
							    	value=resultSet.data[i][columnIndex].substr(startPosition);
						    	else
							    	value=resultSet.data[i][columnIndex].substr(startPosition,stringLength);
						    	break;
						    case 'substring':
						    	value=resultSet.data[i][columnIndex].substring(startPosition,stringLength);
						    	break;
						    case 'word':
						    	try{
						    		value=resultSet.data[i][columnIndex].trim().split(wordPattern,wordPositionLimit)[wordPosition];
						    		var test=resultSet.data[i][columnIndex].split(wordPattern,wordPositionLimit);
						    	} catch(e) {}
						    	if(value==undefined) 
						    		value="";
						    	break;
						}
						resultSet.data[i][resultSet.data[i].length]=value;
					}
				}
			}
		}

		if (!this.firstLoad) 
			if ( baseTableData.rowsReturned > 0 ) {
				switch (this.refreshScope) {
					case 'replace':
						if(this.firstResult) break;
					case 'append':
						baseTableData.baseData.concat(resultSet.data);
						if(baseTableData.baseData.length > this.maxResultsToFetch)
							baseTableData.baseData = baseTableData.baseData.slice(baseTableData.baseData.length-this.maxResultsToFetch)
					case 'prepend':
						baseTableData.baseData 				= resultSet.data.concat(baseTableData.baseData);
						if( baseTableData.baseData.length > this.maxResultsToFetch)
							baseTableData.baseData = baseTableData.baseData.slice(0,this.maxResultsToFetch)
					default:
						if(this.firstResult) 
							baseTableData.updateTime 		= resultSet.resultTime;
						else
							baseTableData.updateTime 		+= resultSet.resultTime;
						
						baseTableData.rowsReturned 			= baseTableData.baseData.length;
						baseTableData.totalRows 			= baseTableData.baseData.length; 
						baseTableData.isRowCountComplete 	= true;
						return;
				}
				if(baseTableData.history!=null) 
					if(baseTableData.history.data.unshift(baseTableData.baseData)>baseTableData.history.depth) baseTableData.history.data.pop() ;
			}
		this.resetLocalQueryDataIndex(baseTableData);
		baseTableData.resultSetIndexByColumnName = {};
						
		var i;
		for(i = 0; i < resultSet.columnsInfo.name.length; i++) {
			resultSet.columnsInfo.name[i] = resultSet.columnsInfo.name[i].toUpperCase();
			baseTableData.resultSetIndexByColumnName[resultSet.columnsInfo.name[i]] = i;
		}
		baseTableData.columnsInfo 			= resultSet.columnsInfo;
		for (column in this.baseTableData.components.column) {
			generated = this.baseTableData.components.column[column].generated;
			if(generated == null) continue;
			baseTableData.resultSetIndexByColumnName[column] = i;
			switch (generated) {
				case 'timestamp':
					baseTableData.columnsInfo.type[i]='timestamp';
				default:
					baseTableData.columnsInfo.type[i]='string';
			}
			i++;
		}
		baseTableData.baseData 				= resultSet.data;
		baseTableData.updateTime 			= resultSet.resultTime;
		baseTableData.rowsReturned 			= parseInt(resultSet.rowsReturned);
		baseTableData.totalRows 			= resultSet.rowsInSet; 
		baseTableData.isRowCountComplete 	= resultSet.isRowCountComplete;
		
		if(resultSet == null) return;
			
		if(baseTableData.localTableDeffinition.dataRetrievalAction == null) {
			var queryArray = null;
			var keys = $H(baseTableData.components).keys();
			var keyLength = keys.length;
			var tableColumnRenderingModule = null;
			for(var i=0; i<keyLength; i++)	{
				tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
				if(tableColumnRenderingModule == null) continue;
				if(tableColumnRenderingModule.ContainsSecondaryQueries != true) continue;
				tableColumnRenderingModule.processSecondaryQueriesReturn(baseTableData, result.returnValue.STMTReturn);
			}
		}
		this.firstResult=false;
	},

//	breakRow: function() {
//		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
//			if(aTMModule.value.rowBreakBefore != null)
//				RAWdata += aTMModule.value.rowBreakBefore(currentRow, thisObject);
//			if(aTMModule.value.rowBreakAfter != null)
//				RAWdata += aTMModule.value.rowBreakAfter(currentRow, thisObject);
//		})
//	},

	renderTableData: function() {
		this.clearError();
		if(this.errorStack!=null) 
			if(this.errorStack.length>0) {
				this.setErrorFormatted(this.errorStack);
				return;
			}
		if(this.baseTableData.rowsReturned == 0) {
			this.setErrorFormatted('SQL_NO_DATA');
			return;
		}
		
		var rowHolder = this.getTableObject("displayData");
		if(rowHolder == null) return;

		var elementUniqueID = this.elementUniqueID;
		var GUID = this.GUID;
		var thisObject = this;
		var rowColor = 0;
		var rowID = "";
		var row = null;
		var colorSet = MASTER_TABLE_COLOR_SET[0];
		var displayColumnsLength = this.baseTableData.displayColumns.length;
		var displayColumn = null;
		var TableData = "<tbody>";

		for(var i=0; i < displayColumnsLength; i++)	{
			displayColumn = this.baseTableData.displayColumns[i];
			displayColumn.isHidden=(!displayColumn.isVisible||displayColumn.isUserHidden||displayColumn.isSummaryHidden);
		}
		for(var i=0; i < displayColumnsLength; i++)	{
			displayColumn = this.baseTableData.displayColumns[i];
			if(displayColumn.renderingClass != null) continue;
			displayColumn.renderingClass.render =
				function (tableObject, rowToRender, columnObject, maskingColumn, displayColumn) {
						return "<font style='color:red;font-weight: bold;'>I don't know how to render a type of '" + displayColumn.type + "'</font>";
					};
		}

		if(Prototype.Browser.IE && IE_SPEED_EXTENSION) {
			this.IErenderTableData();
			return;
		}

		var RAWdata=""
			,currentRow=0;
		
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++) {
			RAWdata = "<td class='tableRowNumbering tableCellRoot' id='" + GUID + ".rowNumber." + currentRow + "'>"
					+ 	"<div class='" + elementUniqueID + "_ColumnContainerClass_index_index " + elementUniqueID + "_RowContainerClass_" + currentRow + "' id='" + elementUniqueID + "_Row_" + currentRow + "_Column_index_index' style='text-align:center;vertical-align: middle;postition:relative;'>&nbsp;"
					+ (this.baseTableData.fetchResultsAfterRow + currentRow + 1) + "&nbsp;&nbsp;</div></td>";
			for(var i=0; i < displayColumnsLength; i++)	{
				displayColumn = this.baseTableData.displayColumns[i];
				if(displayColumn.isHidden) continue;
				RAWdata += displayColumn.td1 + currentRow + displayColumn.td2 + currentRow + displayColumn.td3 + displayColumn.div1 + currentRow + displayColumn.div2 + currentRow + displayColumn.div3
						+ displayColumn.renderingClass.render(thisObject, currentRow, thisObject.baseTableData.components[displayColumn.type][displayColumn.name],null,displayColumn)
						+ "</div></td>";
			}
			rowColor = colorSet[currentRow % 2];
			TableData += "<tr id='" + elementUniqueID + "_Row_" + currentRow + "' style='height:20px;background-color:" + rowColor + ";'>" + RAWdata + " </tr>";
		}
		TableData += "</tbody>";
		rowHolder.update(TableData);
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++) {
			row = $(this.elementUniqueID + "_Row_" + currentRow);
			if(row != null)
				if(this.baseTableData.localTableDeffinition.rowStyle != null)
					row.setStyle(this.processRowStyle(currentRow));
		}
			
		var pageSelector = this.getTableObject("pageNumberingArea");
		if(pageSelector != null) {
			if(this.baseTableData.rowsReturned == this.baseTableData.totalRows.rowsFound && this.baseTableData.totalRows.endFound && this.baseTableData.fetchResultsAfterRow == 0)
				pageSelector.update("");
			else
				pageSelector.update(TABLE_MANIPULATION_MODULES.get("Integrated_PageSwitcher").generateText(this));
		}
		this.setSizingCall(true);
	},
	
	IErenderTableData: function() {
		var callBackText = this.callBackText
			,RAWdata = "<td></td>"
			,displayColumnsLength=this.baseTableData.displayColumns.length
			,i;
		for(i=0; i < displayColumnsLength; i++)	{
			displayColumn = this.baseTableData.displayColumns[i];
			if(displayColumn.isHidden) continue;
			displayColumn.RevisedTitle=thisObject.textFold(thisObject.baseTableData.display.titleDepth,(thisObject.baseTableData.components[displayColumn.type]==null ? "" : (  displayColumn.title=="" ? thisObject.baseTableData.components[displayColumn.type][displayColumn.name].title : displayColumn.title )));
			var cell="";
			//Insert Loop for table manipulation modules column header data
			TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
				if(aTMModule.value.columnHeaderInterface != null)
					cell += aTMModule.value.columnHeaderInterface(displayColumn, thisObject);
			});
			if(displayColumn.isSummaryHidden) {
				displayColumn.isHidden=true;
				continue;
			}
			RAWdata += "<td id='" + elementUniqueID + "_ColumnTitleCell_" + displayColumn.typeName + "' style='border-left-color:#afafaf;border-left-width:2px;border-left-style:ridge;'>"
					+ 		"<table cellpadding='0' cellspacing='0' style='height: 20px;width:100%;'>"
					+ 			"<tr>"
					+ 				cell
					+ 				"<td valign='center' id='" + elementUniqueID + "_ColumnTitleText_" + displayColumn.typeName + "' onmousedown='" + callBackText + ".columnMouseDown(" + displayColumn.ptypeNameD + ")' ondblclick='" + callBackText + ".columnHeadMouseDoubleClickAction(event, " + displayColumn.ptypeNameD + ")' onclick='" + callBackText + ".columnHeadMouseClickAction(event, " + displayColumn.ptypeNameD + ")' oncontextmenu='" + callBackText + ".columnHeadContextMenu(event, " + displayColumn.ptypeNameD + ")' >"
					+ 				"<nobr>&nbsp;" + displayColumn.RevisedTitle + "&nbsp;&nbsp;</nobr>"
					+ 				"</td></tr>"
					+ 		"</table>"
					+ 	"</td>";
		}
		TableData += "<tr class='contextRootBase' id='" + elementUniqueID + "_TableTitlerRow'>" + RAWdata + " </tr>";
				
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++) {
			RAWdata = "<td class='tableRowNumbering tableCellRoot' id='" + GUID + ".rowNumber." + currentRow + "'>"
					+ (this.baseTableData.fetchResultsAfterRow + currentRow + 1) + "&nbsp;&nbsp;</td>";
			for(i=0; i < displayColumnsLength; i++) {
				displayColumn = this.baseTableData.displayColumns[i];
				if(displayColumn.isHidden) continue;

				RAWdata += "<td>"+displayColumn.td1 + currentRow + displayColumn.td2 + currentRow + displayColumn.td3
						+ displayColumn.renderingClass.render(thisObject, currentRow, thisObject.baseTableData.components[displayColumn.type][displayColumn.name],null,displayColumn)
						+ "</td>";
			}
			rowColor = colorSet[currentRow % 2];
			TableData += "<tr id='" + elementUniqueID + "_Row_" + currentRow + "' style='height:20px;background-color:" + rowColor + ";'>" + RAWdata + " </tr>";
		}
		TableData += "</tbody>";
		rowHolder.update(TableData);
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++) {
			if(this.baseTableData.localTableDeffinition.rowStyle == null) continue;
			row = $(this.elementUniqueID + "_Row_" + currentRow);
			if(row == null) continue;
			row.setStyle(this.processRowStyle(currentRow));
		}
		
		var pageSelector = this.getTableObject("pageNumberingArea");
		if(pageSelector == null) return;
		if(this.baseTableData.rowsReturned == this.baseTableData.totalRows.rowsFound && this.baseTableData.totalRows.endFound && this.baseTableData.fetchResultsAfterRow == 0)
			pageSelector.update("");
		else
			pageSelector.update(TABLE_MANIPULATION_MODULES.get("Integrated_PageSwitcher").generateText(this));
	},

	findRow: function(row,baseData,keys) {
		var colMatchIndex=( keys==null
							? ( this.baseTableData.primaryKeys==undefined ? [] : this.getColumnIndex(this.baseTableData.primaryKeys)  ) 
							: (keys instanceof Array ? keys : this.getColumnIndex(keys) )
							);
		if (colMatchIndex.length==0) return;
		if (baseData==null) baseData=this.baseTableData.baseData;
		for (var i=0;i<baseData.length;i++) 
			if(this.rowMatch(row,baseData[i],colMatchIndex)==0) return baseData[i];
	},

	getColumnIndex: function(columnList,tableList) {
		if (tableList==null) tableList=this;
		var groupingArray = (columnList instanceof Array ? columnList : columnList.split(","));
		groupIndex=[];
		try{
			for (var j=0; j<groupingArray.length;j++)
				groupIndex[j]=tableList.baseTableData.resultSetIndexByColumnName[groupingArray[j]];
		} catch(e) {
			throw "list_table getColumnIndex column "+groupingArray[j]+" not found in table";
		}
		return groupIndex; 
	},
	
	rowMatch: function(rowA,rowB,colMatchIndex) {
		for (var i= 0; i < colMatchIndex.length; i++) {
			var j=colMatchIndex[i];
			if( rowA[j] >  rowB[j] ) return 1;
			if( rowA[j] <  rowB[j] ) return -1;
		}
		return 0;
	},
	sortData: function(baseData,keys) {
		var colMatchIndex=(keys==null? ( this.baseTableData.primaryKeys==undefined ? [] : this.getColumnIndex(this.baseTableData.primaryKeys)  ) : this.getColumnIndex(keys) );
		if (colMatchIndex.length==0) return;
		var thisObject=this;
		baseData.sort(function(a,b){return thisObject.rowMatch(a,b,colMatchIndex)});
	},
	setSizingCall: function(callnow) {
		if (this.doSizeOperation != null)
			clearTimeout(this.doSizeOperation);
		this.doSizeOperation = null;
		if(callnow != null && callnow == true)
			this.size();
		else
			this.doSizeOperation = setTimeout(this.callBackText + ".size()", 100);
	},
	size: function() {
		if(this.InResizeEvent) return;
		var thisObject = this;
		var table = $(this.elementUniqueID + "_ColumnTitleHolder_index_index");
		var column = $(this.GUID + ".rowNumber.0");
		var colWidth = 0;
		
		if(column != null && table != null) {
			$(this.elementUniqueID + "_ColumnTitleHolder_index_index");
			table.setStyle({width:column.scrollWidth + "px"});
		}
		if(this.baseTableData == null) return;
		if(this.baseTableData.displayColumns == null) return;

		this.baseTableData.displayColumns.each(function(displayColumn) {
			if(!displayColumn.isVisible||displayColumn.isUserHidden) return;
			var column = $(thisObject.elementUniqueID + "_ColumnTitleHolder_" + displayColumn.typeName);
			var topCell = $(thisObject.GUID + ".dataTableCell." + displayColumn.type + "." + displayColumn.name + ".0");
			var firstColumn = $(thisObject.elementUniqueID + "_CellValueHolder_" + displayColumn.typeName + "_0");
				
			if(topCell == null || column == null || firstColumn == null) return;

			var topCellWidth = topCell.scrollWidth - (parseInt(topCell.getStyle('paddingLeft')) + parseInt(topCell.getStyle('paddingRight')));
			var columnWidth = column.scrollWidth - (parseInt(column.getStyle('paddingLeft')) + parseInt(column.getStyle('paddingRight')));
			
			if(topCellWidth > columnWidth)	{
					firstColumn.setStyle({width:topCellWidth + "px"});
					column.setStyle({width:topCellWidth + "px"});
			} else 	{
					firstColumn.setStyle({width:columnWidth + "px"});
					column.setStyle({width:columnWidth + "px"});
			}
		});
	},

	markOldData: function(age) {
		var row = null
			,colorSet = MASTER_TABLE_COLOR_SET[age];
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++) {
			row = $(this.elementUniqueID + "_Row_" + currentRow);
			if(row != null)
				row.setStyle({'backgroundColor':colorSet[currentRow % 2]});
		}
	},

	textFold: function(lines,text) {
		if(lines<2) return text;
		if (text.indexOf('<br/>') >= 0 ) return text;
		if (text.length < 5) return text;
		spacePos=text.indexOf(' ',text.length/2);
		if (spacePos < 0) 
			spacePos=text.lastIndexOf(' ', text.length/2) ;
		if (spacePos < 0) return text; 
		return text.substr(0,spacePos)+'<br/>'+text.substr(spacePos+1);
	},

	draw: function() {
		var thisObject = this
			,sortDirection = null
			,sortIndex = null;
		
		var output = "<div id='" + this.elementUniqueID + "_mainDisplayArea' style='width:100%;height:100%;overflow:hidden;position:static;'>";
		if(!Prototype.Browser.IE || !IE_SPEED_EXTENSION) {
			this.baseTableData.titleHeight = 20 * ( this.baseTableData.display==null ? 1 : ( this.baseTableData.display.titleDepth==null ? 1 : this.baseTableData.display.titleDepth ));
			output += "<div class='contextRootBaseHeader' id='" + this.elementUniqueID + "_titleDisplayArea' style='height:" + this.baseTableData.titleHeight + "px; overflow:hidden; position:static;'>"
					+ 	"<table class='tableHeader' id='" + this.elementUniqueID + "_title' style='padding:0px;margin:0px;' cellpadding='0px' cellspacing='0px' >"
					+ 		"<tr id='TableTitlerRow'><td/><td><div id='" + this.elementUniqueID + "_ColumnTitleHolder_index_index' class='tableTitleElement' style='height:"+this.baseTableData.titleHeight+"px;'/></td><td><div class='columnDivider' style='height:"+this.baseTableData.titleHeight+"px;' onmousedown='" + this.callBackText + ".inishilizeColumnHeadResize(\"index\", \"index\");'/></td>";

			this.baseTableData.displayColumns.each(function(displayColumn) {
				if(!displayColumn.isVisible||displayColumn.isUserHidden) return;
				//Insert Loop for table manipulation modules column header data
				displayColumn.RevisedTitle=thisObject.textFold(thisObject.baseTableData.display.titleDepth,(thisObject.baseTableData.components[displayColumn.type]==null ? "" : (  displayColumn.title=="" ? thisObject.baseTableData.components[displayColumn.type][displayColumn.name].title : displayColumn.title )));
				var cell="";
				TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
					if(aTMModule.value.columnHeaderInterface != null)
						cell += aTMModule.value.columnHeaderInterface(displayColumn, thisObject);
				});
				if(displayColumn.isSummaryHidden) {
					displayColumn.isHidden=true;
					return;
				}
				output += 		"<td id='" + thisObject.elementUniqueID + "_ColumnTitleCell_" + displayColumn.typeName + "'>"
						+ 			"<div id='" + thisObject.elementUniqueID + "_ColumnTitleHolder_" + displayColumn.typeName + "' class='tableTitleElement' style='position:relative;height:"+thisObject.baseTableData.titleHeight+"px;'>"
						+ 				"<table cellpadding='0' cellspacing='0' style='height:"+thisObject.baseTableData.titleHeight+"px;width:100%;'>"
						+ 					"<tr>"
						+						cell
						+ 						"<td valign='center' id='" + thisObject.elementUniqueID + "_ColumnTitleText_" + displayColumn.typeName + "' onmousedown='" + thisObject.callBackText + ".columnMouseDown(" + displayColumn.ptypeNameD + ")' ondblclick='" + thisObject.callBackText + ".columnHeadMouseDoubleClickAction(event, " + displayColumn.ptypeNameD + ")' onclick='" + thisObject.callBackText + ".columnHeadMouseClickAction(event, " + displayColumn.ptypeNameD + ")' oncontextmenu='" + thisObject.callBackText + ".columnHeadContextMenu(event, " + displayColumn.ptypeNameD + ")' >"
						+							"<nobr>&nbsp;" + displayColumn.RevisedTitle + "&nbsp;</nobr>"
						+			 		"</td></tr>"
						+		 		"</table>"
						+	 		"</div>"
						+	 	"</td>"
						+	 	"<td style='visibility:" + (displayColumn.isVisible||!displayColumn.isUserHidden ? "visible" : "hidden") + ";'><div class='columnDivider' style='height:"+thisObject.baseTableData.titleHeight+"px;' onmousedown='" + thisObject.callBackText + ".inishilizeColumnHeadResize(" +displayColumn.ptypeNameD + ");'/></td>";

			});

			output += 	"<td style='width:100px;'/></tr>"
					+ "</table>"
					+ "</div>";
		}

		output += "<div id='" + this.elementUniqueID + "_tableErrorDisplayArea' style='display:none;height:200px;overflow-x: auto;overflow-y: auto;position:static;'></div>"
				+ "<div id='" + this.elementUniqueID + "_tableDisplayArea' style='height:200px;overflow-x: auto;overflow-y: auto;position:static;' ";
			
		if(IS_TOUCH_SYSTEM)
			output += " ontouchstart='" + this.callBackText + ".touchStart(event)' ontouchend='" + this.callBackText + ".touchEnd(event)' ontouchmove='" + this.callBackText + ".touchMove(event)'";
			
		output += 		" onscroll=\"" + this.callBackText + ".titleScroll();\">"
				+ 		"<table id='" + this.elementUniqueID + "_displayData' style='"
				+			( Prototype.Browser.IE && IE_SPEED_EXTENSION ? "" :  "table-layout: fixed;" )
				+ 			"padding:0px;margin:0px;' class='tableCell' cellpadding='0px' cellspacing='0px' ></table>"
				+ 	"</div>"
				+ "</div>";

		var tempMenuItem = null;
		var localRightMenu = [];
		var localLeftMenu = [];
		if(!this.disableLeftMenu) {
			TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
				if(aTMModule.value.panelLeftMenuObject != null) {
					var temp = aTMModule.value.panelLeftMenuObject(thisObject, localLeftMenu);
					if(temp != null)
						localLeftMenu = temp;
				}
			});
	
			localLeftMenu.push({
					nodeType : "leaf",
					elementID : this.elementUniqueID + "_pageNumberingArea",
					elementValue : ""
			});
		}
		this.baseTableData.localLeftMenu=localLeftMenu;
		this.tableObjects = {};
		this.parentPanel.setContent(output, this.baseTableData.localTableDeffinition.pluralName+this.extendedTitle, this.baseTableData.localTableDeffinition.description, 'hidden', localLeftMenu);

		if(this.baseTableData.localTableDeffinition.tableMenu != null) {
			var parameterList=$H()
				,tableMenu=deepClone(this.baseTableData.localTableDeffinition.tableMenu);
			parameterList.set("$tableObject",this);
			for(var i=0;i<tableMenu.length;i++) 
				tableMenu[i].elementActionScript.parameterList=parameterList;
			createContextMenu("panelMenuLeft_" + this.parentPageID, tableMenu, HORIZONTAL, this.parentStageID, this.parentWindowID, this.parentPanelID);
		}
			
		var table = this.getTableObject("displayData");
		Event.observe(table, 'click', this.mouseClickHandeler);
		Event.observe(table, 'dblclick', this.mouseDoubleClickHandeler);
		Event.observe(table, 'mousedown', this.mouseDownHandeler);
		Event.observe(table, 'contextmenu', this.mouseContextMenuHandeler);
	},
	
	mouseHandler : function(event,action,element) {
		switch (action) {
			case "1DoubleClick":
			case "Down":
				if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0)
					break;
				Releaseme();
				return;
		}
		if(element == null) return;
		switch(element.type) {
			case "dataTableCell" :
				TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
					if(aTMModule.value["cellMouse"+action+"Action"] != null)
						aTMModule.value["cellMouse"+action+"Action"](element.tableObject, element.rowNumber, element.columnType, element.columnName);
					if(aTMModule.value["columnMouse"+action+"Action"] != null)
						aTMModule.value["columnMouse"+action+"Action"](element.tableObject, element.rowNumber, element.columnType, element.columnName);
					if(aTMModule.value["rowMouse"+action+"Action"] != null)
						aTMModule.value["rowMouse"+action+"Action"](element.tableObject, element.rowNumber, element.columnType, element.columnName);
				});
				break;
			case "rowNumber" :
				switch (action) {
					case "1Click":
						if (event.ctrlKey) {
							if(element.object.style.borderColor=='') {
								element.object.style.borderStyle='solid';
								element.object.style.borderColor='red';
							} else {
								element.object.style.borderStyle='';
								element.object.style.borderColor='';
							}
							return;
						}
				}
				TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
					if(aTMModule.value["rowMouse"+action+"Action"] != null)
						aTMModule.value["rowMouse"+action+"Action"](element.tableObject, element.rowNumber);
					if(aTMModule.value["rowHeadMouse"+action+"Action"] != null)
						aTMModule.value["rowHeadMouse"+action+"Action"](element.tableObject, element.rowNumber);
				});
				break;
		}
	},
	
	mouseDoubleClickHandeler : function(event) {
		var element = decodeTableEventElement(event);
		element.tableObject.mouseHandler(event,"1DoubleClick",element);
	},
	
	mouseDownHandeler : function(event) {
		if(!Event.isLeftClick(event)) return;
		var element = decodeTableEventElement(event);
		element.tableObject.mouseHandler(event,"Down",element);
	},
	
	mouseContextMenuHandeler : function(event) {
		var element = decodeTableEventElement(event);
		if(element == null) return;
		switch(element.type) {
			case "dataTableCell" :
				element.tableObject.cellContextMenu(event, element.rowNumber, element.columnType, element.columnName);
				break;
			case "rowNumber" :
				element.tableObject.rowHeadContextMenu(event, element.rowNumber);
				break;
		}
		Event.stop(event);
		return false;
	},
	
	mouseClickHandeler : function(event) {
		var element = decodeTableEventElement(event);
		element.tableObject.mouseHandler(event,"1Click",element);
	},

	columnMouseDown: function(event, columnType, columnName) {
		if(!Event.isLeftClick(event)) return;
		var thisObject=this;
		if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0) {
			TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
				if(aTMModule.value.columnMouseDownAction != null)
					aTMModule.value.columnMouseDownAction(thisObject, columnType, columnName);
				if(aTMModule.value.columnHeadMouseDownAction != null)
					aTMModule.value.columnHeadMouseDownAction(thisObject, columnType, columnName);
			});
		} else
			Releaseme();
		return false;
	},

	inishilizeColumnHeadResize: function(columnType, columnName) {
		if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0) {
			var column = $(this.elementUniqueID + "_ColumnTitleHolder_" + columnType + "_" + columnName);
			var columnWidth = column.getWidth();
			var titleHeight=this.baseTableData.titleHeight;
			column.setStyle({"overflow":"hidden", "height": titleHeight +"px" });
			$$("." + this.elementUniqueID + "_ColumnContainerClass_" + columnType + "_" + columnName).each(function(elm){elm.setStyle({ "width": (columnWidth) + "px", "overflow":"hidden" });});
			$(this.GUID + ".dataTableCell." + columnType + "." + columnName + ".0").setStyle({width:null});
			$(this.elementUniqueID + "_ColumnTitleCell_" + columnType + "_" + columnName).setStyle({width:null});
						
			CORE_MOUSE_DOWN_ACTIONS.set("tableColumnHeaderMove", {
				CORE_Last_Mouse_X : CORE_Current_Mouse_X,
				CORE_Last_Mouse_Y : CORE_Current_Mouse_Y,
				LastTimeCheck : setTimeout(this.callBackText + ".columnHeadResize('" + columnType + "', '" + columnName + "')", 1)
			});
		} else
			Releaseme();
		return false;
	},

	columnHeadResize: function(columnType, columnName) {
		var columnMoveNode = CORE_MOUSE_DOWN_ACTIONS.get("tableColumnHeaderMove");
		if(columnMoveNode == null) return false;
		var change = CORE_Current_Mouse_X - columnMoveNode.CORE_Last_Mouse_X;
		if(change >= 1 || change <= -1) {
			var column = $(this.elementUniqueID + "_ColumnTitleHolder_" + columnType + "_" + columnName);
			if(column != null) {
				var width = column.getWidth();
				if(width + change) {
					column.setStyle({ "width": (width + change) + "px"});
					$$("." + this.elementUniqueID + "_ColumnContainerClass_" + columnType + "_" + columnName).each(function(elm){elm.setStyle({ "width": (width + change) + "px"});});
				}
			}
			columnMoveNode.CORE_Last_Mouse_X = CORE_Current_Mouse_X;
			columnMoveNode.CORE_Last_Mouse_Y = CORE_Current_Mouse_Y;
		}
		columnMoveNode.LastTimeCheck = setTimeout(this.callBackText + ".columnHeadResize('" + columnType + "', '" + columnName + "')", 1);
	},

	cellContextMenu: function(event, rowNumber, columnType, columnName) {
		var thisObject = this
			,output = null
			,baseMenu = []
			,columnMenu = []
			,rowMenu = []
			,i = 0;

		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value.cellMouse2DownMenuObject != null)
				baseMenu = aTMModule.value.cellMouse2DownMenuObject(thisObject, baseMenu, rowNumber, columnType, columnName);
			if(aTMModule.value.columnMouse2DownMenuObject != null)
				columnMenu = aTMModule.value.columnMouse2DownMenuObject(thisObject, columnMenu, columnType, columnName);
			if(aTMModule.value.rowMouse2DownMenuObject != null)
				rowMenu = aTMModule.value.rowMouse2DownMenuObject(thisObject, rowMenu, rowNumber);
		});

		if(columnMenu.length != 0 || rowMenu.length != 0)
			baseMenu.unshift({
							nodeType : "LINE",
							elementValue : "Cell operations"
						});	
		
		if(columnMenu.length != 0) {
			for(i=0; i<columnMenu.length; i++)
				baseMenu.unshift(columnMenu[i]);
			baseMenu.unshift({
							nodeType : "LINE",
							elementValue : "Column operations"
						});	
		}

		if(rowMenu.length != 0) {
			for(i=0; i<rowMenu.length; i++)
				baseMenu.unshift(rowMenu[i]);
			baseMenu.unshift({
							nodeType : "LINE",
							elementValue : "Row operations, key: "+this.getRowTitle(rowNumber)
						});	
		}

		if(baseMenu.length != 0) openGeneralContextMenu(baseMenu);
		Event.stop(event);
		return false;
	},

	columnHeadContextMenu: function(event, columnType, columnName) {
		var thisObject = this;
		var output = null;
		var baseMenu = [];
		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value.columnMouse2DownMenuObject != null)
				baseMenu = aTMModule.value.columnMouse2DownMenuObject(thisObject, baseMenu, columnType, columnName);
			if(aTMModule.value.columnHeadMouse2DownMenuObject != null)
				baseMenu = aTMModule.value.columnHeadMouse2DownMenuObject(thisObject, baseMenu, columnType, columnName);
		});

		if(baseMenu.length != 0) openGeneralContextMenu(baseMenu);
		Event.stop(event);
		return false;
	},
	columnHeadMouseClickAction: function(event, columnType, columnName) {
		var thisObject = this;
		if(this.baseTableData.localTableDeffinition.tableDisplayActions == null) return false;
		if(this.baseTableData.localTableDeffinition.tableDisplayActions.columnhead_click == null) return false;
		if(!this.baseTableData.localTableDeffinition.tableDisplayActions.columnhead_click.disableLocal)return false;
			
		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value.columnMouse1ClickAction != null)
				aTMModule.value.columnMouse1ClickAction(thisObject, columnType, columnName);
			if(aTMModule.value.columnHeadMouse1ClickAction != null)
				aTMModule.value.columnHeadMouse1ClickAction(thisObject, columnType, columnName);
		});
		return false;
	},
	columnHeadMouseDoubleClickAction: function(event, columnType, columnName) {
		var thisObject = this;
		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value.columnHeadMouse1DoubleClickAction != null)
				aTMModule.value.columnHeadMouse1DoubleClickAction(thisObject, columnType, columnName);
			if(aTMModule.value.columnMouse1DoubleClickAction != null)
				aTMModule.value.columnMouse1DoubleClickAction(thisObject, columnType, columnName);
		});
		return false;
	},
	rowHeadContextMenu: function(event, rowNumber) {
		var thisObject = this;
		var output = null;
		var baseMenu = [];
		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value.rowMouse2DownMenuObject != null)
				baseMenu = aTMModule.value.rowMouse2DownMenuObject(thisObject, baseMenu, rowNumber);
			if(aTMModule.value.rowHeadMouse2DownMenuObject != null)
				baseMenu = aTMModule.value.rowHeadMouse2DownMenuObject(thisObject, baseMenu, rowNumber);
		});

		if(baseMenu.length != 0) openGeneralContextMenu(baseMenu);
		Event.stop(event);
		return false;
	},
	titleScroll: function() {
		var table = this.getTableObject("tableDisplayArea");
		if(table == null) return;
		var title = this.getTableObject("titleDisplayArea");
		if(title == null) return;
		title.scrollLeft = table.scrollLeft;
	},
	getTableObject : function(object) {
		if(this.tableObjects[object] == null)
			this.tableObjects[object] = $(this.elementUniqueID + "_" + object);
		return this.tableObjects[object];
	},
	resizeStart: function() {
		this.InResizeEvent = true;
		if (this.doSizeOperation != null) clearTimeout(this.doSizeOperation);
		this.doSizeOperation = null;
		var tableDisplayArea = this.getTableObject("tableDisplayArea");
		if(tableDisplayArea) tableDisplayArea.hide();
		var tableErrorDisplayArea =	this.getTableObject("tableErrorDisplayArea");
		if(tableErrorDisplayArea) {
			tableErrorDisplayArea.update("");
			tableErrorDisplayArea.setStyle({"background":"lightblue"});
			tableErrorDisplayArea.show();
		}
	},
	resizeEnd: function() {
		this.InResizeEvent = false;
		var tableDisplayArea =this.getTableObject("tableDisplayArea");
		if(tableDisplayArea) tableDisplayArea.show();
		var tableErrorDisplayArea =	this.getTableObject("tableErrorDisplayArea");
		if(tableErrorDisplayArea) {
			tableErrorDisplayArea.hide();
			tableErrorDisplayArea.update("");
			tableErrorDisplayArea.setStyle({"background":"white"});
			this.setWidth(this.width);
			this.setHeight(this.height);
		}
	},
	sizeHeight: function(Amount) {
		if(this.objectIsDead) return;
		this.height += Amount;

		var tableErrorDisplayArea = this.getTableObject("tableErrorDisplayArea");
		var tableDisplayArea = this.getTableObject("tableDisplayArea");
		var mainDisplayArea = this.getTableObject("mainDisplayArea");
		
		if(mainDisplayArea != null)
			mainDisplayArea.setStyle({ "height": (this.height) + "px" });

		if(this.baseTableData != null) {
			if(tableDisplayArea != null)
				tableDisplayArea.setStyle({ "height": (this.height - this.baseTableData.titleHeight) + "px" });
			if(tableErrorDisplayArea != null)
				tableErrorDisplayArea.setStyle({ "height": (this.height - this.baseTableData.titleHeight) + "px" });
		}
		this.setSizingCall();
	},

	setHeight: function(Amount) {
		if(this.objectIsDead) return;
		this.height = Amount;
		
		var tableErrorDisplayArea = this.getTableObject("tableErrorDisplayArea");
		var tableDisplayArea = this.getTableObject("tableDisplayArea");
		var mainDisplayArea = this.getTableObject("mainDisplayArea");
		
		if(mainDisplayArea != null)
			mainDisplayArea.setStyle({ "height": (this.height) + "px" });

		if(this.baseTableData != null) {
			if(tableDisplayArea != null)
				tableDisplayArea.setStyle({ "height": (this.height - this.baseTableData.titleHeight) + "px" });
			if(tableErrorDisplayArea != null)
				tableErrorDisplayArea.setStyle({ "height": (this.height - this.baseTableData.titleHeight) + "px" });
		}
		this.setSizingCall();
	},
	sizeWidth: function(Amount) {
		if(this.objectIsDead) return;
		this.width += Amount
		var tableErrorDisplayArea = this.getTableObject("tableErrorDisplayArea");
		var mainDisplayArea = this.getTableObject("mainDisplayArea");
		
		if(mainDisplayArea != null)
			mainDisplayArea.setStyle({ "width": (this.width) + "px" });
		
		if(tableErrorDisplayArea != null)
				tableErrorDisplayArea.setStyle({ "width": (this.width) + "px" });
				
		this.setSizingCall();
	},
	setWidth: function(Amount) {
		if(this.objectIsDead) return;
		this.width = Amount;
		var tableErrorDisplayArea = this.getTableObject("tableErrorDisplayArea");
		var mainDisplayArea = this.getTableObject("mainDisplayArea");
		if(mainDisplayArea != null)
			mainDisplayArea.setStyle({ "width": (this.width) + "px" });
		if(tableErrorDisplayArea != null)
				tableErrorDisplayArea.setStyle({ "width": (this.width) + "px" });
		this.setSizingCall();
	},
	setErrorFormatted: function(message,detail) {
		if(message==null) {
			if(this.parentPanel==null) { 
				alert("list table errror without message: "+(detail==null?"":detail));
				return;
			}
			this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error without message</h2>"+(detail==null?"":detail)+"</td></tr></table>");
			return;
		}

		if(typeof message =='object')
			if( message.constructor == Array) {
				if(message.length>1) {
					var detail = (this.parentPanel==null?"":"<table><tr><th>Connection</th>Message<th></th></tr>");
					for (var i=0;i<message.length;i++) {
						detail+=(this.parentPanel==null?"":"<tr><td>");
						if( typeof message[i].connection =='object' )
							detail+=getDatabaseConnectionId(message[i].connection); 
						else
							detail+=message[i].connection;
						if(this.parentPanel!=null)
							detail+="</td><td>"+message[i].error+"</td></tr>";
					}
					if(this.parentPanel!=null)
						detail +="</table>";
					if(this.parentPanel==null)
						alert("list table multiple errors: "+detail);
					else
						this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Multiple Errors</h2>"+detail+"</td></tr></table>");
					return;
				}
				message=message[0];
			}
		if(typeof message ==  "object") {
			if(this.parentPanel==null) { 
				alert("list table errror Line no.: "+ message.lineNo + " " + message.message + "\n"+(detail==null?"":detail));
				return;
			}
			this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Line no.: "+ message.lineNo + " " + message.message + "</h2>"+(detail==null?"":detail)+"</td></tr></table>");
			return;
		}
		var msgId=message.split(" ",1)[0];
		if(msgId.substr(0,1)=="[")
			msgId=message.split("] ",2)[1].split(" ",1)[0];
		if (this.baseTableData.localTableDeffinition.messages[msgId]!=undefined) {
			var message=this.baseTableData.localTableDeffinition.messages[msgId];
			if( message instanceof Object ) {
				this.setErrorMessage(coalesce(message.message,'No data returned'));
				for(var key in message)
					switch (key) {
						case 'actionscript':
							var actionScriptObject = message.actionscript
								,blockData = $H();
							blockData.set("$tableObject",this);
							if(this.baseTableData.localTableDeffinition.useConnectWithTag != null)
								blockData.set('useConnectWithTag', this.baseTableData.localTableDeffinition.useConnectWithTag);
							var TEScriptMain = new actionScript(this.baseTableData.tableName + '_' + msgId, actionScriptObject , null, this.parentStageID, this.parentWindowID, this.parentPanelID, this.parentPageID);
							TEScriptMain.callAction(blockData, '', '', null);
							break;
						case 'menu':
							var menu = (message.menu.length==0?
									 [{ nodeType : "LINE" ,elementValue : "Error no menu content for message "+msgId}]
									:message.menu
								);
							menu.elementPosition=this.elementUniqueID + '_rowMessageArea';
							openGeneralContextMenu(menu);
							break;
						case 'message':
							break;
						case 'retry':
							if(this.retryCount==null) this.retryCount=3;
							if(--this.retryCount<1) {
								this.setErrorMessage('Maximum retry attempts reached');
								return;
							}
							this.setErrorMessage('Problem in retrieving data, retrying in 10 seconds, ' + (this.retryCount+1) + ' attempts remaining');
							this.refreshCallBackTimer = setTimeout(this.callBackText + ".retrieveTableData()", 10 * 1000);
							return;
						default:
							this.setErrorMessage('unknown error action: '+key+' for error '+msgId);
							return;
					}
				return;
			}
		} else if (CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES[msgId]!=undefined)
			message=CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES[msgId];
		if(this.parentPanel==null) { 
			alert(message+"\n"+(detail==null?"":detail));
			return;
		}
		this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>" + message + "</h2>"+(detail==null?"":detail)+"</td></tr></table>");
	},

	setError: function(message) {
		if(this.parentPanel==null) { 
			alert("list table errror: "+message);
			return;
		}
		var contentArea = this.getTableObject("tableDisplayArea");
		var errorArea = this.getTableObject("tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.hide();
		if(errorArea != null) {
			errorArea.update(message);
			this.errorIsShowen = true;
			errorArea.show();
		}
	},
	clearError: function() {
		var contentArea = this.getTableObject("tableDisplayArea");
		var errorArea = this.getTableObject("tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.show();
		if(errorArea != null) {
			this.errorIsShowen = false;
			errorArea.hide();
			errorArea.update("");
		}
	},
	setLoading: function(OnOrOff) {
		if(this.parentPanel==null) return;
		if(OnOrOff) 
			this.parentPanel.setContent("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:100%;height:100%;position:static;'cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center' valign='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr><tr><td align='center'><h2>Loading table definition</h2></td></tr></table>", 'Loading table definition', null, 'hidden');
	},
	setErrorMessage: function(message) {
		if(this.parentPanel==null) throw message;
		this.parentPanel.setContent("<table id='" + this.elementUniqueID + "_rowMessageArea' style='width:100%;height:100%'><tr><td align='center'><h2>" + message + "</h2></td></tr></table>", 'Error', null, 'hidden');
	},
	resetLocalQueryDataIndex: function(baseTableData) {
		for (var columnObject in baseTableData.components.column)
			baseTableData.components.column[columnObject].localQueryDataIndex = null;
	},
	setTitle: function() {
		this.parentPanel.setContent(null
				, this.baseTableData.localTableDeffinition.pluralName+this.extendedTitle+" "+this.callTableManipulationModules('getTitle').join(', ')
				);
	},
	processRowStyle: function(currentRow) {
		var columnName = this.baseTableData.localTableDeffinition.rowStyle.interfaceColumn;
		var colIndex = this.baseTableData.resultSetIndexByColumnName[columnName.toUpperCase()];
		var type = this.baseTableData.columnsInfo.type[colIndex];
		var rowdata = columnDBTypeConvertValue(type,this.baseTableData.baseData[currentRow][colIndex]);
		var options = this.baseTableData.localTableDeffinition.rowStyle.options;
		if(options == null) return "";
		var option=null
		var optionLength = options.length;
		for(var i=0; i<optionLength; i++) {
			option=options[i];
			if(option.gteq != "" && option.lteq != "") {
				if(rowdata >= option.gteq && rowdata <= option.lteq)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.gt != "" && option.lt != "") {
				if(rowdata > option.gt && rowdata < option.lt)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.gt != "" && option.lteq != "") {
				if(rowdata > option.gt && rowdata <= option.lteq)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.gteq != "" && option.lt != "") {
				if(rowdata >= option.gteq && rowdata < option.lt)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.gteq != "") {
				if(rowdata >= option.gteq)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.lteq != "") {
				if(rowdata <= option.lteq)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.gt != "") {
				if(rowdata > option.gt)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.lt != "") {
				if(rowdata < option.lt)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.eq != "") {
				if(rowdata == option.eq)
					return ROW_HIGHLIGHT_STYLE(option.style);
			} else if(option.isnull != "") {
				if((rowdata==null) == (option.isnull=="true"))
					return ROW_HIGHLIGHT_STYLE(option.style);
			}
		}
	},
	touchStart: function(event) {
		this.Current_Mouse_X = 0;
		this.Current_Mouse_Y = 0;
		this.touchMoveEnabled = false;
		if( event.touches && event.touches.length) { 
			this.touchMoveEnabled = true;
			this.Current_Mouse_X = event.touches[0].clientX;
			this.Current_Mouse_Y = event.touches[0].clientY;
		} else { 
			this.touchMoveEnabled = true;
			this.Current_Mouse_X = event.clientX;
			this.Current_Mouse_Y = event.clientY;
		}
	},
	touchMove: function(event) {
		if(this.touchMoveEnabled && event.touches.length == 1 && event.processed == null) {
			var panel = $(this.elementUniqueID);
			table = this.getTableObject("tableDisplayArea");
			title = this.getTableObject("titleDisplayArea");
			if(table != null && title != null) {
				var local_Mouse_X = 0;
				var local_Mouse_Y = 0;
				if( event.touches && event.touches.length) { 
					local_Mouse_X = event.touches[0].clientX;
					local_Mouse_Y = event.touches[0].clientY;
				} else {
					local_Mouse_X = event.clientX;
					local_Mouse_Y = event.clientY;
				}
				
				table.scrollLeft += this.Current_Mouse_X - local_Mouse_X;
				title.scrollLeft += this.Current_Mouse_X - local_Mouse_X;
				table.scrollTop += this.Current_Mouse_Y - local_Mouse_Y;
				
				this.Current_Mouse_X = local_Mouse_X;
				this.Current_Mouse_Y = local_Mouse_Y;
				
				event.preventDefault();
				return false;
			}
		}
	},
	touchEnd: function(event) {
		this.touchMoveEnabled = false;
	},
	whereColumnUnique: function(node,column) {
		if(node==null) return false;
		switch (node.type.toLowerCase()) {
			case "value":
				if(node.compareType=="=") 
					if(node.column==column) return true;
			    return false;
			case "group":
				if(node.operand!="AND") return false;
				for (var i=0; i<node.groupNodes.length;i++)
					if(this.whereColumnUnique(node.groupNodes[i],column)) return true;
			}
	    return false;
	},
	getRowTitle: function(row) {
		if(this.baseTableData.isSummarized) 
			return this.callTableManipulationModule("Data_Summarize","getRowTitle",row);
		if(this.rowTitleFunction==null) {
			var columnTitle="";
			if(this.baseTableData.primaryKeys==undefined||this.baseTableData.primaryKeys.length==0)
				columnTitle='"Primary key not determined"';
			else {
				var titleColumns=[];
				for(var i=0;i<this.baseTableData.primaryKeys.length;i++) 
					if(!this.whereColumnUnique(this.baseTableData.where,this.baseTableData.primaryKeys[i]))
						titleColumns.push(this.baseTableData.primaryKeys[i]);
				if(titleColumns.length==0)		
					columnTitle += '"Row unique by filters"';
				else  if (titleColumns.length==1)   
					columnTitle += 'this.baseTableData.baseData[row]['+this.getColumn(this.baseTableData,titleColumns[0])+']';
				else 
					for(var i=0;i<titleColumns.length;i++) {
							var column = titleColumns[i];
							columnTitle+= (i>0?'+" ':'"')
										+	(this.baseTableData.components.column[column]==null 
												? column
												:( this.baseTableData.components.column[column].title==null 
														? column
														:this.baseTableData.components.column[column].title
												 ).replace("/^\s+/g", "").replace("/\s+$/g", "")
											)
										+ ' : "';
							columnTitle += '+this.baseTableData.baseData[row]['+this.getColumn(this.baseTableData,column)+']';
						}
			}
			eval("this.rowTitleFunction = function (row) {return "+columnTitle+";}");
		}
		return this.rowTitleFunction(row);
	},
	callTableManipulationModule: function(module,aFunction) {
		var args = [];
		for(var i=2;i<arguments.length;i++) args[i-2] = arguments[i];
		return TABLE_MANIPULATION_MODULES.get(module)[aFunction].apply(this,args);
	},
	callTableManipulationModules: function(aFunction) {
		var args = []
			,thisObject=this;
		for(var i=1;i<arguments.length;i++) args[i-1] = arguments[i];
		var results=[];
		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value[aFunction] == null) return;
			result=aTMModule.value[aFunction].apply(thisObject,args);
			if(result == null) return;
			results.push(result);
		});
		return results;
	},
	setColumns4Block: function(row,blockData,tableObject) {
		this.processColumns(row,blockData.set,tableObject,blockData);
	},
	processColumns: function(row,afunction,tableObject,targetObject) {
		var baseTableData =(tableObject==null?this.baseTableData:tableObject)
			,row=baseTableData.baseData[row];
		if(targetObject==null) var targetObject=this;
		$H(baseTableData.resultSetIndexByColumnName).each(function(node) {
			afunction.apply(targetObject,[node.key,row[node.value]]);
		});
	}
}));