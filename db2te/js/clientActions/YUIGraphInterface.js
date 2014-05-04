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
var activeGraphs = $H();
var YUIGraphInterface = Class.create(basePageElement, {
	initialize: function($super, GraphID, ContainerID, StageID, WindowID, PanelID, PageID) {
		GraphID = GraphID + "_YUIGraphInterface";
		$super(GraphID, "YUIGraphInterface");
		activeGraphs.set(GraphID, this);
		this.parentStageID = StageID;
		this.parentPanelID = PanelID;
		this.parentWindowID = WindowID;
		this.ContainerID = ContainerID;
		this.title = "";
		this.attributes = {};

		this.graphType = "null";
		this.graphDisplayed = false;
		this.updateEnabled = false;
		this.updateTimeOption = [1000, 5000, 30000, 60000, 120000, 300000, 600000];
		this.updateTime = null;
		this.localChart = null;
		this.dataSourceType = null; // DATA_FROM_URL, DATA_FROM_RAW, DATA_FROM_STREAM
		this.dataSource = null;
		this.dataResponseSchema = {"fields": ["Name", "Value", "Raw"]};
		this.connMethodPost = false;
		this.connXhrMode = null;
		this.dataObject = null;
		this.style = null;
		this.polling = 0;
		this.yAxis = new YAHOO.widget.NumericAxis();
		this.xAxis = new YAHOO.widget.NumericAxis();
		this.series = null;
		this.dataField = "count";
		this.categoryField = "response";
		this.xField = null;
		this.yField = "Name";
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		
		parentPanel.registerNestedObject(this.elementUniqueID, this);
		
	},
	setLocalChart: function(chart) {
		this.localChart = chart;
	},
	getLocalChart: function() {
		return this.localChart;
	},
	setTitle: function(title) {
		this.title = title;
		if(this.graphDisplayed)
			$(this.elementUniqueID + '_title').update(title);
	},
	setDataField: function(field) {
		this.dataField = field;
	},
	getDataField: function() {
		return this.dataField;
	},
	setCategoryField: function(field) {
		this.categoryField = field;
	},
	getCategoryField: function(field) {
		return this.categoryField;
	},
	getTitle: function() {
		return this.title;
	},
	setGraphType: function(type) {
		this.graphType = type;
	},
	getGraphType: function() {
		return this.graphType;
	},
	setDataResponseSchema: function(schema) {
		this.dataResponseSchema = schema;
	},
	getDataResponseSchema: function() {
		return this.dataResponseSchema;
	},
	setConnMethodPost: function(connMethod) {
		this.connMethodPost = connMethod;
	},
	getConnMethodPost: function() {
		return this.connMethodPost;
	},
	setConnXhrMode: function(xhrMode) {
		this.connXhrMode = xhrMode;
	},
	getConnXhrMode: function() {
		return this.connXhrMode;
	},
	setUpdateTimeOption: function(timeOption) {
		this.updateTimeOption = timeOption;
	},
	getUpdateTimeOption: function() {
		return this.updateTimeOption;
	},
	setUpdateTime: function(updateTime) {
		this.updateTime = updateTime;
	},
	getUpdateTime: function() {
		return this.updateTime;
	},
	setGraphDisplayed: function(graphDisplayed) {
		this.graphDisplayed = graphDisplayed;
	},
	getGraphDisplayed: function() {
		return this.graphDisplayed;
	},
	setUpdateEnabled: function(updateEnabled) {
		this.updateEnabled = updateEnabled;
	},
	getUpdateEnabled: function() {
		return this.updateEnabled;
	},
	setLocalChart: function(chart) {
		this.localChart = chart;
	},
	getLocalChart: function() {
		return this.localChart;
	},
	setDataSourceType: function(dataSourceType) {
		this.dataSourceType = dataSourceType;
	},
	getDataSourceType: function() {
		return this.dataSourceType;
	},
	setDataSource: function(dataSource) {
		this.dataSource = dataSource;
	},
	getDataSource: function() {
		return this.dataSource;
	},
	setData: function(data) {
		this.data = data;
	},
	updateDataSource: function(data) {
		this.dataSource = data;
		this.dataObject = new YAHOO.util.DataSource(this.dataSource);
		this.dataObject.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
		this.dataObject.responseSchema = this.dataResponseSchema;		
		this.dataObject.connMethodPost = this.connMethodPost;
		this.dataObject.connXhrMode = this.connXhrMode;
		this.localChart._setDataSource(this.dataObject);		
	},
	getData: function() {
		return this.data;
	},
	setDataFields: function(dataFields) {
		this.dataFields = dataFields;
	},
	getDataFields: function() {
		return this.dataFields;
	},
	setDataObject: function(dataObject) {
		this.dataObject = dataObject;
	},
	getDataObject: function() {
		return this.dataObject;
	},
	setStyle: function(style) {
		this.style = style;
	},
	getStyle: function() {
		return this.style;
	},
	setYAxis: function(yAxis) {
		this.yAxis = yAxis;
		if(this.localChart != null) this.localChart._setYAxis(yAxis);
	},
	getYAxis: function() {
		return this.yAxis;
	},
	setXAxis: function(xAxis) {
		this.xAxis = xAxis;
	},
	getXAxis: function() {
		return this.xAxis;
	},
	setSeries: function(series) {
		this.series = series;
	},
	getSeries: function() {
		return this.series;
	},
	setXField: function(xField) {
		this.xField = xField;
	},
	getXField: function() {
		return this.xField;
	},
	setYField: function(yField) {
		this.yField = yField;
	},
	getYField: function() {
		return this.yField;
	},
	buildAttributes: function() {
		switch(this.graphType.toLowerCase())
		{
			case "pie_graph":
			case "pie":
				this.attributes = {
					'wmode'   			:"transparent",
					'dataField'			: this.dataField,
					'categoryField'		: this.categoryField,
					'style'				: this.style
				};
				break;
			case "bar_graph":
			case "bar":
				this.attributes = {
					'wmode'   :"transparent",
					'yField'  :this.yField,
					'series'  :this.series,
					'style'   :this.style,
					'xAxis'   :this.xAxis,
					'polling' :this.polling
				};
				break;
			case "stack_bar":
				this.xAxis.stackingEnabled = true;
				this.attributes = {
					'wmode'   :"transparent",
					'yField'  :this.yField,
					'series'  :this.series,
					'style'   :this.style,
					'xAxis'   :this.xAxis,
					'polling' :this.polling
				};
				break;
			case "stack_column":
				this.yAxis.stackingEnabled = true;
				this.attributes = {
					'wmode'   :"transparent",
					'xField'  :this.xField,
					'series'  :this.series,
					'style'   :this.style,
					'yAxis'   :this.yAxis,
					'polling' :this.polling
				};
				break;
			default:
				this.attributes = {
					'wmode'   :"transparent",
					'xField'  :this.xField,
					'series'  :this.series,
					'style'   :this.style,
					'yAxis'   :this.yAxis,
					'polling' :this.polling
				};
				break;	
		}
	},
	buildDatasource: function()	{
		if(this.dataSourceType == null) this.dataSourceType =  "data_from_raw";
		this.dataObject = new YAHOO.util.DataSource(this.dataSource);
		if(this.dataSourceType.toLowerCase() == "data_from_raw")
			this.dataObject.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
		else
			this.dataObject.responseType = YAHOO.util.DataSource.TYPE_JSON;
		this.dataObject.responseSchema = this.dataResponseSchema;
		this.dataObject.connMethodPost = this.connMethodPost;
		this.dataObject.connXhrMode = this.connXhrMode;
	},
	draw: function() {
		this.buildAttributes();
		if(this.dataObject == null)
			this.buildDatasource();
		try {
			switch(this.graphType.toLowerCase()) {
				case "column_graph":
				case "column":
					this.localChart = new YAHOO.widget.ColumnChart(this.ContainerID, this.dataObject, this.attributes);
					break;
				case "stack_column":
					this.localChart = new YAHOO.widget.StackedColumnChart(this.ContainerID, this.dataObject, this.attributes);
					break;
				case "bar_graph":
				case "bar":
					this.localChart = new YAHOO.widget.BarChart(this.ContainerID, this.dataObject, this.attributes);
					break;
				case "stack_bar":
					this.localChart = new YAHOO.widget.StackedBarChart(this.ContainerID, this.dataObject, this.attributes);
					break;
				case "pie_graph":
				case "pie":
					this.localChart = new YAHOO.widget.PieChart(this.ContainerID, this.dataObject, this.attributes);
					break;
				default:
					this.localChart = new YAHOO.widget.LineChart(this.ContainerID, this.dataObject, this.attributes);
					break;
			}
		} catch (e) {
			throw "May be issue with Flash version, exception: " + e
		}
	},
	updateGraphTime: function(time) {
		try {
			this.updateTime = time;
			if(this.localChart != null)
				this.localChart._setPolling(time);
		} catch(e){}
	},
	destroy: function($super) {
		if(this.localChart == null)
			return;
		activeGraphs.unset(this.elementUniqueID);
		this.updateGraphTime(null);
		
		try {
			if(this.localChart != null)
				this.localChart.destroy();
		} catch (e) {}
		$super();
	}
});
