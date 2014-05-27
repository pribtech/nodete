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
CORE_CLIENT_ACTIONS.set("display",Class.create(CORE_CLIENT_ACTIONS.get("list_table"), {
	initialize: function($super, callParameters) {

		this.columnsSet = callParameters.$columnsSet;
		$super(callParameters);
	},
	
	retrieveTableData: function() {
		var thisObject = this;
		var notificationArea = $(this.elementUniqueID + "_notificationArea");
		
		if(notificationArea != null)
			notificationArea.update("");
		
		this.markOldData(1);
		
		this.baseTableData.detailedView = true;
		if(this.baseTableData.primaryKeys.length == 0)
		{
			if(this.pageCallParameters.displayRowData != null && this.pageCallParameters.displayRowColumnInfo != null)
			{
				notificationArea.update("This is a local copy of the data. No primary keys have been set on this table to allow for updates.");
				this.baseTableData.resultSetIndexByColumnName = {};
				for(var i = 0; i < this.pageCallParameters.displayRowColumnInfo.name.length; i++)
				{
					thisObject.baseTableData.resultSetIndexByColumnName[this.pageCallParameters.displayRowColumnInfo.name[i]] = i;
				}
				this.baseTableData.columnsInfo = this.pageCallParameters.displayRowColumnInfo;
				this.baseTableData.baseData = [this.pageCallParameters.displayRowData];
				this.baseTableData.updateTime = 0;
				this.baseTableData.rowsReturned = 1;
				this.baseTableData.totalRows = 1;
				this.baseTableData.isRowCountComplete = true;
				this.renderTableData();
				return;
			}
		}
		
		if(this.pageCallParameters.searchObject != null)
			this.baseTableData.where = this.pageCallParameters.searchObject;
		this.clearError();
		
		var sqlCount = 0;
		
		var DBMS = null;
		
		POSTDATA = new Object();
		
		if(thisObject.baseTableData.localTableDeffinition.useConnectWithTag != null)
		{
			POSTDATA.USE_CONNECTION = getConnectionWithTag(thisObject.baseTableData.localTableDeffinition.useConnectWithTag);
		}
		if(POSTDATA.USE_CONNECTION == null)
		{
			POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
		}
		DBMS = getConnectionDBMS(POSTDATA.USE_CONNECTION);

		if (QUERY_BUILDER==undefined || DBMS==null) {
			thisObject.setErrorFormatted(DATABASE_NOT_CONNECTED_TEXT);
			return;
		}
		POSTDATA['SQL[CORE_DATA_QUERY]'] = QUERY_BUILDER.get(DBMS).buildSelect(this.baseTableData, true);
		POSTDATA.action 				= "executeSQL";
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.displayXML 			= true;
		POSTDATA.displayCLOB			= true;
		POSTDATA.displayXMLinline 		= true;
		POSTDATA.displayCLOBinline 		= true;
		POSTDATA.displayBLOB 			= true;
		POSTDATA.displayDBCLOB 			= true;
		POSTDATA.returnFromRow			= this.fetchResultsAfterRow;
		POSTDATA.maxRowReturn			= this.maxResultsToFetch;

		//Optimization since we do not need to display the queries 
		POSTDATA.doNotReturnSQL 		= true;
		
		var queryArray = null;
		var keys = $H(thisObject.baseTableData.components).keys();
		var keyLength = keys.length;
		var i = 0;
		
		var tableColumnRenderingModule = null;
		
		for(i=0; i<keyLength; i++)
		{
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule != null)
			{
				if(tableColumnRenderingModule.ContainsSecondaryQueries == true)
				{
					queryArray = null;
					queryArray = tableColumnRenderingModule.secondaryQueries(thisObject);
					if(Object.isString(queryArray))
					{
						if(queryArray != "")
						{
							POSTDATA['SQL[' + (sqlCount++) + ']'] = queryArray;
						}
					}
					else if(queryArray != null)
					{
						if(queryArray.length > 0)
						{
							queryArray.each(function(value) { 
								if(Object.isString(value))
								{
									POSTDATA['SQL[' + (sqlCount++) + ']'] = value;
								}
								else
								{
									POSTDATA['SQL[' + value.name + ']'] = value.sql;
								}
							});
						}
					}
				}
			}
		}
		
		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
						if(thisObject.firstLoad)
							thisObject.setError("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:100%;height:100%;position:static;' cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center' valign='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr><tr><td align='center'><h2>Loading Data</h2></td></tr></table>");
					},
					'onComplete' : function() {
						thisObject.firstLoad = false;
					},
					'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null) {
							thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>An invalid JavaScript object was returned</h2></td></tr></table>");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if(result.flagGeneralError == true ||  isReturnCodeNotOK(result)) {
							thisObject.setError(getReturnMessageFormatted(result));
							return;
						}
						
						if(result != null) {
							var resultSet = result.returnValue.STMTReturn['CORE_DATA_QUERY'].resultSet[0];
							thisObject.baseTableData.resultSetIndexByColumnName = {};
							for(var i = 0; i < resultSet.columnsInfo.name.length; i++)
								thisObject.baseTableData.resultSetIndexByColumnName[resultSet.columnsInfo.name[i]] = i;
							thisObject.baseTableData.columnsInfo = resultSet.columnsInfo;
							thisObject.baseTableData.baseData = resultSet.data;
							thisObject.baseTableData.updateTime = resultSet.resultTime;
							thisObject.baseTableData.rowsReturned = parseInt(resultSet.rowsReturned);
							thisObject.baseTableData.totalRows = parseInt(resultSet.rowsInSet);
							thisObject.baseTableData.isRowCountComplete = resultSet.isRowCountComplete;
							
							var queryArray = null;
							var keys = $H(thisObject.baseTableData.components).keys();
							var keyLength = keys.length;
							var i = 0;
							
							var tableColumnRenderingModule = null;
							for(i=0; i<keyLength; i++) {
								tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
								if(tableColumnRenderingModule != null) {
									if(tableColumnRenderingModule.ContainsSecondaryQueries == true)
										tableColumnRenderingModule.processSecondaryQueriesReturn(thisObject.baseTableData, result.returnValue.STMTReturn);
								}
							}
							
							thisObject.renderTableData();
						}
					},
					'onException': function(transport,exception) {
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Exception while loading table data</h2>"+exception+"</td></tr></table>");
					},
					'onFailure': function(transport) {
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error loading table data</h2></td></tr></table>");
					}
			});
	},
	
	getDisplayColumns: function() {
		if(this.columnsSet==null)
			return this.baseTableData.displayColumns;
		if(this.baseTableData.displayColumnsSet==undefined) 
				throw 'Display set: "'+this.columnsSet+'" no display sets defined for table';
		if(this.baseTableData.displayColumnsSet[this.columnsSet]==undefined) 
			throw 'Display set: "'+this.columnsSet+'" not found';
		return this.baseTableData.displayColumnsSet[this.columnsSet];
	},
	
	renderTableData: function() {
		this.clearError();
		this.markOldData(0);
		
		var elementUniqueID = this.elementUniqueID;
		var output = "";
		var displayColumn = null;

		if(this.baseTableData.rowsReturned == 0)
			this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>The query was successful but no data was returned.</h2></td></tr></table>");
		else {
			var tempDisplayColumns=this.getDisplayColumns();
			var container = null;
			for(var i=0; i < tempDisplayColumns.length; i++) {
				displayColumn = tempDisplayColumns[i];
					
				var container = $(elementUniqueID + "_Cell_" + displayColumn.type + "_" + displayColumn.name + "_0");

				if(container != null) {
					if(displayColumn.renderingClass != null)
						output = displayColumn.renderingClass.render(this, 0, this.baseTableData.components[displayColumn.type][displayColumn.name]);
					else
						output = "<font style='color:red;font-weight: bold;'>I don't know how to render a type of '" + displayColumn.type + "'</font>";
					container.update(output);
				}
				
			}
		}
	},

	markOldData: function(age) {
		var colorSet = MASTER_TABLE_COLOR_SET[age];
		var type = [];
		var tempDisplayColumns=this.getDisplayColumns();
		var displayColumn = null;
		for(var i=0; i < tempDisplayColumns.length; i++)
		{
			displayColumn = tempDisplayColumns[i];
			if(type[displayColumn.type] == null)
				type[displayColumn.type] = 1;
			else
				type[displayColumn.type] = (1+type[displayColumn.type]) %2;
			var container = $(this.elementUniqueID + "_Cell_" + displayColumn.type + "_" + displayColumn.name + "_0");
			if(container == null)
				return;
			container.setStyle({background:colorSet[type[displayColumn.type]]});
		}
	},
	
	draw: function() {
		var displayBucket = $H();
		var thisObject = this;
		var elementUniqueID = this.elementUniqueID;
		var rowColor = 0;
		var displayColumn = null;
		var output = "";
		this.baseTableData.detailedView = true;

		var tempDisplayColumns=this.getDisplayColumns();
		for(var i=0; i < tempDisplayColumns.length; i++) {
			displayColumn = tempDisplayColumns[i];
			var displayClass = "";
			var renderingClass = TABLE_COLUMN_RENDERING_MODULES.get(displayColumn.type);
			var colOutput = "";
			var typeDataHolder = displayBucket.get(displayColumn.type);
			
			if(typeDataHolder == null)
				typeDataHolder = {
					name: "",
					data: []
				};

			if(renderingClass != null) {
				if(renderingClass.getDisplayClass != null)
					displayClass = renderingClass.getDisplayClass(this.baseTableData.components[displayColumn.type][displayColumn.name]);
				typeDataHolder.name = renderingClass.groupTitle;
			}
			colOutput += "<td valign='center' id='" + this.elementUniqueID + "_ColumnTitleText_" + displayColumn.type + "_" + displayColumn.name + "'>";
			colOutput += "<nobr>&nbsp;" + this.baseTableData.components[displayColumn.type][displayColumn.name].title + "&nbsp;:</nobr>";
			colOutput += "</td>";
			colOutput += "<td class='" + this.elementUniqueID + "_ColumnClass_" + displayColumn.typeName + " " + this.elementUniqueID + "_RowClass_0' id='" + this.elementUniqueID + "_Cell_" + displayColumn.typeName + "_0'>";
			colOutput += "</td>";
			
			typeDataHolder.data.push(colOutput);
			
			displayBucket.set(displayColumn.type, typeDataHolder);
		}
					

					
		var detailedOtherTableData = [];
				
		displayBucket.each(function(renderClassData) {
			if(renderClassData.key == 'column')
				detailedOtherTableData.unshift(renderClassData.value);
			else
				detailedOtherTableData.push(renderClassData.value);
		});	
		output = "<div id='" + this.elementUniqueID + "_mainDisplayArea' style='width:100px;height:100px;overflow:hidden;position:static;'>";
		output += "<div id='" + this.elementUniqueID + "_tableErrorDisplayArea' style='display:none;height:200px;overflow-x: auto;overflow-y: auto;position:static;'>";
		output += "</div>";	
		output += "<div id='" + this.elementUniqueID + "_tableDisplayArea' style='height:200px;overflow-x: auto;overflow-y: auto;position:static;' onscroll=\"" + this.callBackText + ".titleScroll();\">";
		output += "<span id='" + this.elementUniqueID + "_notificationArea'></span>";
				
		output += "<table><tr style='height:20px;background:" + rowColor + ";'>";
			
		detailedOtherTableData.each(function(renderClassData) {
				output += "<td><b>" + renderClassData.name + ":</b></td>";
		});
			
		output += "</tr><tr>";

		detailedOtherTableData.each(function(renderClassData) {
			output += "<td valign='top'><table style='max-width:500px;'>";
			var currentRow = 0;
			renderClassData.data.each(function(cell) {
				output += "<tr style='background-color:" + ((currentRow % 2 == 1) ? "#f1f1f1" : "#fafafa") + "'>" + cell + "</tr>";
				currentRow++;
			});
			output += "</table></td>";
		});
				
		output += "</tr></table>";

		output += "</div>";
		
		output += "</div>";
			
		var tempMenuItem = null;
		var localLeftMenu = [];
		TABLE_MANIPULATION_MODULES.each(function(aTMModule) {
			if(aTMModule.value.panelLeftMenuObject != null)
			{
				var temp = aTMModule.value.panelLeftMenuObject(thisObject, localLeftMenu);
				if(temp != null)
					localLeftMenu = temp;
			}
		});
	
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, (this.baseTableData.localTableDeffinition.singularName==null?this.baseTableData.localTableDeffinition.pluralName:this.baseTableData.localTableDeffinition.singularName)+this.extendedTitle, this.baseTableData.localTableDeffinition.description, null, localLeftMenu);
	}
	
}));