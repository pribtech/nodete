/*******************************************************************************
 * Author: Brian Olynyk
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

var graphDataSnapShots = $H();

CORE_CLIENT_ACTIONS.set("graphYUI",  Class.create(CORE_CLIENT_ACTIONS.get("list_table"), {
	initialize: function($super, callParameters) {
		
		if(callParameters == null) callParameters = {};
		
		this.elementType = this.elementType == null ? 'YUI_GRAPH' : this.elementType;
		
		this.firstGraphLoad = true;

		this.graphBase = null;
		
		this.baseTableData = {};
		
		this.currentDisplayData = null;
		
		this.sourceLink = callParameters.sourceLink;
		
		this.YAxisDegradation = callParameters.YAxisDegradation;
		
		this.sourceLinkLable = callParameters.sourceLinkLable == null ? "Source link" : callParameters.sourceLinkLable;
		
		this.title = callParameters.title;
		
		if(callParameters.table != null)
		{
			this.graphBase = 'tabledef';
			this.graphName = callParameters.graphName;
			this.detailPanel = callParameters.detailPanel != null ? callParameters.detailPanel : 'detail';
			this.buildFromTableDef = true;

			if(this.graphName == null)
				this.graphName = 'default';
				
			this.graphName = this.graphName.toUpperCase();
			
			$super(callParameters);
			
			this.baseTableData.graphTitle = this.title == null ? null : this.title;
		}
		else if(callParameters.graph != null)
		{
			this.graphBase = 'object';

			callParameters.INITIALIZE_TABLE_DISPLAY = false;
			
			$super(callParameters);

			try
			{
				if(Object.isString(callParameters.graph)) 
					callParameters.graph =  eval("(" + callParameters.graph + ")");
			}
			catch(e)
			{
				this.setErrorMessage(CORE_MESSAGE_STORE.LANGUAGE_GRAPH_YUI_MESSAGES.ERROR_PARSING_OBJECT);
				return;
			}
			
			this.baseTableData = {};
			this.graphDefinition = callParameters.graph.Graph != null ? callParameters.graph.Graph : callParameters.graph;
			this.baseTableData.graphTitle = this.title == null ? (this.graphDefinition.title != null ? this.graphDefinition.title : null) : this.title;
			this.draw();
			this.buildGraphFromJSON();
			this.baseTableData.graphObj.draw();
		}
		else
		{
			callParameters.INITIALIZE_TABLE_DISPLAY = false;
			$super(callParameters);
			
			this.setErrorMessage(CORE_MESSAGE_STORE.LANGUAGE_GRAPH_YUI_MESSAGES.ERROR_NO_DEFF);
		}
	},
	resizeStart: function() {
		this.InResizeEvent = true;
		if (this.doSizeOperation != null)
			clearTimeout(this.doSizeOperation);
		this.doSizeOperation = null;
	},
	resizeEnd: function() {
		this.InResizeEvent = false;
		this.setWidth(this.width);
		this.setHeight(this.height);
	},
	
	draw: function() {		
		var menu = [];
		var output = "";
		
		var link = "";
		if(this.sourceLink != null)
		{
			
			if(this.sourceLink.data == null)
			{
				link = "loadNewPageLayout(" + this.callBackText + ".sourceLink)";
			}
			else
			{
				link = "loadLink(" + this.callBackText + ".sourceLink)";
			}
			menu.push(
					{
						nodeType: "leaf",
						elementValue : this.sourceLinkLable,
						elementAction : 'onClick="' + link + ';"'
					});
		}
		

		output += '<div style="width:100%;height:100%;" id="' + this.elementUniqueID + '_chart"';
		//output += '	<tr><td align="center" style=""';
		if(this.sourceLink != null)
		{
			output += 'onClick="' + link + ';"';			
		}
		output += '>';
		if(null == navigator.mimeTypes["application/x-shockwave-flash"])
		{
			output += '				Unable to load Flash content. The YUI Charts Control requires Flash Player 9.0.45 or higher. <br/>';
			output += '				You can download the latest version of Flash Player from the <a href="http://www.adobe.com/go/getflashplayer">Adobe Flash Player Download Center</a>.';
		}
		output += '<h2>Trying to build graph...</H2>';
		output += '</div>';
		
		output += '<div id="' + this.elementUniqueID + '_tableErrorDisplayArea" style="text-align:center;background-color:#EEEEEE;border:solid 2px black;display:none;overflow-x: auto;overflow: hidden;position:relative;"></div>';
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).setContent(output, this.baseTableData.graphTitle, null, 'hidden', menu);

	},
	
	takeSnapShot : function() {
		
		var snapShotName = prompt("Enter snapshot name:", "");
		
		if(snapShotName === "") snapShotName = "";
		var snapShotObject = {
		 	displayData: this.currentDisplayData
		};
		 
		 graphDataSnapShots.set(name, snapShotObject);
	},
	
	setHeight : function(Amount) {},
	sizeHeight : function(Amount) {},
	setWidth : function(Amount) {this.width = Amount},
	sizeWidth : function(Amount) {this.width = Amount},
	
	setError: function(message) {
		var height = 0;
		var errorArea = $(this.elementUniqueID + "_tableErrorDisplayArea");
		if(errorArea != null)
		{
			errorArea.show();
			errorArea.update(message);
			height = errorArea.getHeight();
			errorArea.setStyle({ "top": "-" + (height + 5) + "px" });
		}
	},
	
	buildGraphFromJSON: function() {
		this.baseTableData.graphObj = new YUIGraphInterface(this.elementUniqueID, this.elementUniqueID + '_chart', this.parentStageID, this.parentWindowID, this.parentPanelID, this.parentPageID);
		this.baseTableData.graphObj.setGraphType(this.graphDefinition.graphType);
		this.baseTableData.graphObj.setXField(this.graphDefinition.xField);
		this.baseTableData.graphObj.setYField(this.graphDefinition.yField);
		this.baseTableData.graphObj.setDataField(this.graphDefinition.dataField);
		this.baseTableData.graphObj.setCategoryField(this.graphDefinition.categoryField);
		
		if(this.graphDefinition.dataSourceType == null)
		{
			this.baseTableData.graphObj.setDataSourceType("data_from_raw");
		}
		else
		{
			this.baseTableData.graphObj.setDataSourceType(this.graphDefinition.dataSourceType);
		}
		
		this.baseTableData.graphObj.setDataResponseSchema(this.graphDefinition.responseSchema);
		if(this.graphDefinition.style == null) this.graphDefinition.style = {};
		this.graphDefinition.style.animationEnabled = false;
		this.baseTableData.graphObj.setStyle(this.graphDefinition.style);
		this.baseTableData.graphObj.setSeries(this.graphDefinition.seriesDef);
		this.baseTableData.graphObj.setDataSource(this.graphDefinition.datasets);			
	},
	
	processDisplaySetup: function() {
		this.buildGraphFromTableDef();
		this.baseTableData.graphTitle = this.title == null ? (this.baseTableData.components.graph[this.graphName].title) : this.title;
	},
	
	renderTableData: function() {
		this.clearError();
		if(this.firstGraphLoad)
		{		
			this.baseTableData.graphObj.draw();	
		}
		else
		{
			this.baseTableData.graphObj.localChart.refreshData();
		}
		this.firstGraphLoad = false;
	},
	
	YUIGraphDataSource: function() {
		var tempIndex = 0;
		var value = null;
		var tempRow = null;
		var tempDataset = [];
		var currentRow = 1;
		var i = 0;
		
		var YField = this.baseTableData.graphObj.getYField();
		var columnObject = [];
		var renderingModule = TABLE_COLUMN_RENDERING_MODULES.get("column");
		for(i = 0; i < this.baseTableData.axisDataColumns.length; i++)
		{
			columnObject[i] = this.baseTableData.components["column"][this.baseTableData.axisDataColumns[i]];
		}
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++)
		{
			tempRow = {};
			for(i = 0; i < this.baseTableData.axisDataColumns.length; i++)
			{
				tempIndex = this.baseTableData.resultSetIndexByColumnName[this.baseTableData.axisDataColumns[i]];
			  
				var type = DB2_DATA_TYPE_CLASSIFICATION[this.baseTableData.columnsInfo.type[tempIndex].toLowerCase()];
			  
				value = this.baseTableData.baseData[currentRow][tempIndex];
				
				if (type == DB2_NUMBER)
				{
					if(columnObject[i].formatnumber != null)
						value = renderingModule.formatnumber(value, columnObject[i].formatnumber);
					else
						value = parseInt(value);	
				}
				
				tempRow[this.baseTableData.axisDataColumns[i]] = value;
			}
			tempDataset.unshift(tempRow);
		}
		this.currentDisplayData = tempDataset;
		return tempDataset;
	},
	
	buildGraphFromTableDef: function() {

		//TODO: Check for null and assign default.
		var tableGraphDef = this.baseTableData.components["graph"][this.graphName];
		var style = tableGraphDef.style; //TODO: Build default object
		
		var seriesDef = [];
		var axisDataColumns = [];
		
		var basecomponents = null;
		var datasetDef = null;
		var datasetDetails = null;
		var dataObject = null;
		
		var thisObject = this;
		
		var responseSchema = { fields: []};

		//Build the graph data but don't render it yet.
		this.baseTableData.graphObj = new YUIGraphInterface(this.elementUniqueID, this.elementUniqueID + '_chart', this.parentStageID, this.parentWindowID, this.parentPanelID, this.parentPageID);
			
		this.baseTableData.graphObj.setStyle(style);
		this.baseTableData.graphObj.setDataSourceType('data_from_raw');
		this.baseTableData.graphObj.setYAxis(new YAHOO.widget.NumericAxis());
		this.baseTableData.graphObj.setXAxis(new YAHOO.widget.NumericAxis());
		this.baseTableData.graphObj.setGraphType(tableGraphDef.type);
		this.baseTableData.axisDataColumns = [];
		
		basecomponents = $H(this.baseTableData.components['column']);
		basecomponents.each(function(componentGroup) {
			displayColumn = componentGroup.value;
			if(displayColumn.components != null)
			{
				if(displayColumn.components.axisdataset != null)
				{
					if(displayColumn.components.axisdataset[thisObject.graphName] != null)
					{
						datasetDef = displayColumn.components.axisdataset[thisObject.graphName];
						
						if(datasetDef != null)
						{
							thisObject.baseTableData.axisDataColumns.push(displayColumn.name);
							switch(datasetDef.axisType)
							{
								case 'x_axis_labels':
									thisObject.baseTableData.graphObj.setXField(displayColumn.name);
									break;
								case 'y_axis_labels':
									thisObject.baseTableData.graphObj.setYField(displayColumn.name);
									break;
								case 'category_field':
									thisObject.baseTableData.graphObj.setCategoryField(displayColumn.name);
									break;
								case 'data_field':
									thisObject.baseTableData.graphObj.setDataField(displayColumn.name);
									break;
								default:
									if((datasetDef.label == "" || datasetDef.label == null) && (displayColumn.title != "" && displayColumn.title != null))
									{
										datasetDef.label = displayColumn.title;
									}
									switch(tableGraphDef.type)
									{
										case 'stack_bar':
										case 'bar':
											seriesDef.push({
												displayName : datasetDef.label, 
												xField : displayColumn.name,
												style: datasetDef.dataStyle
											});
											break;
										case 'stack_column':
										case 'line':
										case 'column':
											seriesDef.push({
												displayName : datasetDef.label, 
												yField : displayColumn.name,
												style: datasetDef.dataStyle
											});
											break;
									}
									break;
							}
						}
						responseSchema.fields.push(displayColumn.name);
					}
				}
			}
		});
		this.baseTableData.graphObj.setSeries(seriesDef);
		
		
		//Refershe call back
		dataObject = new YAHOO.util.FunctionDataSource(function() {
				graphObject = GET_GLOBAL_OBJECT('YUI_GRAPH', this.GUID);
				if(graphObject != null)
					return graphObject.YUIGraphDataSource();
				return null;
			}, {GUID:this.GUID});
		dataObject.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
		dataObject.responseSchema = responseSchema;
		
		this.baseTableData.graphObj.setDataObject(dataObject);
	}
}));