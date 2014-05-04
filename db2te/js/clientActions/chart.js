/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009-2013 All rights reserved.
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
 
CORE_CLIENT_ACTIONS.set("chart",  Class.create(CORE_CLIENT_ACTIONS.get("list_table"), {
	initialize: function($super, callParameters) {
		this.firstChartLoad = true;
		this.renderingData = false;
		x=0;				// set up color pallet
		this.colourPallet=[];
		delta=255/5;
		for (i=0;i<5;i++)
			for (j=0;j<5;j++)
				for (k=0;k<5;k++)
					this.colourPallet[x++] = 'rgb(' + Math.floor(i*delta) + ',' + Math.floor(j*delta) + ','+ Math.floor(k*delta) +')';
		if(callParameters.table == null) throw "Cannot render chart as table name not specified";
		this.disableLeftMenu = callParameters.disableLeftMenu != null ? (Object.isString() ? (callParameters.disableLeftMenu == 'true' ? true : false) : callParameters.disableLeftMenu ) : false;
		this.parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		this.tableChart=(callParameters.$tableChart==null?null:callParameters.$tableChart);
		this.settingsDOM=getDOMParsed(callParameters.$settings==undefined
									?'<settings></settings>'
									:callParameters.$settings.indexOf('<')<0
										?callParameters.$settings
										:'<settings>'+callParameters.$settings+'</settings>'
					);
		this.lineWidth				= parseInt(this.getSetting('line/@width',1,callParameters.$lineWidth),10);
		this.axisXLineWidth 		= parseInt(this.getSetting('axis/x/@width',1,callParameters.$axisXLineWidth),10);
		this.axisYLineWidth 		= parseInt(this.getSetting('axis/y/@width',1,callParameters.$axisYLineWidth),10);
		this.axisLineWidth  		= parseInt(this.getSetting('axis/line/@width',1,callParameters.$axisLineWidth),10);
		this.axisXTickWidth 		= parseInt(this.getSetting('axis/x/tick/@width',1,callParameters.$axisXTickWidth),10);
		this.axisYTickWidth 		= parseInt(this.getSetting('axis/y/tick/@width',1,callParameters.$axisYTickWidth),10);
		this.highlight				= this.getSetting('highlight','',callParameters.$highlight);
		this.legendDisplay			= this.getSetting('legend/@display','show',callParameters.$legend);
		this.menuDirectory			= this.getSetting('menuDirectory',callParameters.$menuDirectory);
		this.contextMenuDirectory 	= this.getSetting('contextMenuDirectory',callParameters.$contextMenuDirectory);
		this.showOptions			= (this.getSetting('showOptions','true',callParameters.$showOptions)=='true');
		this.chartName				= this.getSetting('name','default',callParameters.$chartName);
		this.chartTitle				= this.getSetting('title',this.chartName,callParameters.$chartTitle);
		this.chartType				= this.getSetting('type','line',callParameters.$type).toLowerCase();
		this.chartWidth				= parseInt(this.getSetting('width',100,callParameters.$chartWidth),10);
 		this.chartHeight			= parseInt(this.getSetting('height',100,callParameters.$chartHeight),10);
		this.historyInclude			= this.getSetting('historyInclude','false',callParameters.$historyInclude);
		this.outline				= this.getSetting('outline','black',callParameters.$outline);
		this.xAxisPosition			= parseInt(this.getSetting('axis/x/@position',0,callParameters.$xAxisPosition),10);
		this.yAxisPosition			= parseInt(this.getSetting('axis/y/@position',0,callParameters.$yAxisPosition),10);
		this.display				= this.getSetting('display/@type','chart',callParameters.$display);
		this.tickIncrement			= parseInt(this.getSetting('tick/@increment',5,callParameters.$tickIncrement),10);
		this.scaleUpOnly			= this.getSetting('axis/scale/@upOnly','false',callParameters.scaleUpOnly);
		this.scaleDownOnly			= this.getSetting('axis/scale/@downOnly','false',callParameters.scaleDownOnly);
		this.maxYScale				= parseInt(this.getSetting('axis/y/scale/@max',1,callParameters.$maxYScale),10);
		this.minYScale				= parseInt(this.getSetting('axis/y/scale/@min',1,callParameters.$minYScale),10);
		this.flipDataSet			= (this.getSetting('fileDataset','false',callParameters.$flipDataSet)=='true');
		this.showPoints				= (this.getSetting('showPoints','false', callParameters.$showPoints)=='true');
		this.colour					= this.getSetting('colours'
											,callParameters.$colours == null
											? '#FF0000' // Red 		
											+',#00FFFF' // Turquoise 		
											+',#408080' // Grass Green
											+',#0000A0' // Dark Blue 		
											+',#FF8040' // Orange 	
											+',#FFFF00' // Yellow 	 	
											+',#800000' // Burgundy 	
											+',#800080' // Dark Purple 	
											+',#804000' // Brown 	
											+',#00FF00' // Pastel Green 		
											+',#FF00FF' // Pink 	 	
											+',#C0C0C0' // Light Grey 	
											+',#808000' // Forest Green 	
											+',#0000FF' // Light Blue 	 	
											+',#FF0080' // Light Purple 	 	
											+',#808080' // Dark Grey
											:'black,'+callParameters.$colours
										).split(',');
		this.slices					=this.getSetting('slices','row',callParameters.$slices);
		this.grouping				= this.getSetting('grouping',null,callParameters.$grouping==undefined?callParameters.$pivotColumn:callParameters.$grouping);
		this.delta					= this.getSetting('delta',null,callParameters.$delta);
		this.autoDelta = (this.getSetting('axis/@autoDelta','true',callParameters.$autoDelta)=="true");
		
		this.deltaNormaliser		= parseInt(this.getSetting('deltaNormaliser',1,callParameters.$deltaNormaliser),10);
		this.legendPositionX		= parseInt(this.getSetting('legend/position/@x',60,callParameters.$legendPositionX),10);
		this.legendPositionY		= parseInt(this.getSetting('legend/position/@y',0,callParameters.$legendPositionY),10);
		this.yAxisUpperBound 		= this.getSetting('axis/y/@isUpperBound',null,callParameters.$yAxisUpperBound);
		this.yAxisLowerBound 		= this.getSetting('axis/y/@isLowerBound',null,callParameters.$yAxisLowerBound);
		this.xAxis					= this.getSetting('axis/x/column/@name',null,callParameters.$xAxis);
		this.yAxis					= this.getSetting('axis/y/column/@name',null,callParameters.$yAxis);
		this.yScaling				= this.getSetting('axis/y/@scaling','AUTO',callParameters.$yScale);
		this.zAxis					= this.getSetting('axis/z/column/@name',null,callParameters.$zAxis);
		this.bubbleRatio			= this.getSetting('axis/bubble/@ratio',0.2,callParameters.$bubbleRatio);
		this.overlays=getNodesByXPath(this.settingsDOM,this.settingsDOM,'/settings/overlay');
		this.overlayDetails=[];
		this.onNoDataThrowError		= (this.getSetting('@onNoDataThrowError','true',callParameters.$onNoDataThrowError)=="true");
		delete callParameters.$onNoDataThrowError;
		delete callParameters.$settings;
		delete callParameters.$type;
		delete callParameters.$chartTitle;
		delete callParameters.$chartName;
		delete callParameters.$xAxis;
		delete callParameters.$yAxis;
		delete callParameters.$yScale;
		delete callParameters.$zAxis;
		delete callParameters.$grouping;
		$super(callParameters);
		if(this.table != "$parentGUID")
			this.parentPanel.refreshCallback = this.callBackText + '.refresh()';
	},
	chartSize: function () {
		if(this.canvas==null) return;
		try {this.resize();} catch(e){this.setError(e);return;}
		try { 
			this.redrawChart();
		} catch(e) {
			openModalAlert('Error :'+e.toString());
		}
	},
	checkExists : function(value,errorMessage) {
	 	if (value==null) openModalAlert("check exists error: "+errorMessage);
	},
	getChartSetting: function (location,defaultValue) {
		if(this.chartSettingsDOMActive==null)
			this.chartSettingsDOMActive=getNodesByXPath(this.baseTableData.sourceDOM,this.baseTableData.sourceDOM,"table/charts/chart[first()]");
		value=getNodesByXPath(this.baseTableData.sourceDOM,this.chartSettingsDOMActive,location);
		if(value.length==0) return defaultValue;
		if(value.length==1) return value[0].textContent;
		var list="";
		for(var i=1;i<value.length;i++)
			list+=","+value[i].textContent;
		return value[0].textContent+list;
	},
	getSetting: function (location,defaultValue,parameter) {
		if(parameter!=undefined) return parameter;
		var value=getNodesByXPath(this.settingsDOM,this.settingsDOM,'/settings/'+location);
		if(value.length==0) return defaultValue;
		if(value.length==1) return value[0].textContent;  // nodevalue
		var values="";
		for(var i=1;i<value.length;i++)
			values+=","+value[i].textContent;
		return value[0].textContent+values;
	},

	loadContextMenus: function() {
		if (this.contextMenuDirectory==null) return;
		this.loadMenus(this.contextMenuDirectory,this.parentPanel);
	},
	loadMenus: function(menu,targetWindow) {
		var thisObject = this;
		if (menu==null) {
			if (this.menuDirectory==null) return;
			menu=this.menuDirectory;
		}
		if(targetWindow==null)
			targetWindow=getWindow(this.parentStageID, this.parentWindowID );
		POSTDATA = {
				 uniqueID 		: this.elementUniqueID
				,stageID 		: this.parentStageID
				,windowID 		: this.parentWindowID
				,panelID 		: this.parentPanelID
				,returntype 	: 'JSON'
				,baseMenuFolder	: menu
				,defaultStage 	: this.elementUniqueID + "_stage"
				,action			: "menu"
			}
	
		new Ajax.Request(ACTION_PROCESSOR, {
				'parameters': POSTDATA,
				'method': 'post',
				'onCreate': function() {
					thisObject.parentPanel.startServerLoadIndicator();
				},
				'onComplete' : function() {
					thisObject.parentPanel.clearLoadIndicator();
				},

				'onSuccess': function(transport) {
					thisObject.parentPanel.setClientLoadIndicator();
					var menu = transport.responseJSON;
					if(menu.length != 0)
						if(menu[0].elementPageWindows != null || menu[0].elementLinkList != null)
							loadDecodedPage(menu[0].elementPageWindows, menu[0].elementLinkList);
					thisObject.targetWindow.setWindowTitle(thisObject.chartTitle,thisObject.setMenuOptions(menu),null);
				},
				'onFailure': function(transport,error) {
					thisObject.setError("Error Loading Menu, error: "+ error);
				}
		});
	},
	processChartSettings: function(name) {
		this.chartSettingsDOMActive==null;
		charts=getNodesByXPath(this.baseTableData.sourceDOM,this.baseTableData.sourceDOM,"table/charts/chart["+( this.chartName=='default' ?"count(@name)=0" : "@name='"+this.chartName+"'" )+"]");
		if(charts.length==0) return;
		this.chartSettingsDOMActive=charts[0];
		this.lineWidth				= parseInt(this.getChartSetting('line/@width',this.lineWidth),10);
		this.axisXLineWidth 		= parseInt(this.getChartSetting('axis/x/@width',this.axisXLineWidth),10);
		this.axisYLineWidth 		= parseInt(this.getChartSetting('axis/y/@width',this.axisYLineWidth),10);
		this.axisLineWidth  		= parseInt(this.getChartSetting('axis/line/@width',this.axisLineWidth),10);
		this.axisXTickWidth 		= parseInt(this.getChartSetting('axis/x/tick/@width',this.axisXTickWidth),10);
		this.axisYTickWidth 		= parseInt(this.getChartSetting('axis/y/tick/@width',this.axisYTickWidth),10);
		this.highlight				= this.getChartSetting('highlight',this.highlight);
		this.legendDisplay			= this.getChartSetting('legend/@display',this.legendDisplay);
		this.menuDirectory			= this.getChartSetting('menuDirectory',this.menuDirectory);
		this.contextMenuDirectory 	= this.getChartSetting('contextMenuDirectory',this.contextMenuDirectory);
		this.showOptions			= this.getChartSetting('showOptions',this.showOptions);
		this.chartTitle				= this.getChartSetting('title',this.chartName);
		this.chartType				= this.getChartSetting('type',this.type).toLowerCase();
		this.chartWidth				= parseInt(this.getChartSetting('width',this.chartWidth),10);
 		this.chartHeight			= parseInt(this.getChartSetting('height',this.chartHeight),10);
		this.historyInclude			= this.getChartSetting('@historyInclude',this.historyInclude);
		this.xAxisPosition			= parseInt(this.getChartSetting('axis/x/@position',this.xAxisPosition),10);
		this.yAxisPosition			= parseInt(this.getChartSetting('axis/y/@position',this.yAxisPosition),10);
		this.display				= this.getChartSetting('display/@type',this.display);
		this.tickIncrement			= parseInt(this.getChartSetting('tick/@increment',this.tickIncrement),10);
		this.scaleUpOnly			= (this.getChartSetting('axis/scale/@upOnly',this.scaleUpOnly=='true'));
		this.scaleDownOnly			= (this.getChartSetting('axis/scale/@downOnly',this.scaleDownOnly=='true'));
		this.maxYScale				= parseInt(this.getChartSetting('axis/y/scale/@max',this.maxYScale),10);
		this.minYScale				= parseInt(this.getChartSetting('axis/y/scale/@min',this.minYScale),10);
		this.flipDataSet			= (this.getChartSetting('fileDataset',this.flipDataSet)=='true');
		this.showPoints				= (this.getChartSetting('showPoints',this.showPoints)=='true');
		this.colour					= this.getChartSetting('colours',this.colour.toString()).split(',');
		this.slices					= this.getChartSetting('slices',this.slices);
		this.grouping				= this.getChartSetting('grouping',this.grouping);
		this.delta					= this.getChartSetting('delta',this.delta);
		this.deltaNormaliser		= parseInt(this.getChartSetting('deltaNormaliser',this.deltaNormaliser),10);
		this.legendPositionX		= parseInt(this.getChartSetting('legend/position/@x',this.legendPositionX),10);
		this.legendPositionY		= parseInt(this.getChartSetting('legend/position/@y',this.legendPositionY),10);
		this.yAxisUpperBound 		= this.getChartSetting('axis/y/@isUpperBound',this.yAxisUpperBound);
		this.yAxisLowerBound 		= this.getChartSetting('axis/y/@isLowerBound',this.yAxisLowerBound);
		this.xAxis					= this.getChartSetting('axis/x/column/@name',this.xAxis);
		this.yAxis					= this.getChartSetting('axis/y/column/@name',this.yAxis);
		this.zAxis					= this.getChartSetting('axis/z/column/@name',this.zAxis);
		this.yScaling				= this.getChartSetting('axis/y/@scaling',this.yScaling);
		var filter=getNodesByXPath(this.baseTableData.sourceDOM,this.chartSettingsDOMActive,'filter');
		if(filter.length==0) this.chartFilter=[];
		if(filter.length>1) throw "too many filter elements for chart"; 
		this.chartFilter=this.getRowFilters(filter[0],this.baseTableData.sourceDOM,this.baseTableData);
		this.autoDelta = (this.getChartSetting('axis/@autoDelta',this.autoDelta?"true":"false")=="true");
		this.overlays=getNodesByXPath(this.baseTableData.sourceDOM,this.chartSettingsDOMActive,'overlay');
	},
	processDisplaySetup: function($super) {
		this.baseTableData.chartTitle = this.chartTitle;
		if (this.display=='data' || this.baseTableData.rowsReturned == 0) 
			$super();
	},
	processAxis: function(axis) {
		this[axis+"Series"]=[];
		if(this[axis+"Axis"]==null) throw axis+"Axis not defined"
		var series=this[axis+"Axis"].toUpperCase().split(',');
		for(var i=0;i<series.length;i++) { 
			if(!isDatabaseConnectionVersion(this.baseTableData.components.column[series[i]])) continue;
			this[axis+"Series"].push(series[i]);
		}	
		if(this[axis+"Series"].length==0)	throw axis+"Axis has no valid values for the database version, "+axis+"Axis: "+this[axis+"Series"];
	},
	processParameters: function($super,pageCallParameters) {
		$super(pageCallParameters);
		this.processChartSettings();
		if(this.xAxis!=null) this.xAxis= this.xAxis.toUpperCase();
		if(!isDatabaseConnectionVersion(this.baseTableData.components.column[this.xAxis])) this.xAxis='';
		this.processAxis("y");
		if(this.zAxis!=null)
			if(this.zAxis!="")
				this.processAxis("z");
		switch (this.highlight) {
				case 'first':
				case 'last':
				case '':
					break;
				default:
					throw "parameter highlight: '"+this.highlight+"' can only equal first or last";
		}
		switch (this.legendDisplay) {
				case 'show':
				case 'hide':
					break;
				default:
					throw "parameter legend can only equal show or hide, not "+this.legendDisplay;
		}
		if(this.grouping!=null) 
			this.grouping = this.grouping.toUpperCase();
		else if(this.baseTableData.primaryKeys.length>0)
			this.grouping = this.baseTableData.primaryKeys.toString();
		switch (this.slices) {
			case 'row':
			case 'column':
				break;
			default:
				throw "parameter slices can only equal row or column";
		}
		if(Object.isString(this.scaleUpOnly)) this.scaleUpOnly = (this.scaleUpOnly=='true'); 
		if(Object.isString(this.scaleDownOnly)) this.scaleDownOnly = (this.scaleDownOnly=='true'); 
		if (this.delta!=null) this.delta=this.delta.toUpperCase();
		if(this.yAxisUpperBound!=null) this.yAxisUpperBound=parseInt(this.yAxisUpperBound,10); 
		if(this.xAxisUpperBound!=null) this.xAxisUpperBound=parseInt(this.xAxisUpperBound,10); 
		switch (this.chartType) {
			case 'bubble':
			case 'bubbleandline':
				this.checkExists(this.zAxis,'Missing parameter zAxis');
			case 'line':
			case 'pushline':
			case 'setline':
				this.checkExists(this.xAxis,'Chart type: '+this.chartType+' is missing parameter xAxis');
			case 'stack':
			case 'bar':
			case 'pie':
			case 'events':
				this.checkExists(this.yAxis,'Missing parameter yAxis');
				break;
			default:
				throw 'Unknown chart type: ' + this.chartType;
		}
		switch (this.chartType) {
			case 'bar':
			case 'bubble':
			case 'bubbleandline':
			case 'line':
			case 'pushline':
			case 'setline':
			case 'stack':
				this.yScaling=this.yScaling.toUpperCase();
				break;
			case 'pie':
				this.grouping=null;
				this.yScaling="NOAXIS";
				break;
			default:
		}
		this.historyInclude = (this.historyInclude=="true");
	},
	setParameter: function(name,value) {
		this[name]=value;
		switch (name) {
			case 'legendDisplay': 
						this.legendDisplay=value;
						this.legend.setStyle({'display': (this.legendDisplay=="hide"?"none":"block")});
						return (this.legendDisplay=="hide"?"show":"hide");
		}
		this.chartSize();
		switch (name) {
			case 'slices': return (value=='row'?'column':'row');
			case 'yScaling': return (value=='AUTO'?'EXPONENTIAL':'AUTO');
			case 'chartType': 
				switch (this.chartType) {
					case 'bar': return 'stack';
					case 'stack': return 'bar';
					case 'setline': return 'pushline';
					case 'pushline': return 'setline';
				}
			case 'display':
				this.firstChartLoad = true;
				this.renderTableData();
				return (value=='chart'?'data':'chart');
		}
	},

	setMenuOptions: function(menuArray) {
		if(!this.showOptions) return null;
		if(menuArray==null) menuArray=[];
		if(this.optionsDialog==null) {
			this.optionsDialog = new floatingPanel(this.elementUniqueID + '_optionsDialog', 'RAW', "", this.elementUniqueID + '_optionsDialog_button', false, false);
			this.parentPanel.registerNestedObject(this.elementUniqueID + '_optionsDialog', this.optionsDialog);
		}
		var thisObject = this;
		if(!this.disableLeftMenu)
			if(this.baseTableData.localLeftMenu!=null)
				menuArray=menuArray.concat(this.baseTableData.localLeftMenu);
		options='';
		switch (this.chartType) {
			case 'pie':
				options+='<tr><td>Slice</td><td>' 
						+'<input type="button" value="'
						+(this.slices=='row'?'column':'row')
						+'" onclick="this.value='+this.callBackText+'.setParameter('+"'slices'"+',this.value)"/>'
						+'</td></tr>';
				break;
			case 'bubble':
			case 'bubbleandline':
			case 'line':
				options+='<tr><td>Y Scaling</td><td>'
						+'<input type="button" value="'
						+(this.yScaling=='AUTO'?'EXPONENTIAL':'AUTO')
						+'" onclick="this.value='+this.callBackText+'.setParameter('+"'yScaling'"+',this.value)"/>'
						+'</td></tr>';
				break;
			case 'pushline':
			case 'setline':
				options+='<tr><td>Chart Type</td><td>'
						+'<input type="button" value="'
						+(this.chartType=='setline'?'pushline':'setline')
						+'" onclick="this.value='+this.callBackText+'.setParameter('+"'chartType'"+',this.value)"/>'
						+'</td></tr>';
				break;
			case 'bar':
			case 'stack':
				options+='<tr><td>Chart Type</td><td>'
						+'<input type="button" value="'
						+(this.chartType=='bar'?'stack':'bar')
						+'" onclick="this.value='+this.callBackText+'.setParameter('+"'chartType'"+',this.value)"/>'
						+'</td></tr>';
				break;
		}
		options+='<tr><td>Legend</td><td>'
				+	'<input type="button" value="'+(this.legendDisplay=="hide"?"show":"hide")+'" onclick="this.value='+this.callBackText+'.setParameter('+"'legendDisplay'"+',this.value)"/>'
				+'</td></tr>'
				+'<tr><td>Show</td><td>'
				+'	<input type="button" value="'+(this.display=="chart"?"data":"chart")+'" onclick="this.value='+this.callBackText+'.setParameter('+"'display'"+',this.value)"/>'
				+'</td></tr>'
				+'<tr><td>Max. rows</td><td>'
				+'	<input type="text" value="'+this.baseTableData.maxResultsToFetch+'" onchange="'+this.callBackText+'.setParameter('+"'baseTableData.maxResultsToFetch'"+',this.value)"/>'
				+'</td></tr>';
		if(this.overlays.length>0) {
			options+='<tr><td>Overlay:</td><td><table><tr>';
			for(var i=0;i<this.overlays.length;i++) 
				options+='<td>'
						+'<input type="button" value="'+ (i+1) + '" '
						+	' onclick="'+this.callBackText+'.overlayShowPanel('+i+')"/>'
						+'</td>';
			options+='</tr></table></td></tr>';
		}
		this.optionsDialog.draw();
		this.optionsDialog.setContent('<table>'+options+this.getMetricColumnsOptions()+'</table>','Options', null, null, null);
		menuArray.push({
				nodeType : "leaf",
				elementID : this.elementUniqueID + '_optionsDialog_button',
				elementValue : "Options",
				elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_optionsDialog\').show_and_size(\'' + this.elementUniqueID + '_optionsDialog_button\');"'
		});
		return menuArray;
	},
	refresh : function() {
		if(this.table=='$parentGUID') return;
		this.firstChartLoad = true;
		this.retrieveTableData();
	},
	setHeight: function(Amount) {this.chartSize();},
	setDisplay: function(data) {
		this.firstChartLoad = true;
		var container = $(this.parentPageID);
		if(container != null)
			container.update(data 
						+ "<table id='" + this.elementUniqueID + "_detailNode' style='border-style: solid; border-width:1px; font-size:10px; top:0px; left:60px ; position:absolute ; display:block; background-color: #FFFFFF;'"
						+	"></table>"
						);
 		this.detailNode = document.getElementById(this.elementUniqueID + "_detailNode");
	},
	setError: function(ErrorMSG) {
		this.setDisplay("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+ErrorMSG+"</h2></td></tr></table>");
	},
	setWidth: function(Amount) {this.chartSize();},
	sizeWidth: function(Amount) {this.chartSize();},
	sizeHeight: function(Amount) {this.chartSize();},
	renderTableData: function($super) {
		if (this.display=='data' || this.baseTableData.rowsReturned == 0) {
			this.firstChartLoad = true;
			$super();
			return;
		}
		if(this.renderingData) return;
		this.renderingData=true;
		try{
			this.renderTableDataBuild();
		} catch(e) {
			this.renderingData=false;
			throw e;
		}
		this.renderingData=false;
	},
	renderTableDataBuild: function() {
		if(this.chartType == 'pushline') {
			var localColumns = [];
			for( var i= 0; i < this.data.length; i++) {
				if (this.data[i][j]==null) continue;
				xPos=this.xAxisPosition+Math.floor((i)*this.tickIncrement)+(j-1)*this.barWidth;
				yPos=this.yPosition(this.yScale(this.data[i][j]));
				this.ctx.lineTo(xPos,yPos);
				if(this.showPoints)	
					this.ctx.arc(xPos,yPos, 3, 0, Math.PI*2, false);
			}
		} else this.buildLocalDataSet();
		if(this.firstChartLoad) {
			if(this.chartSettingsDOMActive==null)
				if(this.chartName!=null) 
					this.processParameters();
			if (this.delta==null) {
				if(this.autoDelta) {
					this.delta='';
					for (column in this.baseTableData.components.column)
						if(this.baseTableData.components.column[column].isAccumulation) 
							this.delta+=','+column;
					this.delta= ( this.delta=='' ? null : this.delta.substr(1) );
				}
			}
		}
		this.buildDataSet();
		if(this.firstChartLoad) {
			this.firstChartLoad = false;
			this.drawCanvas();
			this.loadMenus();
			this.loadContextMenus();
		} 
		this.chartSize();
	},
	drawChart_bar: function () {
		var xPos = 0;
		var yPos = 0;
		this.barWidth=Math.floor(this.tickIncrement/this.columnIndexDetails.y.size);
		for( var i= 0; i < this.data.length; i++) {
			for( var j=this.columnIndexDetails.y.start; j<this.columnIndexDetails.y.end; j++) {
				if (this.data[i][j]==null) continue;
				xPos=this.xAxisPosition+Math.floor((i+0.5)*this.tickIncrement)+(j-1)*this.barWidth;
				yPos=this.yPosition(this.yScale(this.data[i][j]));
				if(this.outline!='none') {
					this.ctx.strokeStyle=this.outline;
					this.ctx.strokeRect(xPos,yPos,this.barWidth,this.yAxisPosition-yPos);
				} 
				this.ctx.fillStyle = this.colour[j];
				this.ctx.fillRect(xPos,yPos,this.barWidth,this.yAxisPosition-yPos);
			}
		}
	},
	drawChart_bubble: function () {
		var zDetails=this.columnIndexDetails.z;
		this.ctx.globalAlpha=0.5;
		this.ctx.lineWidth = 1;
		jStart=this.columnIndexDetails.y.start;
		for( var i= 0; i < this.data.length; i++) {
			for( var j=this.columnIndexDetails.y.start; j<this.columnIndexDetails.y.end; j++) {
				var data = (this.deltaIndex[this.columnIndex[j]]? this.deltaData : this.data)
				var zData = ( zDetails.deltaIndex[zDetails.columnIndex[j]] ? zDetails.deltaData : zDetails.dataStore );
				if (this.data[i][j]==null) continue;
				var y=data[i][j];
				if(isNaN(y)) continue;
				xPos=this.xPosition(this.xScale(this.data[i][0]));
				yPos=this.yPosition(this.yScale(y));
				radius=Math.abs(this.zScale( zData[i][j],j)/2);
				if(radius==0) continue
				this.ctx.fillStyle = this.colour[j];
				if(this.outline!='none') {
					this.ctx.strokeStyle=this.outline;
				} 
				this.ctx.beginPath();
				this.ctx.arc(xPos, yPos, radius, 0, 2 * Math.PI, false);
				this.ctx.closePath();
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
		this.ctx.globalAlpha=1;
	},
	drawChart_bubbleandline: function () {
		this.drawChart_line();
		this.drawChart_bubble();
	},
	drawChart_events: function (data) {
		var dataX, plotX;
		this.ctx.globalAlpha=0.8;
		this.ctx.strokeStyle = 'red';  
		this.ctx.lineWidth=this.lineWidth;
		for( var j=0 ; j<data.length; j++) {
			dataX=data[j][0];
			if (dataX==null || isNaN(dataX) ) continue;
			plotX=this.xPosition(this.xScale(dataX));
			this.ctx.beginPath();
			this.ctx.moveTo(plotX ,this.yAxisPosition);  
			this.ctx.lineTo(plotX ,0);
			this.ctx.stroke();
		}
		this.ctx.globalAlpha=1;
	},
	drawChart_line: function () {
		this.ctx.globalAlpha=0.8;
		var errors;
		for( var j=this.columnIndexDetails.y.start; j<this.columnIndexDetails.y.end; j++)
			try {
				this.plot(j, 1, (this.deltaIndex[this.columnIndex[j]]? this.deltaData : this.data) );
			} catch(e) {
				errors += 'error plotting '+ this.label[i] + '  ' +e +'\n';
			}
		if (errors) throw errors;
		this.ctx.globalAlpha=1;
	},
	drawChart_pie: function () {
		if(this.chartHeight==0  || this.chartWidth == 0) return;
		var xPos=0, yPos=0;
		var piesCount=(this.slices=='row'?this.columnIndexDetails.y.size+1:this.data.length);
		var squareSize=Math.sqrt((this.chartHeight*this.chartWidth)/(piesCount+1));
		if (squareSize>this.chartHeight) squareSize=this.chartHeight;
		if (squareSize>this.chartWidth) squareSize=this.chartWidth;
		if (squareSize<30)
			throw 'Not enough space to draw pie chart, number of charts: '+piesCount+' chart width:' + this.chartWidth + 'height:' + this.chartHeight;
		for( var i=(this.slices=='row'?0:0); i < piesCount; i++) {
			this.drawPie(xPos,yPos,squareSize,i);
			xPos+=squareSize;
			if (xPos>this.chartWidth) {
				xPos=0;
				yPos+=squareSize;
				if (xPos>this.chartWidth) 
					throw 'Not enough space to draw pie chart';
			}
		}
	},
	drawChart_pushline: function () {
		var errors;
		this.barWidth=Math.floor(this.tickIncrement/this.columnIndexDetails.y.size);
		for( var j=this.columnIndexDetails.y.start; j<this.columnIndexDetails.y.end; j++)
			try {
				this.plotSet(j, 1, (this.deltaIndex[this.columnIndex[j]]? this.deltaData : this.data) );
			} catch(e) {
				errors += 'error plotting '+ this.label[i] + '  ' +e +'\n';
			}
		this.ctx.stroke();
		if (errors) throw errors;
	},
	drawChart_setline: function () {return this.drawChart_pushline();},
	drawChart_stack: function () {
		var xPos=0, yPos=0, y=0;
		this.barWidth=this.tickIncrement;
		for( var i= 0; i < this.data.length; i++) {
			xPos=this.xAxisPosition+Math.floor((i+0.5)*this.tickIncrement);
			var total=0;
			for( var j=this.columnIndexDetails.y.start; j<this.columnIndexDetails.y.end; j++) {
				if (this.data[i][j]==null) continue;
				total+=this.data[i][j];
			}
			yPos=this.yAxisPosition-this.yScale(total);
			for( var j=this.columnIndexDetails.y.start; j<this.columnIndexDetails.y.end; j++) {
				if (this.data[i][j]==null) continue;
				y=this.yScale(this.data[i][j]);
				if(this.outline!='none') {
					this.ctx.strokeStyle=this.outline;
					this.ctx.strokeRect(xPos,yPos,this.barWidth,y);
				} 
				this.ctx.fillStyle = this.colour[j];
				this.ctx.fillRect(xPos,yPos,this.barWidth,y);
				yPos+=y;
			}
		}
	},
	redrawChart: function () {
		if(this.canvas==null) return;
		var errors;
		switch (this.chartType) {
			case 'pie':
				var colourCnt=(this.slices=='row'?this.data.length:this.columnIndexDetails.y.size+1);
				break;
			default:
				var colourCnt=this.columnIndexDetails.y.size+1;
		}
		if (colourCnt>this.colour.length) {
			var delta=this.colourPallet.length/colourCnt;
			for( var i= this.colour.length; i < colourCnt; i++) 
				this.colour[i]=this.colourPallet[Math.floor(i*delta)];
		}
		this.ctx.clearRect(0,0,this.chartWidth,this.chartHeight);
		this.ctx.strokeStyle = "black";
		this.ctx.lineWidth=1;
		switch (this.chartType) {
			case 'bar':
			case 'bubble':
			case 'bubbleandline':
			case 'line':
			case 'pushline':
			case 'setline':
			case 'stack':
				this.drawLineAxis();
				break;
			default:
		}
		try { this["drawChart_"+this.chartType]();} catch(e) {throw "drawing " + this.chartType + "\n" + e.toString(); };
		while (this.legend.rows.length> 0) 
			this.legend.deleteRow(0);
		switch (this.chartType) {
			case 'pie':
				if(this.slices=='row') {
					for(var i = 1; i < this.data.length; i++)
						this.legend.insertRow(-1).insertCell(-1).innerHTML= "<a style='color:" + this.colour[i] + "' >" + this.data[i][0] + "</a>";
				} else 
					for(var i=this.columnIndexDetails.y.start; i<this.columnIndexDetails.y.end; i++)
						this.legend.insertRow(-1).insertCell(-1).innerHTML="<a style='color:" + this.colour[i] + "' >" + this.label[i] + "</a>";
				break;
			default:
				this.legend.insertRow(-1).insertCell(-1).innerHTML="x axis: " + this.label[0];
				for(var i=this.columnIndexDetails.y.start; i<this.columnIndexDetails.y.end; i++) {
					this.legend.insertRow(-1).insertCell(-1).innerHTML= "<a style='color:" + this.colour[i] + "' >" + this.label[i] 
																	+ (this.zAxis?" z is " +this.columnIndexDetails.z.label[i]:"")
																	+ "</a>";
				}
		}
		this.overlayDraw();
	},
	canvasCoordsDetails: function (chart,xPos,yPos) {
		var XYRow=chart.detailXY.insertRow(-1);
		switch (this.chartType) {
			case 'events':
				var xPlot= (xPos - chart.xOffset)/chart.xRatio;
				var xMinRange= (xPos- 5 - chart.xOffset)/chart.xRatio;
				var xMaxRange= (xPos+ 5 - chart.xOffset)/chart.xRatio;
				for( var row= 0; row < this.data.length; row++) {
					if (this.data[row][0]< xMinRange) continue;
					if (this.data[row][0]> xMaxRange) continue;
					var details="event:";
					for( var i= this.columnIndexDetails.y.start; i < this.columnIndexDetails.y.end; i++)
						details+=" "+this.dataToString(i,this.data[row][i]);
					XYRow.insertCell(-1).innerHTML=details;
					var XYRow=chart.detailXY.insertRow(-1);
				}
				break;
			case 'bubble':
			case 'bubbleandline':
			case 'line':
				var xPlot= (xPos - this.xOffset)/this.xRatio;
				var xMinRange= (xPos- 5 - this.xOffset)/this.xRatio;
				var xMaxRange= (xPos+ 5 - this.xOffset)/this.xRatio;
				y=this.yOffset - yPos;
				switch (this.yScaling) {
					case "FIXED" : 
					case "AUTO" : 
						var yPlot= y/this.yRatio;
						var yMinRange= (y - 5)/this.yRatio;
						var yMaxRange= (y + 5)/this.yRatio;
						break;
					case "EXPONENTIAL" : 
						var yPlot= this.yOffset==yPos?0: Math.exp(y/this.yRatio);
						var yMinRange= this.yOffset==yPos?0: Math.exp((y-5)/this.yRatio);
						var yMaxRange= this.yOffset==yPos?0: Math.exp((y+5)/this.yRatio);
						break;
				}
				if(this==chart) {
					XYRow.insertCell(-1).innerHTML= "x: "+this.dataToString(0,xPlot);
					XYRow=chart.detailXY.insertRow(-1);
					XYRow.insertCell(-1).innerHTML= "y: "+this.dataToString(1,yPlot);
				}
				for( var row= 0; row < this.data.length; row++) {
					if (this.data[row][0]< xMinRange) continue;
					if (this.data[row][0]> xMaxRange) continue;
					for( var i= this.columnIndexDetails.y.start; i < this.columnIndexDetails.y.end; i++) {
						if (isNaN(this.data[row][i])) continue;
						var y=(this.deltaIndex[this.columnIndex[i]]
							?this.dataToString(i,this.deltaData[row][i])
							 :this.dataToString(i,this.data[row][i]));
						if(isNaN(y)) continue;
						if (y<yMinRange) continue;
						if (y>yMaxRange) continue;
						XYRow=chart.detailXY.insertRow(-1);
						XYRow.insertCell(-1).innerHTML=this.label[i];
						XYRow.insertCell(-1).innerHTML="x: "+this.dataToString(0,this.data[row][0]);
						XYRow.insertCell(-1).innerHTML="y: "+y;
						if(this.zAxis) {
							var zDetails=this.columnIndexDetails.z;
							var zData = ( zDetails.deltaIndex[zDetails.columnIndex[i]] ? zDetails.deltaData : zDetails.dataStore );
							XYRow.insertCell(-1).innerHTML="z: "+this.dataToString(i,zData[row][i]);
						}
					}
				}
				break;
			case 'pushline':
			case 'setline':
				break;
			case 'bar':
			case 'stack':
				var x=Math.floor((xPos - this.xAxisPosition)/this.tickIncrement-0.5);
				XYRow.insertCell(-1).innerHTML="x:";
				switch (this.dataType[0]) {
					case 'timestamp' :
					case 'date' :
					case 'datetime' :
						XYRow.insertCell(-1).innerHTML=this.dataToString(0,(xPos -this.xOffset)/this.xRatio);
						break;
					default:
						XYRow.insertCell(-1).innerHTML=this.data[x][0];
				}
				XYRow=chart.detailXY.insertRow(-1);
				XYRow.insertCell(-1).innerHTML= "y:";
				XYRow.insertCell(-1).innerHTML=this.dataToString(1,(this.yOffset - yPos)/this.yRatio);
				break;
			default:
				break;
		}
	},
	canvasCoords: function (callingEvent) {
	    var xPos = callingEvent.clientX - this.canvasOffset[0]-10;
	    var yPos = callingEvent.clientY - this.canvasOffset[1]-10;
		while (this.detailXY.rows.length> 0) 
			this.detailXY.deleteRow(0);
		
		this.canvasCoordsDetails(this,xPos,yPos);
		for (var i=0;i<this.overlayDetails.length;i++)
			if(this.overlayDetails[i].tableObject!=null)
				this.overlayDetails[i].tableObject.canvasCoordsDetails(this,xPos,yPos);
		
	 	this.detailXY.setStyle({'top':  (yPos-  ( yPos<this.chartHeight/2 ? 0 : this.detailXY.getHeight()) ) + 'px'
		                       ,'left': (xPos - ( xPos<this.chartWidth/2  ? 0 : this.detailXY.getWidth() ) ) + 'px'
		                       ,'display': 'block'});

//		this.ctx.save();
		this.ctx.strokeStyle = "blue";
		this.ctx.lineWidth=1;
		this.ctx.beginPath();		  			// x axis
		this.ctx.moveTo(xPos+0.5 ,this.yAxisPosition);  
		this.ctx.lineTo(xPos+0.5 ,0);
		this.ctx.stroke();
												// y axis  												 
		this.ctx.beginPath();					  
		this.ctx.moveTo(this.xAxisPosition,yPos+0.5);  
		this.ctx.lineTo(this.chartWidth,yPos+0.5);  
		this.ctx.stroke(); 
	},
	canvasCoordsReset: function (callingEvent) {
//		this.ctx.restore();
		this.redrawChart();
		this.detailXY.setStyle({'display': 'none'});
		while (this.detailXY.rows.length> 0) 
			this.detailXY.deleteRow(0);
	},
	moveLegendSet: function (callingEvent) {
		this.legendOffsetX=callingEvent.clientX-this.legendPositionX;
		this.legendOffsetY=callingEvent.clientY-this.legendPositionY;
		this.legend.setStyle({'filter': ''});
		this.legend.setStyle({'opacity': ''});
		var _dragElement=this.legend;
//		this.legend.onmousemove=this.moveLegend;
		if(!IS_TOUCH_SYSTEM)
			eval("this.legend.onmousemove=function(callingEvent) {"+this.callBackText+".moveLegend(callingEvent,this,"+this.callBackText+");};");
		this.legend.focus(); 
		 // prevent text selection in IE 
		this.legend.onselectstart = function () { return false; };
		  // prevent IE from trying to drag an image 
		this.legend.ondragstart = function() { return false; }; 
		
	},
	moveLegendReSet: function () {
		this.legend.setStyle({'filter': 'alpha(opacity=80)'});
		this.legend.setStyle({'opacity': '0.5'});
		this.legend.onmousemove=null;
	},
	moveLegend: function (callingEvent,object,parentData) {
	 	if (callingEvent == null) callingEvent = window.event; 
		parentData.legendPositionX=callingEvent.clientX-parentData.legendOffsetX;
		parentData.legendPositionY=callingEvent.clientY-parentData.legendOffsetY;
		object.setStyle({'left': parentData.legendPositionX + 'px'});
		object.setStyle({'top':  parentData.legendPositionY + 'px'});
	},
	yPosition: function (value) {
		if (value==null) return this.yAxisPosition;
		if (value==Infinity) return 0;
		if (value==-Infinity) return this.yOffset;
		return this.yOffset-value;
	},
	yScale: function (value) {
		switch (this.yScaling) {
			case "FIXED" : 
			case "AUTO" : 
				return value*this.yRatio;
			case "EXPONENTIAL" :
				if (value>0) return Math.log(value)*this.yRatio;
				if (value<=0) return Math.log(this.yDataMin*0.1)*this.yRatio;
				return null;
			default:
				throw "unknown y scaling: " + this.yScaling;
		}
	},
	xPosition: function (value) {
		return this.xOffset+value;
	},
	xScale: function (value) {
		return value*this.xRatio;
	},
	zScale: function (value,j) {
		if(value==null) return 0;
		if(value==0) return 0;
		if(j==null) return (value-this.zRatioOffset)*this.zRatio;
		if(this.zRatioColumns[j]==null) return (value-this.zRatioOffset)*this.zRatio;
		return (value-this.zRatioColumns[j].zRatioOffset)*this.zRatioColumns[j].zRatio;
	},
	drawPie: function (x,y,d,i) {
 	  	var total=0;
 	  	if (this.slices=='row') {
			var arrayLength=this.data.length;
			for( var row= 0; row < arrayLength; row++) {
				if(isNaN(this.data[row][i])) continue;
				total+=this.data[row][i];
			}
 	  	} else {
			var arrayLength=this.data[i].length;
			for( var j= 1; j < arrayLength; j++) {
				if(isNaN(this.data[i][j])) continue;
				total+=this.data[i][j];
			}
		}
		if (total==0) return; 
		var xCentre=x+d/2;
		var yCentre=y+d/2;
		var radius=d/2*0.98;
		var angleStart=0;
		var angleEnd=0;
		var value=null;
		var unitDegreesRatio=2 * Math.PI/total;
		for( var row= (this.slices=='row'?0:1); row < arrayLength; row++) {
			value=(this.slices=='row'?this.data[row][i]:this.data[i][row])
			if(value==null) continue;
			angleStart=angleEnd;
			angleEnd+=unitDegreesRatio*value;
	 	  	this.ctx.fillStyle = this.colour[row];
 		    this.ctx.beginPath();
	    	this.ctx.moveTo(xCentre, yCentre); 
  			this.ctx.arc(xCentre, yCentre, radius,angleStart,angleEnd,false);
	    	this.ctx.lineTo(xCentre, yCentre); 
			this.ctx.closePath();
			this.ctx.fill();
		}
		this.ctx.fillStyle = "black";
 	  	if (this.slices=='row')
			this.ctx.fillText(this.label[i],x,y+10);
 	  	else if (this.columnIndex[0]!= null)
 	  		this.ctx.fillText(this.localDataSet[i][this.columnIndex[0]],x,y+10);
	},
	plotSet: function (y, offset, data) {
		this.ctx.strokeStyle = this.colour[y * offset];
		this.ctx.lineWidth=this.lineWidth;
		this.ctx.beginPath();
		for( var i= 0; i < data.length; i++) {
			if (data[i][y]==null) continue;
			xPos=this.xAxisPosition+Math.floor((i)*this.tickIncrement)+(y-1)*this.barWidth;
			yPos=this.yPosition(this.yScale(data[i][y]));
			this.ctx.lineTo(xPos,yPos);
			if(this.showPoints)
				this.ctx.arc(xPos,yPos, 3, 0, Math.PI*2, false);
		}
		this.ctx.stroke();
	},
	plot: function (y, offset, data) {
		if(data.length==0) return;
		this.ctx.fillStyle = this.colour[y * offset];  
		var dataY;
		var dataX;
		var plotX;
		var plotY;
		if(data.length==1 || this.highlight=='first') {
			dataX=this.data[0][0];
			dataY=data[0][y];
			if (dataX==null || dataY==null) return;
			plotX=this.xPosition(this.xScale(dataX));
			plotY=this.yPosition(this.yScale(dataY));
			if(this.showPoints)
				this.ctx.arc(plotX,plotY, 3, 0, Math.PI*2, false);
			else
				this.ctx.fillRect (plotX-3,plotY-3,6,6);
			if(data.length==1) return;
		}
		var errors;
		this.ctx.strokeStyle = this.colour[y * offset];
		this.ctx.lineWidth=this.lineWidth;
		var linePointCnt=0;
		for( var row= 0; row < data.length; row++) {
			try {
				dataX=this.data[row][0];
				dataY=data[row][y];
				if (dataX==null || dataY==null || isNaN(dataX) || isNaN(dataY)) {
					if(linePointCnt>0) {
						this.ctx.stroke();
						if(linePointCnt==1 && !this.showPoints) 
							this.ctx.fillRect (this.xPosition(this.xScale(this.data[row-1][0]))-3,this.yPosition(this.yScale(data[row-1][y]))-3,6,6);  
						linePointCnt=0;
					}
					continue;
				}
				plotX=this.xPosition(this.xScale(dataX));
				plotY=this.yPosition(this.yScale(dataY));
				if(++linePointCnt>1) {
					this.ctx.lineTo(plotX,plotY);
					continue;
				}
				this.ctx.beginPath();
				this.ctx.moveTo(plotX,plotY); 
			} catch (e) {
				errors += " x: " + dataX + " ( " + plotX + " ) " + " y: " + dataY + " ( " + plotY + " ) " + "\n" + e + "\n";
				this.ctx.stroke();
				linePointCnt=0;
			} 
		}
		if(linePointCnt>0) {
		 	this.ctx.stroke();
			if(( linePointCnt==1 || this.highlight=='last' ) && !this.showPoints) 
				this.ctx.fillRect (this.xPosition(this.xScale(dataX))-3,this.yPosition(this.yScale(dataY))-3,6,6);
		}  
		if(this.showPoints)
			for( var row= 0; row < data.length; row++) {
				dataY=this.yPosition(this.yScale(data[row][y]));
				if(dataY==undefined) continue;
				if(dataY==null) continue;
				this.ctx.arc(this.xPosition(this.xScale(this.data[row][0])),dataY, 3, 0, Math.PI*2, false);
			}
		if (errors!=null) throw errors;
	},
	draw: function($super) {
		if (this.display=='data' || this.baseTableData.rowsReturned == 0) {
			$super();
			return;
		}
		this.parentPanel.setContent("", "loading", null, 'hidden', null);
	},
	drawCanvas: function() {
		if (this.data==null) this.buildDataSet();
		var output = "<canvas id='" + this.elementUniqueID + "_chart' width='"+this.chartWidth+"' height='"+this.chartHeight+"'"
		if(!IS_TOUCH_SYSTEM)
			output += " onmousedown=\""+this.callBackText + ".canvasCoords(event);\""
					+ " onmouseup=\""+this.callBackText + ".canvasCoordsReset();\"";
		output += " style='padding-top:10px;padding-left:10px;'></canvas>"
				+ "<table id='" + this.elementUniqueID + "_legend' style='font-size:10px; position:absolute; top: "+this.legendPositionY+"px; left: "+this.legendPositionX+"px; display:"+(this.legendDisplay=="hide"?"none":"block")+"; background:transparent; border:transparent; z-index: 8; background-color: #FFFFFF; filter:alpha(opacity=80); opacity:0.5;'"
		if(!IS_TOUCH_SYSTEM)
			output += " onmousedown=\""+this.callBackText + ".moveLegendSet(event);\""
					+ " onmouseup=\""+this.callBackText + ".moveLegendReSet();\"";
		output +=	"></table>"
				+ "<table id='" + this.elementUniqueID + "_detailXY' style='font-size:10px; top:0px; left:60px ; position:absolute ; display:none; background:transparent; border:transparent; z-index: 11; background-color: #FFFFFF; filter: alpha(opacity=80); opacity:0.6;'"
		if(!IS_TOUCH_SYSTEM)
			output += " onmouseup=\""+this.callBackText + ".canvasCoordsReset();\"";
		output +=	"></table>";
		this.parentPanel.setContent(output, this.baseTableData.chartTitle, null, 'hidden', this.setMenuOptions());
		this.legend = document.getElementById(this.elementUniqueID + "_legend");
		this.detailXY = document.getElementById(this.elementUniqueID + "_detailXY");
 		this.canvas = initCanvas(document.getElementById(this.elementUniqueID + "_chart"));
		if (this.canvas!=null) {
			if (!this.canvas.getContext) {
				this.setError('canvas-unsupported');
				return;
			}
			this.canvasOffset=Element.cumulativeOffset(this.canvas);
			this.canvas.style.cursor = 'crosshair';
			this.ctx = this.canvas.getContext('2d');
			this.ctx.font = "10px sans-serif";
			try {this.resize();} catch(e){this.setError(e);return;}
		}
	},
	drawXAxisTick: function(x) {
		this.ctx.beginPath();		  			
		this.ctx.moveTo(x+0.5,this.yAxisPosition+5);  
		this.ctx.lineTo(x+0.5,this.yAxisPosition-5);
		this.ctx.stroke(); 
	},
	drawYAxisTick: function(y) {
		if(y==Infinity) return;
		if(y==-Infinity) return;
		this.ctx.beginPath();		  			
		this.ctx.moveTo(this.xAxisPosition+5,y+0.5);  
		this.ctx.lineTo(this.xAxisPosition-5,y+0.5);
		this.ctx.stroke(); 
	},
	dataToString: function(i,value) {
		switch (this.dataType[i]) {
			case 'timestamp' :
			case 'datetime' :
			case 'time' :
			case 'date' :
				var ts = new Date();
				ts.setTime(parseInt(value));
				var axisLabel='';
				switch (this.dataType[0]) {
						case 'timestamp' :
						case 'date' :
						case 'datetime' :
							if (this.precision[0] >= 1440) axisLabel+=ts.getFullYear()+'-';
							if (this.precision[0] >= 1440) axisLabel+=this.padLeadZero(ts.getMonth()+1,2)+'-';
							if (this.precision[0] >= 1440) axisLabel+=this.padLeadZero(ts.getDate(),2);
							if (this.precision[0] >= 1440) axisLabel+=' ';
						case 'time' :
							if (this.precision[0] >= 360) axisLabel+=this.padLeadZero(ts.getHours(),2)+':';
							if (this.precision[0] >=  60) axisLabel+=this.padLeadZero(ts.getMinutes(),2)+':';
							if (this.precision[0] >=  1) axisLabel+=this.padLeadZero(ts.getSeconds(),2);
				}
				return 	axisLabel;
			case 'int' :
			case 'real' :
			case 'number' :
				return formatNumberToAbbreviated(value)
		}
		return value.toString();
	},
	padLeadZero : function(value,size) {
		return "000000000000".substr(0,size-value.toString().length)+value;
	},
	drawLineAxis: function() {
		this.ctx.fillStyle = "black";
		this.ctx.lineWidth=this.axisXLineWidth;
		this.ctx.beginPath();		  			// x axis
		this.ctx.moveTo(this.xAxisPosition+0.5,this.yAxisPosition);  
		this.ctx.lineTo(this.xAxisPosition+0.5,0);
		this.ctx.stroke();
												// x ticks
		this.ctx.lineWidth=this.axisXTickWidth;
		switch (this.chartType) {
			case 'bubble':
			case 'bubbleandline':
			case 'line':
				if (this.xTicks.length>1) {
					var axisLabel='';
					var ts = new Date();
					ts.setTime(parseInt(this.xTicks[0]));
					switch (this.dataType[0]) {
						case 'timestamp' :
						case 'date' :
						case 'datetime' :
							if (this.precision[0] < 1440) axisLabel+=ts.getFullYear()+'-';
							if (this.precision[0] < 1440) axisLabel+=this.padLeadZero(ts.getMonth()+1,2)+'-';
							if (this.precision[0] < 1440) axisLabel+=this.padLeadZero(ts.getDate(),2);
							if (this.precision[0] < 1440) axisLabel+=' ';
						case 'time' :
							if (this.precision[0] < 360) axisLabel+=this.padLeadZero(ts.getHours(),2)+':';
							if (this.precision[0] <  60) axisLabel+=this.padLeadZero(ts.getMinutes(),2)+':';
							if (this.precision[0] <   1) axisLabel+=this.padLeadZero(ts.getSeconds(),2);
					}
					this.ctx.textAlign='left';
					this.ctx.fillText(axisLabel,0,this.chartHeight-this.axisOffset/2);
				}
				for(var i = 0; i< this.xTicks.length; i++) {
					var pos=this.xPosition(this.xScale(this.xTicks[i]));
					this.drawXAxisTick(pos);
					this.ctx.textAlign='center';
					this.ctx.fillText(this.dataToString(0,this.xTicks[i],true), pos,this.chartHeight-this.axisOffset/2);
				} 
				break;
			case 'bar':
			case 'pushline':
			case 'setline':
			case 'stack':
				if (this.xTicks.length==0) this.tickIncrement=this.xMax; 
				else this.tickIncrement=Math.floor(this.xMax/(this.xTicks.length+1));
				var k = Math.ceil((50/this.tickIncrement));
				for(var i = 0; i< this.xTicks.length; i+= k) {
					
					var pos=this.axisOffset + this.tickIncrement*(i+1);
					if(this.chartType == 'setline')
						pos -= this.tickIncrement;

					this.drawXAxisTick(pos);
					this.ctx.textAlign='center';

					switch (this.dataType[0]) {
						case 'timestamp' :
						case 'date' :
						case 'datetime' :
							var axisLabel='';
							var ts = new Date();
							ts.setTime(parseInt(this.xTicks[0]));
							if (this.precision[0] < 1440) axisLabel+=ts.getFullYear()+'-';
							if (this.precision[0] < 1440) axisLabel+=this.padLeadZero(ts.getMonth()+1,2)+'-';
							if (this.precision[0] < 1440) axisLabel+=this.padLeadZero(ts.getDate(),2);
							switch (this.dataType[0]) {
								case 'timestamp' :
								case 'datetime' :
									if (this.precision[0] < 1440) axisLabel+=' ';
								case 'time' :
									if (this.precision[0] < 360) axisLabel+=this.padLeadZero(ts.getHours(),2)+':';
									if (this.precision[0] <  60) axisLabel+=this.padLeadZero(ts.getMinutes(),2)+':';
									if (this.precision[0] <   1) axisLabel+=this.padLeadZero(ts.getSeconds(),2);
							}
							this.ctx.fillText(axisLabel, pos,this.chartHeight-this.axisOffset/2);
							break;
						case 'real' :
						case 'number' :
						case 'int' :
							if(this.columnIndex[0]==null) break; 
							if(this.data[i]==null) break; 
							this.ctx.fillText(this.data[i][0].toString(), pos,this.chartHeight-this.axisOffset/2);
							break;
						default:
							if(this.columnIndex[0]==null) break; 
							if(this.data[i]==null) break; 
							this.ctx.fillText(this.data[i][0], pos,this.chartHeight-this.axisOffset/2);
					} 
				}
				break;
			default:
		}
												// y axis  												 
		this.ctx.lineWidth=this.axisYLineWidth;
		this.ctx.beginPath();					  
		this.ctx.moveTo(this.xAxisPosition,this.yAxisPosition+0.5);
		this.ctx.lineTo(this.chartWidth-( this.chartType == 'setline' ? this.tickIncrement : 0 ),this.yAxisPosition+0.5);  
		this.ctx.stroke(); 
												// y ticks
		this.ctx.lineWidth=this.axisYTickWidth;
		for(var i = 0; i< this.yTicks.length; i++) {
			var pos=this.yPosition(this.yScale(this.yTicks[i]));
			this.drawYAxisTick(pos);
			this.ctx.textAlign='left';
			this.ctx.fillText(this.dataToString(1,this.yTicks[i]),0 , pos+3);
		} 
	},
	calculateTicks: function(max,min,type,metric) {
		var tickPosition = [];
		if (max==null || this.yMax==null ) return tickPosition;
		var tickCount = Math.floor(this.yMax/20);
		if(tickCount < 1) tickCount = 1; 
		var i=0;
		var k=0;
		var duration=max-min;
		switch (type) {
			case 'timestamp' :
			case 'time' :
			case 'date' :
			case 'datetime' :
				this.precision[metric]=1;
				duration=Math.floor(duration/60000);   // minutes?
				if (duration > 0) {
					this.precision[metric]=60;
					var minTS= new Date();
					minTS.setTime(parseInt(min));
					var maxTS= new Date();
					maxTS.setTime(parseInt(max));
					minTS.setMilliseconds(0);					
					minTS.setSeconds(0);
					duration=Math.floor(duration/60);   // hours?
					if (duration > 0) { 	
						this.precision[metric]=360;
						minTS.setMinutes(0);
						duration=Math.floor(duration/24);   // days?
						if (duration > 0) { 	
							this.precision[metric]=1440;
							minTS.setHours(0);
							for(var j=1; j<100 ; j++)
								if (duration<j*5+1) break; 
							duration=j*24*60*60*1000;
						} else {
							duration=Math.floor((max-min)/(60*60*1000));             // hours
							duration=(Math.floor(duration/5)+1)*60*60*1000;
						}
					} else {	
						duration=Math.floor((max-min)/(60*1000));             // minutes
						if (duration<5) 
							duration=60*1000;
						else if (duration<25)
							duration=5*60*1000;
						else
							duration=10*60*1000;
					} 					
					for(i = minTS.getTime() ; i < max ; i=i+duration )
						if (i>min && i<=max) tickPosition[k++]=i;
					break;
				}
				duration=max-min;
			case 'real':
			case 'int':
			case 'number':
				min = parseFloat(min);
				max = parseFloat(max);
				var range = max-min;
				var tickSpan = Math.floor(range/tickCount);
				var maxTicks = Math.floor(Number.MAX_VALUE / tickSpan);
				var tickTotal = Math.min(tickCount+10,maxTicks);
				for(var j=0;j<=tickTotal;j++) {
					tickPosition[j]= min + j*tickSpan;
					if( tickPosition[j] > max) break;
				}
				break;
			default:
				throw 'Unknown type: "'+type+'" for axis tick creation, check types are numeric, label: '+this.label[metric];
		}
		return tickPosition;
	},
	resize: function() {
 		this.width = $(this.parentPageID).getWidth();
 		this.height = $(this.parentPageID).getHeight();
		this.chartWidth = this.width - 25;
		this.chartHeight = this.height;
		this.canvas.setAttribute('width', this.chartWidth);
		this.canvas.setAttribute('height', this.chartHeight);
		this.axisOffset= 40;
		switch (this.dataType[0]) {
			case "int":
			case "real":
			case "number":
			case "date":
			case "time":
			case "datetime":
			case "timestamp":
				if(this.columnIndex[0]==null) {
					this.dataMin[0]=0.5;
					this.dataMax[0]=1.5;
					this.xAxisPosition = this.axisOffset;
					this.xMax = this.width-this.axisOffset;
					break;    // xTicks built whilst building data
				}
				this.xAxisPosition = this.axisOffset;
				this.xMax = this.chartWidth-this.axisOffset-6;
				if(this.dataMin[0]==this.dataMax[0]) {
					this.dataMin[0]=this.dataMax[0]-1;
					this.dataMax[0]=this.dataMax[0]+1;
				} 
				this.xRatio = this.xMax/(this.dataMax[0]-this.dataMin[0]);
				this.xOffset= this.xAxisPosition-this.xScale(this.dataMin[0]);
				this.xTicks = this.calculateTicks(this.dataMax[0],this.dataMin[0],this.dataType[0],0);
				break;
			case "string":
				switch (this.chartType) {
					case 'bar':
					case 'pushline':
					case 'setline':
					case 'stack':
						this.xAxisPosition = this.axisOffset;
						this.xMax = this.width-this.axisOffset;
						break;    // xTicks built whilst building data
					case 'pie':
						break;
					case 'bubble':
					case 'bubbleandline':
					case 'line':
					default:
						throw "invalid x axis data type string for chart type " + this.chartType;
				}
				break;
//			case "clob":
//			case "dbclob":
//			case "blob":
//			case "xml":
			default:
		}		
		this.yAxisPosition = this.chartHeight-this.axisOffset;
		this.yMax = this.yAxisPosition-5;
		
		this.yDataMin = this.yAxisLowerBound;
		this.yDataMax = this.yAxisUpperBound;
		
		switch (this.chartType) {
			case 'stack':
				this.yDataMin= this.yDataMin != null ? this.yDataMin : 0;
				this.yDataMax= this.yDataMax != null ? this.yDataMax : 0;
				for( var i=this.columnIndexDetails.y.start; i < this.columnIndexDetails.y.end; i++) {
					if (this.dataMax[i]==null) continue;
					this.yDataMax+=this.dataMax[i];
				}
				if(this.yAxisUpperBound==null)
					this.yDataMax=this.yDataMax*1.01;
				break;
			case 'bar':
			case 'pushline':
			case 'setline':
				this.yDataMin= this.yDataMin != null ? this.yDataMin : 0;
				this.yDataMax= this.yDataMax != null ? this.yDataMax : 0;
				for(var i =this.columnIndexDetails.y.start; i < this.columnIndexDetails.y.end; i++)
					if (this.yDataMax<this.dataMax[i]) this.yDataMax=this.dataMax[i];
				if(this.yAxisUpperBound==null)
					this.yDataMax=this.yDataMax*1.1;
				break;
			default:
				this.yDataMax= this.yDataMax != null ? this.yDataMax : this.dataMax[1];
				this.yDataMin= this.yDataMin != null ? this.yDataMin : this.dataMin[1];
				for(var i = this.columnIndexDetails.y.start; i < this.columnIndexDetails.y.end; i++) {
					if (this.yDataMax<this.dataMax[i]) this.yDataMax=this.dataMax[i];
					if (this.yDataMin>this.dataMin[i]) this.yDataMin=this.dataMin[i];
				}
				this.yDataMax= this.yDataMax == null ? 1 : this.yDataMax;
				this.yDataMin= this.yDataMin == null ? 0 : this.yDataMin;
				if(this.yDataMin==this.yDataMax)  
					if(this.yDataMax==0)
						this.yDataMax=1;
				if(this.yAxisLowerBound==null)
					this.yDataMin=this.yDataMin*0.99;
				if(this.yAxisUpperBound==null)
					this.yDataMax=this.yDataMax*1.01;
				break;
		} 
		if(this.zAxis) {
			var zDetails=this.columnIndexDetails.z;
			this.zDataMax=null;
			this.zDataMin=null;
			this.zRatioColumns=[];
			for (i=0;i<zDetails.dataMin.length;i++) {
				if(this.zDataMax<zDetails.dataMax[i]) this.zDataMax=zDetails.dataMax[i]; 
				if(this.zDataMin>zDetails.dataMin[i]) this.zDataMin=zDetails.dataMin[i];
				this.zRatioColumns[i]={};
				var ratio=this.zRatioColumns[i];
				rangeZ=zDetails.dataMax[i]-zDetails.dataMin[i];
				if(rangeZ==0) {
					rangeZ=zDetails.dataMin[i];
					ratio.zRatioOffset=0;
				} else 
					ratio.zRatioOffset=zDetails.dataMin[i];
				ratio.zRatio=this.bubbleRatio*(Math.min(this.yMax,this.xMax)/rangeZ );
				if(ratio.zRatio==Infinity) this.zRatio=this.bubbleRatio;
				if (isNaN(ratio.zRatio)) throw "z ratio calculation error, charting width:"+ this.yMax + " max:"+ zDetails.dataMax[i] + " min:"+ zDetails.dataMin[i];
			}
			rangeZ=this.zDataMax-this.zDataMin;
			if(rangeZ==0) {
				rangeZ=this.zDataMin;
				this.zRatioOffset==0;
			} else 
				this.zRatioOffset=this.zDataMin;
			this.zRatio=this.bubbleRatio*(Math.min(this.yMax,this.xMax)/rangeZ);
			if(this.zRatio==Infinity) this.zRatio=this.bubbleRatio;
			if (isNaN(this.zRatio)) throw "z ratio calculation error, charting width:"+ this.yMax + " max:"+ Math.max.apply(Math,this.columnIndexDetails.z.dataMax) + " min:"+ Math.min.apply(Math,this.columnIndexDetails.z.dataMin);
		}
		switch (this.yScaling) {
			case "AUTO" :
				if(!this.scaleUpOnly || this.scaleUpOnly && this.maxYScale < this.yDataMax)
					this.maxYScale = this.yDataMax;
				if(!this.scaleDownOnly || this.scaleDownOnly && this.minYScale > this.yDataMin)
					this.minYScale = this.yDataMin;
			case "FIXED" :
				this.yRatio = this.yMax/(this.yDataMax-this.yDataMin);
				if(this.yRatio==Infinity) this.yRatio=1
				if (isNaN(this.yRatio)) throw "y ratio calculation error, charting width:"+ this.yMax + " max:"+ this.yDataMax + " min:"+ this.yDataMin;
				this.yOffset= this.yAxisPosition+this.yScale(this.yDataMin);
				if (isNaN(this.yOffset)) throw "y offset calculation error, start position:"+ this.yAxisPosition + " plot value:"+ this.yDataMin + " ratio:"+ this.yRatio;
				this.yTicks = this.calculateTicks(this.yDataMax,this.yDataMin,this.dataType[1],1);
				break;
			case "EXPONENTIAL" : // graphing zero and below in exponential doesn't work
				if(this.yDataMax<=0) this.yDataMax=1;
				if(this.yDataMin<=0) {             
					this.yDataMin=this.yDataMax;
					var y;
					for( var row = 0; row < this.data.length; row++) {
						for(var i = this.columnIndexDetails.y.start; i<this.columnIndexDetails.y.end; i++) {
						    y=(this.deltaIndex[this.columnIndex[i]]?this.deltaData[row][i]:this.data[row][i]);
							if (y==undefined) continue;
							if (y<=0) continue;
							if (y==null) continue;
							if (y<this.yDataMin) this.yDataMin=y;
						}
					}
					this.yDataMin=this.yDataMin*0.9;
				}  
				this.yRatio = this.yMax/(Math.log(this.yDataMax) - Math.log(this.yDataMin));
				if (this.yRatio==0) this.yRatio=1;
				this.yOffset= this.yAxisPosition+Math.floor(this.yScale(this.yDataMin));
				this.yTicks=[];
				var k=0;
				for( var i= 20 ; i > -20 && k < 8 ; i--) {
					if (Math.pow(10,i) > this.yDataMax) continue;
					if (Math.pow(10,i) < this.yDataMin) continue;
					this.yTicks[k++]=(Math.pow(10,i)/10)*10;
				} 
				if (k=0) {
					mid=this.yDataMin+(this.yDataMax-this.yDataMin)/2;
					for( var i= 20 ; i > -20 ; i--)
						if (Math.pow(10,i) > mid) continue;
					for( var j=1 ; j < 10 ; j++) {
						if (Math.pow(10,i)*j < mid) continue;
						this.yTicks[0]=Math.pow(10,i)*j;
						break;
					}
				} 
				break;
			case "NOAXIS" :
				break; 
			default:
				throw "unknown y scaling: " + this.yScaling;
		}
	},
	dataConversionFunc : {
		 "real": function(value) {return parseFloat(value);}
		,"int": function(value) {return parseFloat(value);}
		,"number": function(value) {return parseFloat(value);}
		,"timestamp": function(value) {
			return Date.parse(value.substr(0,4)+'/'+value.substr(5,2)+'/'+value.substr(8,11))
				+ parseInt(value.substr(21,3));
			}
		,"time": function(value) {return Date.parse(value);}
		,"datetime": function(value) {return Date.parse(value);}
		,"date": function(value) {return Date.parse(value);}
	},
	dataConversion: function(i,value) {
		if (value==null) return null;
		if(this.dataConversionFunc[this.dataType[i]]==null) return value;
		try{
			return this.dataConversionFunc[this.dataType[i]](value);
		} catch(e) {
			throw "data conversion error data type: " +dataType[i] + ' value: "'+ value +'"';
		}
	},	
	setColumnIndexDetails: function(axis) {
		var isYAxis=(axis=="y");
		if(this.columnIndexDetails==null) this.columnIndexDetails={};
		if(this.columnIndexDetails[axis]==null) 
			this.columnIndexDetails[axis]={
				 columnIndex:[null]
				,dataType:[null]
				,dataStore:[null]
				,dataMin:[null]
				,dataMax:[null]
//				,deltaCol:[null]
				,deltaData:[null]
				,deltaIndex:[null]
				,group:[null]
				,label:[null]
				,start: this.columnIndex.length
			};
		var columnIndexDetails=this.columnIndexDetails[axis];
		var series=this[axis+"Series"];
		if(isYAxis)
			for(i = 0; i < series.length; i++)
				this.setColumnDetails(this.columnIndex.length,series[i]);
		else
			for(i = 0; i < series.length; i++)
				this.setColumnDetailsAxis(columnIndexDetails,series[i]);
		columnIndexDetails.end=(axis=="y"?this.columnIndex.length:columnIndexDetails.columnIndex.length);
		columnIndexDetails.size=columnIndexDetails.end-columnIndexDetails.start;
		if(isYAxis)
			if(this.zAxis)
				this.setColumnIndexDetails("z");
	},	
	buildLocalDataSet: function() {
		this.localDataSet=[];
		if(this.historyInclude) {
			if(this.baseTableData.history!=null) {
				for(var i=0;i<this.baseTableData.history.data.length;i++) {
					this.copyFilteredRows(this.baseTableData.history.data[i],this.localDataSet,this.baseTableData.filters,this.chartFilter);
				}
			}
		}
		this.copyFilteredRows(this.baseTableData.baseData,this.localDataSet,this.baseTableData.filters,this.chartFilter);
		if (this.flipDataSet)			
			this.localDataSet = this.localDataSet.reverse();
	},	
	buildDataSet: function() {
		if (this.localDataSet.length <1)
			if(this.onNoDataThrowError)
				throw 'No data to chart';
		delete this.columnIndexDetails;
		this.columnIndex=[];
		this.data=[];
		this.dataType=[];
		this.deltaCol=[];
		this.deltaData=[];
		this.deltaIndex=[];
		this.dataMax=[];
		this.dataMin=[];
		this.group=[];
		this.groupIndex;
		this.groupingValue="";
		this.groupValue=[];
		this.precision=[];
		this.label=[];
		this.xTicks=[];
		this.yTicks=[];
		if (this.delta!=null) {
			var deltaArray=this.delta.split(",");
			deltaArray[deltaArray.length]=this.xAxis;
			for (var j=0; j<deltaArray.length;j++) {
				if(!isDatabaseConnectionVersion(this.baseTableData.components.column[deltaArray[j]]))
					continue;
				try{
					var i=this.findColumnIndex(deltaArray[j]);
				} catch (e) {
					throw "delta "+e.toString();
				}
				switch (this.baseTableData.columnsInfo.type[i]) {
					case 'real': 
					case 'double': 
					case 'int':
					case 'number':
					case 'bigint':
					case 'timestamp':
					case 'date':
						break;
					default:
						if(j<deltaArray.length-1) throw "delta column "+deltaArray[j]+" not numeric but "+this.baseTableData.columnsInfo.type[i];
						remove=deltaArray.pop();
				}
				this.deltaCol[i]=this.baseTableData.columnsInfo.type[i];
			}
		}

		this.setColumnDetails(0,this.xAxis);
		if (this.grouping==null)
			this.setColumnIndexDetails("y");
		else {
			this.groupIndex=[];
			var groupingArray=this.grouping.split(",");
			for (var j=0; j<groupingArray.length;j++) {
				if(!isDatabaseConnectionVersion(this.baseTableData.components.column[groupingArray[j]])) continue;
				try{
					this.groupIndex[j]=this.findColumnIndex(groupingArray[j]);
				} catch(e) {
					throw "grouping "+e.toString();
				}
			}
		}
		switch (this.chartType) {
			case 'bubble':
			case 'bar':
			case 'pushline':
			case 'setline':
			case 'stack':
				var xTicksIsRow=true;
				break;
			default:
				var xTicksIsRow=false;
		}
		var x = -1;
		if(this.delta!=null) 
			switch (this.baseTableData.columnsInfo.type[this.columnIndex[0]]) {
				case 'timestamp':
					this.xNormliseFactor=this.deltaNormaliser*1000;
					break;
				default:
					this.xNormliseFactor=this.deltaNormaliser;
			}	
		this.xNormaliser=1;
		var xCol=this.columnIndex[0];
		for( var row = 0; row < this.localDataSet.length; row++) {
			if (this.grouping==null) {
				this.setData(++x);
			} else {
				if (x==-1) {
					this.setData(++x);
				} else if (this.localDataSet[row][xCol] !=  this.localDataSet[row-1][xCol]) {
					this.setData(++x);
				}
				var newGroupingValue='';
				for( i = 0; i < this.groupIndex.length; i++)
					newGroupingValue+=' '+ this.localDataSet[row][this.groupIndex[i]];
				if (this.groupingValue!=newGroupingValue) {
					this.groupingValue=newGroupingValue;
					this.group[0]=this.groupingValue;
					var i;
					for( i = 0; i < this.groupValue.length; i++)
						if(this.groupingValue==this.groupValue[i]) break;
					if (i >= this.groupValue.length) {
						this.groupValue[i]=this.groupingValue;
						this.setColumnIndexDetails("y");
					}
				}
			}
			if(xTicksIsRow) this.xTicks[x]=row;
			for(var i = 0; i < this.columnIndex.length; i++) {
				if (this.group[i]!=this.groupingValue) continue;
				var value = (this.columnIndex[i]==null?x+1:this.dataConversion(i,this.localDataSet[row][this.columnIndex[i]]));
				this.data[x][i] = value;
				if (this.deltaIndex[this.columnIndex[i]]) {
					if(i==0) {
						if (x>0) {
							this.deltaData[x-1][0] = value-this.data[x-1][0];
							this.xNormaliser=this.deltaData[x-1][0]/this.xNormliseFactor;
						}
					} else { 
						if (x==0)
							value=null;
						else  {
							value = (value - this.data[x-1][i]) / this.xNormaliser;
							this.deltaData[x-1][i] = value; 
						}
					}
				}
				this.setMaxMin(this, i, value);
		 		if(this.zAxis) this.setDataAxis('z',this.localDataSet[row],x,i); 
			}
		}
	},
	setMaxMin: function(base,i,value) {
 		if (base.dataMin[i]==null) {
 			base.dataMin[i]=value;
 			base.dataMax[i]=value;
 		} else if (base.dataMin[i]>value)
 			base.dataMin[i]=value;
 		else if (base.dataMax[i]<value) 
 			base.dataMax[i]=value;
	},
	setData: function(x) {
		this.data[x]=[];
		this.deltaData[x]=[];
	},
	setDataAxis: function(axis,row,x,i) {
		var colDetails=this.columnIndexDetails[axis];
		var value = (row==null?null:this.dataConversion(i,row[colDetails.columnIndex[i]]));
		if(colDetails.dataStore[x]==null) {
			colDetails.dataStore[x]=[];
			colDetails.deltaData[x]=[];
		}
		colDetails.dataStore[x][i]=value;
		if (colDetails.deltaIndex[colDetails.columnIndex[i]]) {
			if(i==0) {
				if (x>0) {
					colDetails.deltaData[x-1][0] = value-colDetails.data[x-1][0];
					this.xNormaliser=colDetails.deltaData[x-1][0]/this.xNormliseFactor;
				}
			} else { 
				if (x==0)
					value=null;
				else  {
					value = (value - colDetails.dataStore[x-1][i]) / this.xNormaliser;
					colDetails.deltaData[x-1][i] = value; 
				}
			}
		}
		this.setMaxMin(colDetails, i, value);
	},
	setColumnDetails: function(index,columnName) {
   		if(columnName==null) {
			this.columnIndex[index]=null;
			this.dataType[index]='int';
			this.label[index]=this.groupingValue;
			this.group[index]=this.groupingValue;
   			return;
   		}
		if(!isDatabaseConnectionVersion(this.baseTableData.components.column[columnName]))
			return;
		var i = this.findColumnIndex(columnName);
		this.deltaIndex[i] = ( this.delta==null ? false : (this.deltaCol[i]!=undefined) );
		this.columnIndex[index]=i;
		this.dataType[index]=this.baseTableData.columnsInfo.type[i];
		this.label[index]=this.groupingValue + " " + this.baseTableData.components.column[columnName].title;
		this.group[index]=this.groupingValue;
	},
	setColumnDetailsAxis: function(columnDetails,columnName) {
   		if(columnName==null) throw "Column name not specified"
		if(!isDatabaseConnectionVersion(this.baseTableData.components.column[columnName]))
			return;
		var i = this.findColumnIndex(columnName);
		var index=columnDetails.columnIndex.length;
		columnDetails.columnIndex[index]=i;
		columnDetails.dataType[index]=this.baseTableData.columnsInfo.type[i];
		columnDetails.label[index]=this.groupingValue + " " + this.baseTableData.components.column[columnName].title;
		columnDetails.group[index]=this.groupingValue;
		columnDetails.deltaIndex[i] = ( this.delta==null ? false : (this.deltaCol[i]!=undefined) );
	},
   setMetrics: function(select) {
   		this.ySeries=[];
   		var j=0;
  		for (var i = 0; i < select.options.length; i++)
    		if (select.options[i].selected)	this.ySeries[j++] = select.options[i].value;
 		this.yAxis=this.ySeries.join();
 		this.renderTableData();
	},
    setGrouping: function(select) {
   		grouping=[];
   		var j=0;
  		for (var i = 0; i < select.options.length; i++)
    		if (select.options[i].selected)	grouping[j++] = select.options[i].value;
 		this.grouping = ( grouping.length==0 ? null : grouping.join() );
 		this.renderTableData();
	},
    setDelta: function(select) {
   		delta=[];
   		var j=0;
  		for (var i = 0; i < select.options.length; i++)
    		if (select.options[i].selected)	delta[j++] = select.options[i].value;
 		this.delta = ( delta.length==0  ? null : delta.join() );
 		this.renderTableData();
	},
   getMetricColumnsOptions: function() {
   		option='<tr><td>Y Metrics</td><td><select multiple="multiple" onclick="'+this.callBackText + '.setMetrics(this)"/>';
		for (var i= 0; i<this.baseTableData.columnsInfo.name.length; i++)	{
			switch (this.baseTableData.columnsInfo.type[i]) {
				case 'real': 
				case 'double': 
				case 'int':
				case 'number':
				case 'bigint':
					if(this.baseTableData.components.column[this.baseTableData.columnsInfo.name[i]]==null) break;
					selected=""; 
					for (var j=0;j<this.ySeries.length; j++)
						if(this.ySeries[j]==this.baseTableData.columnsInfo.name[i]) {
							selected='selected="selected"';
							break;
						}
					option+='<option value="'+this.baseTableData.columnsInfo.name[i]+'" '+selected+'>'+this.baseTableData.components.column[this.baseTableData.columnsInfo.name[i]].title+'</option>';
					break;
			}
		}
		option+='</select></td></tr>'
   			+'<tr><td>Grouping</td><td><select multiple="multiple" onclick="'+this.callBackText + '.setGrouping(this)"/>';
		var grouping=this.grouping==null?[]:this.grouping.split(',');
		for (var i= 0; i<this.baseTableData.columnsInfo.name.length; i++)	{
			switch (this.baseTableData.columnsInfo.type[i]) {
				case 'string': 
					if(this.baseTableData.components.column[this.baseTableData.columnsInfo.name[i]]==null) break;
					selected=""; 
					for (var j=0;j<grouping.length; j++)
						if(grouping[j]==this.baseTableData.columnsInfo.name[i]) {
							selected='selected="selected"';
							break;
						}
					option+='<option value="'+this.baseTableData.columnsInfo.name[i]+'" '+selected+'>'+this.baseTableData.components.column[this.baseTableData.columnsInfo.name[i]].title+'</option>';
					break;
			}
		}
		option+='</select></td></tr>'
   				+'<tr><td>Delta</td><td><select multiple="multiple" onclick="'+this.callBackText + '.setDelta(this)"/>';
		var delta=(this.delta==null ? [] : this.delta.split(',') );
		for (var i= 0; i<this.baseTableData.columnsInfo.name.length; i++)	{
			switch (this.baseTableData.columnsInfo.type[i]) {
				case 'real': 
				case 'double': 
				case 'int':
				case 'number':
				case 'bigint':
					if(this.baseTableData.components.column[this.baseTableData.columnsInfo.name[i]]==null) break;
					selected=""; 
					for (var j=0;j<delta.length; j++)
						if(delta[j]==this.baseTableData.columnsInfo.name[i]) {
							selected='selected="selected"';
							break;
						}
					option+='<option value="'+this.baseTableData.columnsInfo.name[i]+'" '+selected+'>'+this.baseTableData.components.column[this.baseTableData.columnsInfo.name[i]].title+'</option>';
					break;
			}
		}
		return option+'</select></td></tr>';  
	},
	convert3dTo2d: function(point) {
		return { x:this.convertMatrix3dTo2d.aa*point.x+this.convertMatrix3dTo2d.ab*point.y+this.convertMatrix3dTo2d.ac*point.z
				,x:this.convertMatrix3dTo2d.ba*point.x+this.convertMatrix3dTo2d.bb*point.y+this.convertMatrix3dTo2d.bc*point.z};
	},
	retrieveTableData: function($super) {
		$super();
		for(var i=0;i<this.overlays.length;i++) this.getOverlayData(i);
	},
	overlayDraw: function() {
		if(this.ctx==null) return;
		for (var i=0;i<this.overlayDetails.length;i++)
			if(this.overlayDetails[i].tableObject!=null)
				if(this.overlayDetails[i].tableObject.baseTableData.columnsInfo!=null) 
					try {
						this.overlayDetails[i].tableObject.buildLocalDataSet();
						this.overlayDetails[i].tableObject.buildDataSet();
						this["drawChart_"+this.overlayDetails[i].tableObject.chartType](this.overlayDetails[i].tableObject.data);
					} catch(e) {throw "Overlay: "+i+" drawing: " + this.overlayDetails[i].tableObject.chartType + "\n" + e.toString(); };
	},
	overlayRefreshData: function() {
		for (var i=0;i<this.overlayDetails.length;i++)
			if(this.overlayDetails[i].tableObject!=null)
				this.overlayDetails[i].tableObject.retrieveTableData();
	},
	overlayRebuild: function(i,table) {
		var overlayObject=this.overlayDetails[i];
		if(overlayObject.tableObject==null)
			overlayObject.tableObject=table;
		this.overlayDraw();
	},
	overlayShowPanel: function(i) {
		this.overlayDetails[i].panel.show_and_size();
	},
	getOverlayData: function(i) {
		var chartSettingsDOM=(this.chartSettingsDOMActive==null?this.settingsDOM:this.baseTableData.sourceDOM);
		if(this.overlayDetails[i]==null) {
			var settings = "";
			for (var j=0;j<this.overlays[i].childNodes.length;j++) 
				settings += getXmlNodeAsString( this.overlays[i].childNodes[j]);
			var panelID=this.GUID+"_"+"overLay"+i;
			var overlayPanel = new floatingPanel(panelID, 'RAW', "output",null, false, false);
			getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).registerNestedObject(panelID, overlayPanel);
			overlayPanel.draw();
			this.overlayDetails[i]={
					 panel	: overlayPanel
					,type	: 'event'
					,table	: this.overlays[i].getAttribute('table')
					,xAxis	: getNodeByXPath(chartSettingsDOM,this.overlays[i],'axis/x/column/@name').textContent
				};
			loadLink({
					 type				:"leaf"
					,target				: panelID
					,window				: this.parentWindowID
					,windowStage		: this.parentStageID
					,connectionRequired	: true
					,formList			: null
					,type				: "LINK"
					,data				: {
						parameters: {
							 action					: "chart"
							,table					: this.overlayDetails[i].table
							,'$notifyOnReady'		: this.callBackText+".overlayRebuild("+i+",this)"
							,'$display'				: "data"
							,'$settings'			: settings
							,'$onNoDataThrowError' 	: "false"
							} 
					}
				});
			return;
		} 
		var parameters={};
		var params=getNodesByXPath(chartSettingsDOM,this.overlays[i],'/parameterList/parameter');
		for(p=0; i<params.length; i++) {
			try{var name=params[p].getAttributes('name');
			} catch(e) {throw "Missing name for parameter "+(p+1);}
			try{
				var compare=params[p].getAttributes('compare');
				parameters["compare" +name]=compare;
			} catch(e) {
				try{compare=this.pageCallParameters["compare" +name];
				parameters["compare" +name]=compare;
				} catch(e) {}
			}
			try{var nodeValue=params[p].nodeText;
			} catch(e) {}
			try{var type=params[p].getAttributes('type');
			} catch(e) {var type='parameter'}
			switch (type) {
				case 'raw':
					parameters[name]=nodeValue;
					continue;
				case 'parameter':
					parameters[name]=this.pageCallParameters[name];
					continue;
				default:
					throw "Unknown parameter type "+type;
			}
		}
		this.overlayDetails[i].tableObject.processParameters(parameters);
		this.overlayDetails[i].tableObject.retrieveTableData();
	}
}));