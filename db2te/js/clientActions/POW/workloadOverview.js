/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.
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
 
CORE_CLIENT_ACTIONS.set("workloadOverview",  Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "workloadOverview", "workloadOverview");
		this.firstChartLoad = true;
		x=0;				// set up color pallet
		this.colourPallet=[];
		delta=255/5;
		for (i=0;i<5;i++){
			for (j=0;j<5;j++){
				for (k=0;k<5;k++){
					this.colourPallet[x++] = 'rgb(' + Math.floor(i*delta) + ',' + Math.floor(j*delta) + ','+ Math.floor(k*delta) +')';
	    		}
    		}
  		}
		
		//this is where the data that is being graphed is stored
		this.localDataSet = [];
		
		this.serverDataAction = callParameters.$serverDataAction;
		this.numOfDataSets = callParameters.$numOfDataSets;
		
		this.title = callParameters.$title;
		
		this.direction = callParameters.$direction;
		
		this.colour=[];
		this.xAxisPosition = 0;
		this.yAxisPosition = 0;
		this.showPoints = callParameters.$showPoints=='true' ? true : false;
		this.tickIncrement = 5;
		
		this.loadInProgress = false

		this.grouping=null;

		this.yAxisUpperBound = callParameters.$yAxisUpperBound;
		this.yAxisLowerBound = callParameters.$yAxisLowerBound;

		var parentPanel = getPanel(this.parentStageID, this.parentWindowID,this.parentPanelID);
		parentPanel.registerNestedObject(this.elementUniqueID, this);
		parentPanel.refreshCallback = this.callBackText + '.refresh()';
		
		this.draw();
		this.retrieveTableData();
		
	},

	refresh : function() {
		this.firstChartLoad = true;
		this.retrieveTableData();
	},
	checkExists : function(value,errorMessage) {
	 	if (value==null) alert(errorMessage);
	},
	setError: function(message) {
		var contentArea = $(this.elementUniqueID + "_DisplayArea");
		var errorArea = $(this.elementUniqueID + "_ErrorDisplayArea");
		if(contentArea != null)
			contentArea.hide();
		if(errorArea != null)
		{
			this.errorIsShowen = true;
			errorArea.show();
			errorArea.update("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+message+"</h2></td></tr></table>");
		}
	},
	
	clearError: function() {
		var contentArea = $(this.elementUniqueID + "_tableDisplayArea");
		var errorArea = $(this.elementUniqueID + "_tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.show();
		if(errorArea != null)
		{
			this.errorIsShowen = false;
			errorArea.hide();
			errorArea.update("");
		}
	},

	retrieveTableData: function() {
		
		if(this.loadInProgress) return;
		this.loadInProgress = true;

		this.clearError();
		
		var elementUniqueID = this.elementUniqueID;

		var thisObject = this;
		

		POSTDATA = new Object();
		

		POSTDATA.action 				= this.serverDataAction;
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.USE_CONNECTION = ACTIVE_DATABASE_CONNECTION;
		
		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onSuccess': function(transport) {
						if(thisObject.objectIsDead) return;
						var result = transport.responseJSON;

						thisObject.localDataSet = resultSet.returnValue;
						
						thisObject.renderTableData();
					},
					'onException': function(transport,exception) {
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Exception while loading table data</h2>"+(typeof(exception)=="object"?exception.name + ": " +exception.description:exception)+"</td></tr></table>");
					},
					'onFailure': function(transport,exception) {
						thisObject.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error loading table data</h2>"+(exception==null?transport.statusText:(typeof(exception)=="object"?exception.name + ": " +exception.description:exception))+"</td></tr></table>");
					}
			});
	},
	
	renderTableData: function() {
		
		this.buildDataSet();
		if(this.firstChartLoad) {
			this.firstChartLoad = false;
			if (this.data==null) this.buildDataSet();
		}
	},
	redrawChart: function () {
		var errors;
		
		var colourCnt=this.columnIndex.length;

		if (colourCnt>this.colour.length) {
			if (colourCnt < 7 && this.colour.length==0 ) {
				this.colour[0]='black';
				this.colour[1]='#99CCFF'; // 'blue';
				this.colour[2]='red';
				this.colour[3]='green';
				this.colour[4]='#FF9933'; //'orange';
				this.colour[5]='#CC99FF';  //'purple';
				this.colour[6]='yellow';
			}  
			var delta=this.colourPallet.length/colourCnt;
			for( var i= this.colour.length; i < colourCnt; i++) {this.colour[i]=this.colourPallet[Math.floor(i*delta)];}
		}
		this.ctx.clearRect(0,0,this.chartWidth,this.chartHeight);
		this.ctx.strokeStyle = "black";
		this.ctx.lineWidth=1;

		this.drawLineAxis();

		var xPos = 0;
		var xPos = 0;
		this.barWidth=Math.floor(this.tickIncrement/(this.columnIndex.length-1));
		for( var j= 1; j < this.columnIndex.length; j++) {
			this.ctx.strokeStyle = this.colour[j];
			this.ctx.lineWidth=3;
			this.ctx.beginPath();
			for( var i= 0; i < this.data.length; i++) {
				if (this.data[i][j]==null) continue;
				xPos=this.xAxisPosition+Math.floor((i)*this.tickIncrement)+(j-1)*this.barWidth;
				yPos=this.yPosition(this.yScale(this.data[i][j]));
				this.ctx.lineTo(xPos,yPos);
				if(this.showPoints)
				{
					this.ctx.arc(xPos,yPos, 3, 0, Math.PI*2, false);
				}
			}
			this.ctx.stroke();
		}

		
		if (errors!=null) {
			alert(errors);
			throw errors;
		}
	},
	
	canvasCoords: function (callingEvent) {
	    var xPos = callingEvent.clientX - this.canvasOffset[0]-10;
	    var yPos = callingEvent.clientY - this.canvasOffset[1]-10 ;
		while (this.detailXY.rows.length> 0) {this.detailXY.deleteRow(0);}
		var XYRow=this.detailXY.insertRow(-1);
		
		var x=Math.floor((xPos - this.xAxisPosition)/this.tickIncrement-0.5);
		XYRow.insertCell(-1).innerHTML="x:";
		switch (this.dataType[0]) {
			case 'timestamp' :
			case 'date' :
			case 'datetime' :
				XYRow.insertCell(-1).innerHTML=this.dataToString(0,(xPos -this.xOffset)/this.xRatio);
				break;
			default:
				XYRow.insertCell(-1).innerHTML=this.data[this.xTicks[x]][0];
		}
		XYRow=this.detailXY.insertRow(-1);
		XYRow.insertCell(-1).innerHTML= "y:";
		XYRow.insertCell(-1).innerHTML=this.dataToString(1,(this.yOffset - yPos)/this.yRatio);
			
		if (yPos<this.chartHeight/2) {
		 	this.detailXY.setStyle({'top':  yPos + 'px'});
		} else {
		 	this.detailXY.setStyle({'top':  (yPos-this.detailXY.getHeight()) + 'px'});
		}
		if (xPos<this.chartWidth/2) {
			this.detailXY.setStyle({'left': xPos + 'px'});
		} else {
			this.detailXY.setStyle({'left': (xPos -this.detailXY.getWidth())  + 'px'});
		}
		this.detailXY.setStyle({'display': 'block'});

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
		this.redrawChart();
		this.detailXY.setStyle({'display': 'none'});
		while (this.detailXY.rows.length> 0) {this.detailXY.deleteRow(0);}
	},
	yPosition: function (value) {
		if (value==null) return this.yAxisPosition;
		if (value==Infinity) return 0;
		if (value==-Infinity) return this.yOffset;
		return this.yOffset-value;
	},
	yScale: function (value) {
		return value*this.yRatio;
	},
	xPosition: function (value) {
		return this.xOffset+value;
	},
	xScale: function (value) {
		return value*this.xRatio;
	},
	plot: function (y) {
		var dataY;
		var dataX;
		var errors;
		this.ctx.strokeStyle = this.colour[y];
		this.ctx.lineWidth=1;
		for( var row= 0; row < this.data.length; row++) {
			if (dataX==null || dataY==null) {
				this.ctx.beginPath();
				try{
					dataX=this.data[row][0];
					dataY=this.data[row][y];
				} catch(e) {
					dataX=null;
					dataY=null;
				}
				if (!(dataX==null || dataY==null || isNaN(dataX) || isNaN(dataY))) {
					this.ctx.beginPath();
					try {
						this.ctx.moveTo(this.xPosition(this.xScale(dataX)),this.yPosition(this.yScale(dataY)));  
					} catch (e) {
						errors += " x: " + dataX + " ( " + this.xPosition(this.xScale(dataX)) + " ) " + " y: " + dataY + " ( " + this.yPosition(this.yScale(dataY)) + " ) " + "\n" + e + "\n";
						dataX=null;
						dataY=null;
					} 
				} 
			} else {
				try{
					dataX=this.data[row][0];
					dataY=this.data[row][y];
				} catch(e) {
					dataX=null;
					dataY=null;
				}
				if (dataX==null || dataY==null || isNaN(dataX) || isNaN(dataY)) {
					this.ctx.stroke();
				} else {
					try {
						this.ctx.lineTo(this.xPosition(this.xScale(dataX)),this.yPosition(this.yScale(dataY)));
					} catch (e) {
						errors += "x: " + dataX + " ( " + this.xPosition(this.xScale(dataX)) + " ) " + " y: " + dataY + " ( " + this.yPosition(this.yScale(dataY)) + " ) " + "\n" + e + "\n";
						dataX=null;
						dataY=null;
					} 
				}
			}
		}
		this.ctx.stroke();
		if (errors!=null) {
			throw errors;
		}
	},
	draw: function() {
		var i =0;
		var output = "";
		
		output = "<div id='" + this.elementUniqueID + "_DisplayArea' style='width:100%;height:100%;position:static;'>";
		output =+ "<table><tr><td>" +  this.title + "</td>";
		
		for(i = 0; i < this.numOfDataSets; i++)
		{
			if(this.direction = 'v')
				output += "</tr><tr>";
			output += "<td>" +
			"<canvas id='" + this.elementUniqueID + "_chart_" + i + "' width='"+this.chartWidth+"' height='"+this.chartHeight+"'"
						+ " style='padding-top:10px;padding-left:10px;'></canvas>"
						+ "</td>";
		}
		output += "</tr></table>";
		
		output += "<div id='" + this.elementUniqueID + "_ErrorDisplayArea' style='display:none;height:200px;overflow-x: auto;overflow-y: auto;position:static;'>";
		output += "</div>";
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, this.title, null, 'hidden', null);
		this.canvas = [];
		this.canvasOffset [];
		this.ctx = [];
		for(i = 0; i < this.numOfDataSets; i++)
		{
			this.canvas[i] = initCanvas($(this.elementUniqueID + "_chart_" + i));
			if (!this.canvas[i].getContext) {
				this.setError('canvas-unsupported');
	  			return;
			}
			this.canvasOffset[i]=Element.cumulativeOffset(this.canvas[i]);
			this.ctx[i] = this.canvas[i].getContext('2d');
			this.ctx[i].font = "10px sans-serif";
		}
	},
	drawXAxisTick: function(i,x) {
		this.ctx[i].beginPath();		  			
		this.ctx[i].moveTo(x+0.5,this.yAxisPosition+5);  
		this.ctx[i].lineTo(x+0.5,this.yAxisPosition-5);
		this.ctx[i].stroke(); 
	},
	drawYAxisTick: function(i,y) {
		if(y==Infinity) return;
		if(y==-Infinity) return;
		this.ctx[i].beginPath();		  			
		this.ctx[i].moveTo(this.xAxisPosition+5,y+0.5);  
		this.ctx[i].lineTo(this.xAxisPosition-5,y+0.5);
		this.ctx[i].stroke(); 
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
						case 'timestamp' :
						case 'datetime' :
							if (this.precision[0] >= 1440) axisLabel+=' ';
						case 'timestamp' :
						case 'datetime' :
						case 'time' :
							if (this.precision[0] >= 360) axisLabel+=this.padLeadZero(ts.getHours(),2)+':';
							if (this.precision[0] >=  60) axisLabel+=this.padLeadZero(ts.getMinutes(),2)+':';
							if (this.precision[0] >=  1) axisLabel+=this.padLeadZero(ts.getSeconds(),2);
				}
				return 	axisLabel;
						case 'time' :
			case 'int' :
			case 'real' :
				if (value>10000000000) return Math.round(value/1000000000).toString()+'G';
				if (value>10000000) return Math.round(value/1000000).toString()+'M';
				if (value>1000000) Math.round(value/1000).toString()+'K';
				if (value ==Math.round(value)) return value.toString();
				if (value>=10000) return value.toFixed(0);
				if (value>=1000) return value.toFixed(1);
				if (value>=100) return value.toFixed(2);
				if (value>=10) return value.toFixed(3);
				if (value>=1) return value.toFixed(4);
				if (value>=0.1) return value.toFixed(5);
				if (value>=0.01) return value.toFixed(6);
				if (value>=0.001) return value.toFixed(7);
				return value.toString();
		}
		return value.toString();
	},
	padLeadZero : function(value,size) {
		return "000000000000".substr(0,size-value.toString().length)+value;
	},
	drawLineAxis: function() {
		this.ctx.fillStyle = "black";
		this.ctx.lineWidth=1;
		this.ctx.beginPath();		  			// x axis
		this.ctx.moveTo(this.xAxisPosition+0.5,this.yAxisPosition);  
		this.ctx.lineTo(this.xAxisPosition+0.5,0);
		this.ctx.stroke();
												// x ticks
		
				if (this.xTicks.length==0) this.tickIncrement=this.xMax; 
				else this.tickIncrement=Math.floor(this.xMax/this.xTicks.length);
				for(var i = 0; i< this.xTicks.length; i++) {
					
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
								case 'timestamp' :
								case 'datetime' :
								case 'time' :
									if (this.precision[0] < 360) axisLabel+=this.padLeadZero(ts.getHours(),2)+':';
									if (this.precision[0] <  60) axisLabel+=this.padLeadZero(ts.getMinutes(),2)+':';
									if (this.precision[0] <   1) axisLabel+=this.padLeadZero(ts.getSeconds(),2);
							}
							this.ctx.fillText(axisLabel, pos,this.chartHeight-this.axisOffset/2);
							break;
						default:					
							this.ctx.fillText(this.localDataSet[this.xTicks[i]][this.columnIndex[0]], pos,this.chartHeight-this.axisOffset/2);
					} 
				}
												// y axis  												 
		this.ctx.beginPath();					  
		this.ctx.moveTo(this.xAxisPosition,this.yAxisPosition+0.5);
		if(this.chartType == 'setline')
			this.ctx.lineTo(this.chartWidth-this.tickIncrement,this.yAxisPosition+0.5); 
		else
			this.ctx.lineTo(this.chartWidth,this.yAxisPosition+0.5);  
		this.ctx.stroke(); 
												// y ticks
		for(var i = 0; i< this.yTicks.length; i++) {
			var pos=this.yPosition(this.yScale(this.yTicks[i]));
			this.drawYAxisTick(pos);
			this.ctx.textAlign='left';
			this.ctx.fillText(this.dataToString(1,this.yTicks[i]),0 , pos+3);
		} 
	},
	calculateTicks: function(max,min,type,metric) {
		var tickPosition = [];
		if (max==null) return tickPosition;
		var i=0;
		var k=0;
		var duration=max-min;
		
		for(i = 0 ; i < 20; i++)	{if(Math.floor((duration)/Math.pow(10,i)) <= 2 ) break;}
		for(i-- ; i < -20; i--)		{if(Math.floor((duration)/Math.pow(10,i)) >= 2 ) break;}
		for(var j=Math.floor(min/Math.pow(10,i)); Math.pow(10,i)*j<=max ; j++) {
			if (Math.pow(10,i)*j>min) tickPosition[k++]=Math.pow(10,i+1)*j/10;
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
		
		this.xAxisPosition = this.axisOffset;
		this.xMax = this.width-this.axisOffset;
						
		this.yAxisPosition = this.chartHeight-this.axisOffset;
		this.yMax = this.yAxisPosition-5;
		
		this.yDataMin = this.yAxisLowerBound;
		this.yDataMax = this.yAxisUpperBound;
		
		this.yDataMin= this.yDataMin != null ? this.yDataMin : 0;
		this.yDataMax= this.yDataMax != null ? this.yDataMax : 0;
		for(var i = 1; i < this.columnIndex.length; i++) {
			if (this.yDataMax<this.dataMax[i]) this.yDataMax=this.dataMax[i];
		}
		this.yDataMax=this.yDataMax*1.01;
		break;
	
		this.yRatio = this.yMax/(this.yDataMax-this.yDataMin);
		if (isNaN(this.yRatio)) {
			throw "y ratio calculation error, charting width:"+ this.yMax + " max:"+ this.yDataMax + " min:"+ this.yDataMin;
		}
		this.yOffset= this.yAxisPosition+this.yScale(this.yDataMin);
		if (isNaN(this.yRatio)) {
			throw "y offset calculation error, start position:"+ this.yAxisPosition + " plot value:"+ this.yScale(this.yDataMin);
		}
		this.yTicks = this.calculateTicks(this.yDataMax,this.yDataMin,this.dataType[1],1);
		break;
		
	},
	dataConversion: function(i,value) {
		if (value==null) return null;
		switch (this.dataType[i]) {
		 	case 'real':
		 		try{return parseFloat(value);} catch(e) {return null;}
		 	case 'int':
		 		try{return parseInt(value);} catch(e) {return null;}
		 	case 'timestamp':
		 		try{return Date.parse(value.substr(0,4)+'/'+value.substr(5,2)+'/'+value.substr(8,11))
		 				+ parseInt(value.substr(21,3));} catch(e) {return null;}
		 	case 'time':
		 	case 'datetime':
		 	case 'date':
		 		try{return Date.parse(value);} catch(e) {return null;}
			default: 
				return value;
		}
	},	
	buildDataSet: function() {
		if (this.baseTableData.rowsReturned <1) {
			throw 'No data to chart';
		}
		this.groupingValue="";
		this.columnIndex=[];
		this.dataType=[];
		this.precision=[];
		this.group=[];
		this.data=null;
		this.label=[];
		this.groupIndex;
		this.groupValue=[];
		this.xTicks=[];
		this.yTicks=[];
		this.setColumnDetails(0,this.xAxis);
		if (this.grouping==null) {
			for( i = 0; i < this.ySeries.length; i++) {
				this.setColumnDetails(i+1,this.ySeries[i]);
			}
		} else {
			this.groupIndex=[];
			var groupingArray=this.grouping.split(",");
			j=0;
			for (var j=0; j<groupingArray.length;j++) {
				for (var i= 0; i < this.baseTableData.columnsInfo.name.length; i++)	{
					if(this.baseTableData.columnsInfo.name[i]==groupingArray[j]) break;
				}
				if (i >= this.baseTableData.columnsInfo.name.length) {
					alert( "grouping column "+groupingArray[j]+" not found" );
					throw "grouping column "+groupingArray[j]+" not found";
				} 
				this.groupIndex[j]=i;
			}
		}
		this.data=[];
		this.dataMax=[];
		this.dataMin=[];
		var rowIndex=-1;
		for( var row = 0; row < this.baseTableData.rowsReturned; row++) {
			if (this.grouping==null) {
				rowIndex++;
				this.data[rowIndex]=[];
			} else {
				if (rowIndex==-1) {
					rowIndex++;
					this.data[rowIndex]=[];
				} else if (this.localDataSet[row][this.columnIndex[0]] !=  this.localDataSet[row-1][this.columnIndex[0]]) {
					rowIndex++;
					this.data[rowIndex]=[];
				}
				var newGroupingValue='';
				for( i = 0; i < this.groupIndex.length; i++) {
					newGroupingValue+=' '+ this.localDataSet[row][this.groupIndex[i]];
				}
				if (this.groupingValue!=newGroupingValue) {
					this.groupingValue=newGroupingValue;
					this.group[0]=this.groupingValue;
					var i;
					for( i = 0; i < this.groupValue.length; i++) {
						if(this.groupingValue==this.groupValue[i]) break;
					}
					if (i >= this.groupValue.length) {
						this.groupValue[i]=this.groupingValue;
						for(i = 0; i < this.ySeries.length; i++) {
							this.setColumnDetails(this.columnIndex.length,this.ySeries[i]);
						}
					}
				}
			}
			
			 this.xTicks[rowIndex]=row;
			 break;
			
			for(var i = 0; i < this.columnIndex.length; i++) {
				if (this.group[i]!=this.groupingValue) {
					if (this.data[rowIndex][i]== undefined) this.data[rowIndex][i]=null; 
					continue;
				}
				this.data[rowIndex][i] = this.dataConversion(i,this.localDataSet[row][this.columnIndex[i]]);  				
		 		if (this.dataMin[i]==null) {
		 			this.dataMin[i]=this.data[rowIndex][i];
		 			this.dataMax[i]=this.dataMin[i];
		 			continue;
		 		} 
		 		if (this.dataMin[i]>this.data[rowIndex][i]) {
		 			this.dataMin[i]=this.data[rowIndex][i];
		 			continue;
		 		}
		 		if (this.dataMax[i]<this.data[rowIndex][i]) {
		 			this.dataMax[i]=this.data[rowIndex][i];
		 			continue;
		 		}
			}
		}
	},
   setColumnDetails: function(index,columnName) {
		for (var i= 0; i < this.baseTableData.columnsInfo.name.length; i++)	{
			if(this.baseTableData.columnsInfo.name[i]==columnName) break;
		}
		if (i >= this.baseTableData.columnsInfo.name.length) {
			alert("column "+columnName+" not found");
			throw "column "+columnName+" not found";
		} 
		this.columnIndex[index]=i;
		this.dataType[index]=this.baseTableData.columnsInfo.type[i];
		this.label[index]=this.groupingValue + " " + this.baseTableData.components.column[columnName].title;
		this.group[index]=this.groupingValue;
	}
}));