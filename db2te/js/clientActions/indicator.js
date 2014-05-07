CORE_CLIENT_ACTIONS.set("indicator",  Class.create(CORE_CLIENT_ACTIONS.get("list_table"), {
	initialize: function($super, callParameters) {
		
		this.canvas_size = 200;
		this.img = new Image(); 
		this.img.src = callParameters.image_dir + 'basebackground.png';	
		this.dialType = callParameters.type != null ? callParameters.type : 'dial';
		this.indicatorUnits = callParameters.unit != null ? callParameters.unit : '';
		this.indicatorMinValue = parseFloat(callParameters.threshold_min);
		this.indicatorMinValue = this.indicatorMinValue != null ? this.indicatorMinValue : 0;
		this.indicatorMaxValue = parseFloat(callParameters.threshold_max);
		this.indicatorMaxValue = this.indicatorMaxValue != null ? this.indicatorMaxValue : 0;
		this.indicatorWarningThreshold = parseFloat(callParameters.threshold_warning);
		this.indicatorWarningThreshold = this.indicatorWarningThreshold != null ? this.indicatorWarningThreshold : 50;
		this.indicatorWarningThreshold = ((this.indicatorWarningThreshold - this.indicatorMinValue) / (this.indicatorMaxValue - this.indicatorMinValue))*100;
		this.indicatorDangerThreshold = parseFloat(callParameters.threshold_danger);
		this.indicatorDangerThreshold = this.indicatorDangerThreshold != null ? this.indicatorDangerThreshold : 50;
		this.indicatorDangerThreshold = ((this.indicatorDangerThreshold - this.indicatorMinValue) / (this.indicatorMaxValue - this.indicatorMinValue))*100;
		this.indicatorColumnName = callParameters.monitor;
		
		$super(callParameters);
	},
	
	setError: function(message) {
		openModalAlert(" indicator error: " + message);
	},
	
	renderTableData: function() {
		this.clearError();
		this.renderIndicators();		
	},

	renderIndicators: function() {
        // Set canvas size
		var canvas_size_half = this.canvas_size/2;	

		if(this.dialType == "dial") {
			// Default dial value to lower limit
			var dialValue = this.indicatorMinValue;
			var dialValueSet = false;
			var columnType = "";												   
			var displayValue = "";
			var columnComponent = "";
												   
			// Handle multiple monitored column values if necessary
			if(this.indicatorColumnName == null) {
				this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error: no column name specified</h2></td></tr></table>");
				return;
			} else if (!Object.isString(this.indicatorColumnName)) {		 		   
				this.setError("<table style='width:100%;height:100%'><tr><td align='center'><h2>Error: a dial can only monitor one column value.</h2></td></tr></table>");
				return;		   
			} else {
				this.indicatorColumnName = this.indicatorColumnName.toUpperCase();
				if(this.baseTableData != null)
					if(this.baseTableData.baseData != null)
						if(this.baseTableData.baseData[0] != null) {
							if(this.baseTableData.baseData[0][this.baseTableData.resultSetIndexByColumnName[this.indicatorColumnName]] != null)
								dialValue = this.baseTableData.baseData[0][this.baseTableData.resultSetIndexByColumnName[this.indicatorColumnName]];
							dialValueSet = true;
						}
			}		

			// Autospan handling:
			// Adjust upper bound if necessary								   
			if (dialValue > this.indicatorMaxValue) this.indicatorMaxValue = dialValue;
			// Adjust lower bound if necessary							
			if (dialValue < this.indicatorMinValue) this.indicatorMinValue = dialValue;								   

			// Normili value						   
			dialValue = Math.floor(((dialValue-this.indicatorMinValue)/(this.indicatorMaxValue-this.indicatorMinValue)) *100);
			dialValue = dialValue > 100 ? 100 : dialValue < 0 ? 0 : dialValue;
					
			var color = "rgba(255, 0, 0, 0.25)";						
			// Warning case								   
			if(dialValue <= this.indicatorWarningThreshold) {
				var value = Math.floor(156+dialValue*3);
				color = "rgba(0, " + (value) + ", 0, 0.25)";
			}
			// Danger case							   
			else if(dialValue < this.indicatorDangerThreshold) {
				var value = Math.floor(7.5*(dialValue-33));
				color = "rgba(" + (value) + ", 255, 0, 0.25)";
			} else {
			// Safe case								
				var value = Math.floor((7.5*(dialValue-66)));
				if(value > 255) value = 255;
				color = "rgba(255, " + (254-value) + ", 0, 0.25)";
			}
											   
			// Draw background image												   
			canvas = $(this.elementUniqueID + "_canvas");
			if(canvas == null) return;
			var ctx = canvas.getContext("2d");
			ctx.restore();
			try {									   
				ctx.clearRect(0,0,10000,10000);
				ctx.drawImage(this.img,0,0,this.canvas_size,this.canvas_size);
			}
			catch(e){
				setTimeout(this.callBackText + ".renderIndicators()", 100);
			}
			ctx.save();									   
												   
			// Color image according to threshold values							   
			ctx.fillStyle = color;  
			ctx.beginPath();
			ctx.arc(canvas_size_half-2,canvas_size_half-2,canvas_size_half-5,0,Math.PI+(Math.PI*2.75)/2, false); 
			ctx.fill();
			ctx.closePath(); 
			ctx.save(); 
			
			// Draw needle								   
			ctx.beginPath();
			// Move to the center
			ctx.translate(canvas_size_half,canvas_size_half);
			// Rotate  0% = -2.5 100% = 2.5
			ctx.rotate(5*(dialValue/100)-2.5);
			// Move back
			ctx.translate(-canvas_size_half,-canvas_size_half);  
			ctx.fillStyle = "rgb(0,0,0)"; 
			ctx.moveTo(canvas_size_half-10,canvas_size_half);  
			ctx.lineTo(canvas_size_half,canvas_size_half+10);   
			ctx.lineTo(canvas_size_half+10,canvas_size_half);  
			ctx.lineTo(canvas_size_half,0);
			ctx.fill(); 
			ctx.closePath();												   
			ctx.restore();
												   
			// Draw textbox and monitored value	
			// TODO: Add support for multiple monitored column values									   
			ctx.restore(); 
			ctx.restore();
			if(dialValueSet) {
				if(this.baseTableData.components['column'] != null) {
					if(this.baseTableData.components['column'][this.indicatorColumnName] != null) {
						columnType = 'column';
						columnComponent = this.baseTableData.components['column'][this.indicatorColumnName];
					}
				}
				if(this.baseTableData.components['dynamiccolumn'] != null && columnType == "") {
					if(this.baseTableData.components['dynamiccolumn'][this.indicatorColumnName] != null) {
						columnType = 'dynamiccolumn';
						columnComponent = this.baseTableData.components['dynamiccolumn'][this.indicatorColumnName];
					}
				}
				columnComponent.display = [{type:'component', value:'value'}];
				displayValue += TABLE_COLUMN_RENDERING_MODULES.get(columnType).render(this, 0, columnComponent);
				displayValue += "&nbsp;" + this.indicatorUnits;			
				$(this.elementUniqueID + "_canvasValue").update(displayValue);
			}
			// Reset canvas
		}
		
		// Breakdown Bar Indicator											   
		if(this.dialType == "break_down") {
			var columnNames = this.indicatorColumnName;
			var colors = new Array("red", "blue", "green", "yellow", "black");												   
		    var values = new Array();
			var length = 0;
												   
			// Handle multiple monitored column values if necessary									   
			if (columnNames != null) 					   
				length = columnNames.length;
			else {
				columnNames = this.baseTableData.tableCallParameters.monitor;
												   
				// Ensure a column name exists								   
				if (columnNames != null)
					length = 1;	
			}
												   
			// Total of 5 values and colors, add more if necessary
			if(length > 5)
				length = 5;
			
			var total = 0;
												   
			// Retrieve values and calculate total
			for(var i = 0; i < length; i++) {
				if (length == 1)
					values[i] = this.baseTableData.baseData[0][this.baseTableData.resultSetIndexByColumnName[columnNames.toUpperCase()]];
				else if(columnNames[i]['@text'] != null)
					    values[i] = this.baseTableData.baseData[0][this.baseTableData.resultSetIndexByColumnName[columnNames[i]['@text'].toUpperCase()]];
												   
				// Recalculate total
				if (values[i] != null)
					total += parseInt(values[i]);
			}

			// Draw background image												   
			canvas = $(this.elementUniqueID + "_canvas");
			var ctx = canvas.getContext("2d");
			ctx.restore();											   
			ctx.clearRect(0,0,canvas_size_half,canvas_size);
			ctx.strokeStyle = "black";
			ctx.fillStyle = "white";									   
			ctx.lineWidth = 2;													   
			ctx.strokeRect(0,0,canvas_size_half,canvas_size);			
			ctx.fillRect(0,0,canvas_size_half,canvas_size);	
			ctx.save();	
												   
			// Update the indicator
			if(total != 0) {
				var height;
				var cur_y_pos = 0;								   
				for(var i = 0; i < length; i++) {
					height = Math.round(parseFloat(values[i]) / parseFloat(total) * parseInt(this.canvas_size/2));

					if(parseInt(height) != 0) {
						// Move down to draw next bar						   
						ctx.translate(0,cur_y_pos);
												   
						// Draw textbox
			            ctx.clearRect(0,0,canvas_size_half,height);												   
						ctx.stokeStyle = "black";						   
						ctx.fillStyle = colors[i];	
			            ctx.lineWidth = 1;												   
						ctx.strokeRect(0,0,canvas_size_half,height);
						ctx.fillRect(0,0,canvas_size_half,height);
												   
						// Draw text									   
						ctx.fillStyle = "black";
						ctx.textAlign = "center";
						ctx.font = "11pt Arial";
						ctx.fillText(values[i] + " " + this.indicatorUnits, canvas_size_half/2, height/2);	
												   
						// Move cursor back
						ctx.translate(0,-cur_y_pos);						   
					}
												   
					// Update current y position
					cur_y_pos += height;													   												   
				}
			}
			ctx.restore();							   												   
		}
	},
    
	sizeHeight: function(Amount) {
		this.height = $(this.parentPageID).getHeight();
		this.canvas_size = ( this.width > this.height ? this.height : this.width );
		var canvas = $(this.elementUniqueID + "_canvas");
		var container = $(this.elementUniqueID + "_mainContainer");
		if(canvas != null) {
			canvas.width = this.canvas_size;
			canvas.height = this.canvas_size;//({ "width": () + "px", "height": (this.canvas_size) + "px" });
		}
		if(container != null)
			container.setStyle({ "height": (this.canvas_size) + "px", "width": (this.canvas_size) + "px"});
		this.renderIndicators();
	},

	setHeight: function(Amount) {
		this.sizeHeight(null);
		this.size();
	},

	sizeWidth: function(Amount) {
		this.setWidth(null);
	},

	setWidth: function(Amount) {
		this.width = $(this.parentPageID).getWidth();
		this.canvas_size = ( this.width > this.height ? this.height : this.width);
		var canvas = $(this.elementUniqueID + "_canvas");
		var container = $(this.elementUniqueID + "_mainContainer");
		if(canvas != null) {
			canvas.width = this.canvas_size;
			canvas.height = this.canvas_size;//({ "width": () + "px", "height": (this.canvas_size) + "px" });
		}
		if(container != null)
			container.setStyle({ "width": (this.canvas_size) + "px", "height": (this.canvas_size) + "px" });
		this.renderIndicators();
	},
	
	draw: function() {						   
		this.width = $(this.parentPageID).getWidth();
		this.height = $(this.parentPageID).getHeight();													   
		this.canvas_size = ( this.width > this.height ? this.height : this.canvas_size = this.width);
		if(this.dialType == "dial")
		    var output = "<div id='" + this.elementUniqueID + "_mainContainer' style='width:" + this.canvas_size + "px;height:" + this.canvas_size + "px'><canvas id='" + this.elementUniqueID + "_canvas' width='" + this.canvas_size + "' height='" + this.canvas_size + "'></canvas><div style='background-color:white;border:3px solid black;bottom:70px;height:20px;left:30%;position:relative;width:40%;'><table cellspacing='0' cellpadding='0' style='width:100%;height:100%;text-align:center;' valign='center' align='center'><tr><td id='" + this.elementUniqueID + "_canvasValue'>Loading...</td></tr></table></div></div>";	
		
		if(this.dialType == "break_down")
			var output = "<canvas id='" + this.elementUniqueID + "_canvas' width='" + this.canvas_size/2 + "' height='" + this.canvas_size + "'></canvas>";

		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).setContent(output, this.baseTableData.localTableDeffinition.pluralName, this.baseTableData.localTableDeffinition.description, null, null);
		this.renderIndicators();
	}
}));
