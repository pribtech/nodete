/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 *Updated author: Peter Prib
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011-2012 All rights reserved.
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
TABLE_COLUMN_RENDERING_MODULES.set("column", {
	
	groupTitle: "Columns",
	
	columnCheck: function(baseTableObject, columnName) {
		var columnObject = baseTableObject.components.column[columnName];
		columnObject.render= (  isDatabaseConnectionVersion(columnObject)
							 && ( baseTableObject.isSummarized ? columnObject.isCubeAttribute : true ) );
		columnObject.title = columnObject.title == null ? "" : columnObject.title;
		columnObject.titleNoQuots = columnObject.title.replace("'", "&#39;").replace('"', "&quot;");
		if(columnObject.fieldType == null) columnObject.fieldType = 's';
		columnObject.fieldType = columnObject.fieldType.toLowerCase();
		return columnObject.render;
	},
	
	render: function(tableObject, rowToRender, columnObject, maskingColumn, displayColumn) {
	 	if(!columnObject.render) return;
		if(columnObject.display == null) {
			if (displayColumn==null) 
				var displayColumn = tableObject.getDisplayColumn(tableObject,columnObject.name);
			columnObject.display = [];
			var hasMask = false;
			var showValue = true;
			if(columnObject.componentAvalibility == null)
				columnObject.display.push({type:'component', value:'value'});
			else {
				columnObject.componentAvalibility.each(function(renderItem) {
					switch(renderItem) {
						case "value":
							break;
						case "mask":
							hasMask = true;
							break;
						case "inlineGraph":
							showValue = false;
						default:
							columnObject.display.push({type:'component', value:renderItem});
					}
				});
				if(showValue)
					columnObject.display.push({type:'component', value: ( hasMask ? 'mask' : 'value' ) });
			}
		}
		if(columnObject.localQueryDataIndex == null) {
			columnObject.localQueryDataIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
			columnObject.localQueryType = tableObject.baseTableData.columnsInfo.type[columnObject.localQueryDataIndex];
			columnObject.localQueryDataType = DB2_DATA_TYPE_CLASSIFICATION[columnObject.localQueryType.toLowerCase()];
			if(columnObject.localQueryDataType == null)
				columnObject.localQueryDataType = DB2_STRING;
		}
		if(columnObject.display.length == 0) return "";
		if(columnObject.localQueryDataType == DB2_BLOB)
			return "<font style='color:green;font-weight: bold;'>BLOB data</font>";
		
		var output = "";
		var displayItems = columnObject.display.length;
		var mask = null;
		var value = null;
		var oldRow = null;

		if(displayItems > 1)
			output = "<table style='table-layout: fixed;padding:0px;margin:0px;' cellpadding='0px' cellspacing='0px' ><tbody><tr>";
		for(var i = 0; i < displayItems; i++) {
			mask = null;
			value = tableObject.baseTableData.baseData[rowToRender][columnObject.localQueryDataIndex];

			if(displayItems > 1)
				output += "<td valign='top' style='min-width:" + DEFAULT_ICON_WIDTH + "px;"+this.processStyle(columnObject,value)+"'>";
			else
				output += "<div style='"+this.processStyle(columnObject,value)+"'>";
			if(columnObject.format != null)
				value = GLOBAL_TRANSFORMS.convert(value, columnObject.format);
			if(columnObject.formatnumber != null)
				value = this.formatnumber(value, columnObject.formatnumber);
			
			if(value == null && columnObject.nullMask != null) {
				mask = columnObject.nullMask;
			} else if(columnObject.mask != null ) {
				if(columnObject.mask[value] != null)
					mask = columnObject.mask[value];
			}
				
			if(columnObject.display[i].type == 'component') {
				if(displayColumn!=undefined) {
					if(displayColumn['break']=="column") 
						if(rowToRender!=0)
							if (tableObject.baseTableData.baseData[rowToRender][columnObject.localQueryDataIndex]==tableObject.baseTableData.baseData[rowToRender-1][columnObject.localQueryDataIndex] )
								value='';
					switch (displayColumn['transform']) {
						case 'delta':
							if(tableObject.baseTableData.history.data.length<1) {
								value=null;
								break;
							}
							if(oldRow==null) {
								oldRow=tableObject.findRow(tableObject.baseTableData.baseData[rowToRender],tableObject.baseTableData.history.data[0]);
								if(oldRow==null) {
									value=null;
									break;
								}
							}
							value-=oldRow[columnObject.localQueryDataIndex];
							break;
					}
				}
				switch(columnObject.display[i].value) {
					case "mask":
						if(value != null || mask != null)
							output += this.display_mask(value, mask, tableObject, rowToRender, columnObject, columnObject.localQueryDataType , displayColumn);
						break;
					case "value":
						output += this.display_value(value, tableObject, rowToRender, columnObject, columnObject.localQueryDataType , displayColumn);
						break;
					case "image":
						if(value != null || mask != null)
							output += this.display_image(mask, tableObject, rowToRender, columnObject);
						break;
					case "link":
						if(value != null || mask != null)
							output += this.display_link(mask, tableObject, rowToRender, columnObject);
						break;
					case "inlineGraph":
						if(value != null || mask != null)
							output += this.display_inlineGraph(tableObject, rowToRender, columnObject);
						break;
					default:
						if(value != null || mask != null)
							output += this.display_other(mask, columnObject.display[i].value, tableObject, rowToRender, columnObject);
				}
			} else output += columnObject.display[i].value;
			output += (displayItems > 1 ? "</td>" : "</div>");
		}
		if(displayItems > 1)
			output += "</tr></tbody></table>";
		return output;
	},
	
	getObject: function(displayItem, columnName, rowToRender, tableObject) {
		var columnObject = tableObject.baseTableData.components.column[columnName];
		if(!isDatabaseConnectionVersion(columnObject)) return;
		if(tableObject.isSummarized)
			if(!columnObject.isCubeAttribute)
				return;
		if(columnObject.Index == null) {
			columnObject.localQueryDataIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
			columnObject.localQueryType = tableObject.baseTableData.columnsInfo.type[columnObject.localQueryDataIndex];
			columnObject.localQueryDataType = DB2_DATA_TYPE_CLASSIFICATION[columnObject.localQueryType.toLowerCase()];
		}
		
		var value = tableObject.baseTableData.baseData[rowToRender][columnObject.localQueryDataIndex];
		var mask = null;
		
		if(value == null && columnObject.nullMask != null) {
			mask = columnObject.nullMask;
		} else if(columnObject.mask != null ) {
			if(columnObject.mask[value] != null)
				mask = columnObject.mask[value];
		}
		var displayObject = columnObject.components == null ? null : columnObject.components[displayItem];
		if(mask != null)
			if(mask[displayItem] != null)
				return mask[displayItem];
		return displayObject;
	},
	
	formatDuration: function(value, Options) {
		value=parseFloat(value);
		var valueDuration="";
		if(value>=60) {
			if(value>=3600) {
				if(value>=86440) {
					if(Options.toDuration=='D') return Math.round(value/86400).toString()+'D'; 
					valueTmp = Math.floor(value/86400);
					value=value-valueTmp*86400;
					valueDuration+=valueTmp.toString()+'D';
				}
				if(Options.toDuration=='H') return valueDuration+Math.round(value/360).toString()+'H'; 
				valueTmp = Math.floor(value/3600);
				value-=valueTmp*3600;
				valueDuration+=(valueTmp>9?'':'0')+valueTmp.toString()+'H';
			}
			if(Options.toDuration=='M') return valueDuration+Math.round(value/60).toString()+'M'; 
			valueTmp = Math.floor(value/60);
			value-=valueTmp*60;
			valueDuration+=(valueTmp>9?'':'0')+valueTmp.toString()+'M';
		}
		if(Options.toDuration=='S') return valueDuration+Math.round(value/60).toString()+'S'; 
		return valueDuration+(value>9?'':'0')+value.toFixed(6).toString();
	},
	
	formatnumber: function(value, Options) {
		if(Options == null) return value;
		value = Number(value);
		if(value == null) return null;
		if(Options.parseFloat) value = parseFloat(value);
		if(Options.parseInt) value = parseInt(value);
		
		if(Options.toExponentialVal != -1) value = value.toExponential(Options.toExponentialVal);
		
		if(Options.toFixedVal != -1) value = value.toFixed(Options.toFixedVal);
		
		if(Options.toPrecisionVal != -1) value = value.toPrecision(Options.toPrecisionVal);
		
		if(Options.toBaseVal != -1) value = value.toString(Options.toBaseVal);
		if(Options.toAbbreviated || Options.appendAbbreviated || Options.prependAbbreviated )
			valueAbbr=formatNumberToAbbreviated(value);
		if(Options.toDuration) value=this.formatDuration(value, Options);
		if(Options.separator) {
			var valueString=value.toString().split('.');
			value="";
			if(valueString[1]!=null) {
				value='.'+valueString[1].substr(0,3);
				for (var i=3;i<valueString[1].length;i+=3) {
					value+=Options.separator+valueString[1].substr(i,3);
				}
			} 
			len=valueString[0].length-1;
			value=valueString[0].substr(valueString[0].length-1,1)+value;
			for (var i=valueString[0].length-2;i>=0;i--) {
				value=valueString[0].substr(i,1)+((len-i)%3==0?Options.separator:'')+value;
			}
		}
		if(Options.toAbbreviated) value = valueAbbr;
		else if (Options.appendAbbreviated) value = ( isAbbreviated ? value + " ("+valueAbbr +")" : valueAbbr );
		else if(Options.prependAbbreviated) value = ( isAbbreviated ? valueAbbr + " ("+value+")" : valueAbbr );
		
		return Options.pre + value + Options.post;
	},
	
	getDisplayClass : function(columnObject) {
		switch(columnObject.fieldType) {
			case "n":
				return "table-Number";
			case "l":
				return "table-LOBText";
		}
		return "table-NormalText";
	},

	display_mask: function(value, mask, tableObject, rowToRender, columnObject, type , displayColumn) {
		if(tableObject.baseTableData.baseData == null) return;

		if(mask != null) {
			if(mask.mask != null) {
				value = mask.mask;
			} else if(columnObject.hide_Non_Maked_Value) {
				value = "";
			}
		}
		return this.display_value(value, tableObject, rowToRender, columnObject, type, displayColumn);
	},
	
	display_link: function(mask, tableObject, rowToRender, columnObject) {
		var icon = columnObject.components.link_icon != null ? columnObject.components.link_icon : "images/icon-help-contextual-light.gif";
		var link = columnObject.components.link;
		if(mask != null) {
			if(mask.link != null) {
				link = mask.link;
			} else if(columnObject.hide_Non_Maked_Value) {
				link = null;
			}
		}
		if(link == null)
			return "";
			
		return "<a onclick='OpenURLInFloatingWindow(\"" + link + "\")'><img border='0' src='" + icon + "'></a>";
	},
	
	display_image: function(mask, tableObject, rowToRender, columnObject) {
		var image = columnObject.components.image;
		
		if(mask != null) {
			if(mask.image != null) {
				image = mask.image;
			} else if(columnObject.hide_Non_Maked_Value) {
				image = null;
			}
		}
		if(image != null)
			return "<img border='0' src='" + image + "' />";
		return "";
	},
	
	display_other: function(mask, displayItem, tableObject, rowToRender, columnObject) {
		var displayObject = columnObject.components == null ? null : columnObject.components[displayItem];
		if(mask != null) {
			if(mask[displayItem] != null) {
				displayObject = mask[displayItem];
			} else if(columnObject.hide_Non_Maked_Value) {
				displayObject = null;
			}
		}
		if(displayObject != null) {
			if(displayObject.icon == null)
				displayObject.icon = columnObject.components[displayItem + "_icon"];
				
			var renderingClass = TABLE_COLUMN_RENDERING_MODULES.get(displayItem);
			if(renderingClass != null)
				return renderingClass.render(tableObject, rowToRender, displayObject, columnObject.name);
		}
		
		return "";
	},
	display_inlineGraph: function(tableObject, rowToRender, columnObject, type){
		var value = tableObject.baseTableData.baseData[rowToRender][tableObject.baseTableData.resultSetIndexByColumnName[columnObject.inline_histogram.columnName.toUpperCase()]];
		var flipColor = columnObject.inline_histogram.flipColor;
		var style = columnObject.inline_histogram.style;
		
		if(value == null) return "<font style='color:red;font-weight: bold;'>null</font>";
		if(value < 0) return ""; //PWK do not draw graph if -1
		
		var left = parseInt(value);
		left = left > 100 ? 100 : left;
		colorCoding = flipColor ? 100 - left : left;
	
		var right = 100 - left;
		var colour = "#00FF00";
		if(colorCoding <= 33) {
			var hexCode = (156+colorCoding*3).toString(16);
			var index = hexCode.indexOf('.');
			if(index > 0)
				hexCode = hexCode.substr(0,index);
			
			colour = "#00" + (hexCode.length == 1 ? "0" + hexCode : hexCode) + "00";
		} else if(colorCoding < 66) {
			var hexCode = (7.5*(colorCoding-33)).toString(16);
			var index = hexCode.indexOf('.');
			if(index > 0)
				hexCode = hexCode.substr(0,index);

			colour = "#" + (hexCode.length == 1 ? "0" + hexCode : hexCode) + "FF00";
		} else {
			var hexCode = (254 - (7.5*(colorCoding-66))).toString(16);
			if (hexCode=-1) 
				hexCode ="00";
			else {
				var index = hexCode.indexOf('.');
				if(index > 0)
					hexCode = hexCode.substr(0,index);
			}
			colour = "#FF" + (hexCode.length == 1 ? "0" + hexCode : hexCode) + "00";
		}
	
		var toreturn = '<table class="TableBar" style="width:100%;min-width: 100px"><tr><td><table style="' + style + ';width:100%;"><tr>';
		toreturn += '<td width="' + left + '%" bgcolor="' + colour + '" ></td><td width="' + right + '%" ></td></tr></table></td>';
		
		if(columnObject.fieldType != "bg_wo")
				toreturn += "<td align='right' style='width:10px;'>&nbsp;" + left.toFixed(0) + "%</td>";

		return toreturn + "</tr></table>";
		
	},
	display: {
		 "boolean"	: function(value) {return value=="1"||value=="t"?"True":'False';}
	 	,"html"		: function(value) {return value;}
	 	,"raw"		: function(value) {return value;}
	 	,"c"		: function(value, tableObject, rowToRender, columnObject, type , displayColumn) { return this.s(value, tableObject, rowToRender, columnObject, type , displayColumn,'pre','pre');}
	 	,"l"		: function(value, tableObject, rowToRender, columnObject, type , displayColumn) { return this.s(value, tableObject, rowToRender, columnObject, type , displayColumn);}
	 	,"s"		: function(value, tableObject, rowToRender, columnObject, type , displayColumn , whiteSpace , tag) {
	 			if(whiteSpace==null) whiteSpace='nowrap';
	 			if(tag==null) tag='span';
	 			if(displayColumn==null) displayColumn = tableObject.getDisplayColumn(tableObject,columnObject.name);
	 			var maxSize = (displayColumn==null ? LONG_FIELD_MAX : ( displayColumn['maxSize'] !=null && displayColumn['maxSize'] != "" ? displayColumn['maxSize'] : LONG_FIELD_MAX));
	 			if(value.length > maxSize && tableObject.baseTableData.detailedView != true)
	 				return "<table style='padding:0px;margin:0px;' cellpadding='0px' cellspacing='0px'><tr><tdstyle='padding:0px;margin:0px;'><"+tag+" style='white-space: "+whiteSpace+";'>" + value.substr(0,maxSize-3).escapeHTML() + "...</"+tag+"></td><image onclick='TABLE_COLUMN_RENDERING_MODULES.get(\"column\").showMore(\"" + tableObject.GUID + "\"," + rowToRender + ", \"" + columnObject.name + "\");' src='"+ IMAGE_BASE_DIRECTORY + "/icon-down-on.gif'/></td><td></tr></table>";
	 			if(value.length > maxSize)
	 				return String(value).escapeHTML();
	 			if(type == DB2_NUMBER)
	 				return "<"+tag+" style='white-space: nowrap'>" + value + "</"+tag+">";
	 			return "<"+tag+" style='white-space: "+whiteSpace+";'>" + String(value).escapeHTML() + "</"+tag+">";
	 		}
	 	,"yesNo"	: function(value) {return value=="y"||value=="1"?'Yes':"No";}
	},
	display_value: function(value, tableObject, rowToRender, columnObject, type , displayColumn) {
		if(tableObject.baseTableData.baseData == null) return;
		if(value === null || value === undefined)
		 	return "<font style='color:red;font-weight: bold;'>null</font>";
		if(this.display[columnObject.fieldType]!=null) 
			return this.display[columnObject.fieldType](value, tableObject, rowToRender, columnObject, type , displayColumn); 
		if(type == DB2_NUMBER)
			return "<span style='white-space: nowrap'>" + value + "</span>";
		return "<span style='white-space: nowrap;'>" + String(value).escapeHTML() + "</span>";
	},
	
	showMore : function(tableID, rowToRender, columnName) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		var columnObject = tableObject.baseTableData.components.column[columnName];
		
		if(columnObject.Index == null) {
			columnObject.localQueryDataIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
			columnObject.localQueryType = tableObject.baseTableData.columnsInfo.type[columnObject.localQueryDataIndex];
			columnObject.localQueryDataType = DB2_DATA_TYPE_CLASSIFICATION[columnObject.localQueryType.toLowerCase()];
		}
		
		var value = tableObject.baseTableData.baseData[rowToRender][columnObject.localQueryDataIndex];
		var mask = null;
		if(value == null && columnObject.nullMask != null)
			mask = columnObject.nullMask;
		else if(columnObject.mask != null ) {
			if(columnObject.mask[value] != null)
				mask = columnObject.mask[value];
		}
		if(mask != null)
			if(mask.mask != null)
				value = mask.mask;
		var div = document.createElement("div");
		div.innerText = div.textContent = value;
		show_GENERAL_BLANK_POPUP(null,div.innerHTML);	
	},
	
	//Indicates if this column type requiers column data to be returned in the general query
	containsColumnForQuery : true, // boolean
	//return a list of columns to be retrived which will be appended to the column section of the select statment
	columnQueryPortion : function(baseTableObject) { 
		var columnList = [];
		baseTableObject.grouping="";
		if(baseTableObject.components.column != null) {
			columns = $H(baseTableObject.components.column);
			columns.each(function(column) {
				if(!isDatabaseConnectionVersion(column.value)) return;
				if(column.value.sql_name == null) return;
				if(baseTableObject.isSummarized) 
					if(!column.value.isCubeAttribute) return;
				if(baseTableObject.isSummarized) {
					switch (column.value.measure) {
						case 'amount' :
							columnList.push("sum("+column.value.sql_name + ") AS " + column.key);
						 	return;
						case 'rate' :
							columnList.push("avg("+column.value.sql_name + ") AS " + column.key
							 			+ ",max("+column.value.sql_name + ") AS " + column.key+"_max"
							 			+ ",min("+column.value.sql_name + ") AS " + column.key+"_min"
							 			+ ",stddev("+column.value.sql_name + ") AS " + column.key+"_stddev"
							 			);
						 	return;
					}
					if(baseTableObject.summary[column.key]!=null) {
						var level=baseTableObject.summary[column.key]
					    	,columnNameRaw=baseTableObject.components.column[column.key.toUpperCase()].nameRaw
					    	,dimensionLevel=[];
						if(columnNameRaw!=null)
							dimensionLevel=getNodesByXPath(baseTableObject.sourceDOM,baseTableObject.sourceDOM,"/table/column[@name='"+columnNameRaw+"']/dimension/level[@id='"+level+"']");
						if(dimensionLevel.length==0) {
						    var dimensionTypeDOM=getDOMParsed('tableDefinitions/dimensions/'+column.value.dimension+'.xml',null,baseTableObject.retrieveTableData,baseTableObject);
							if(dimensionTypeDOM==null)
								throw 'Dimension type '+column.value.dimension+' not found';
							dimensionLevel=getNodesByXPath(dimensionTypeDOM,dimensionTypeDOM,"/dimension/level[@id='"+level+"']");
						}
						if(dimensionLevel.length!=1)
							throw 'Dimension level '+level+' not found or duplicated for column '+column.value.dimension ;
						var columnDetails = dimensionLevel[0].textContent;
						if(columnDetails==null || columnDetails.trim()=="") return;
					    columnDetails = columnDetails.replace(/\?/g,column.value.sql_name);
					    baseTableObject.grouping += (baseTableObject.grouping.length>0?',':'group by ')	 + columnDetails;
						columnList.push(columnDetails + " AS " + column.key);
					}
					return;
				}
				if(column.value.sql_name.toUpperCase() == column.key.toUpperCase()) {
					columnList.push(column.value.sql_name);
					return;
				}
				if(column.value.sql_name.substr(0,1) == '"')
					if(column.value.sql_name.substr(column.value.sql_name.length-1)=='"')
						if( column.value.sql_name.substr(1,column.value.sql_name.length-2) == column.key.toUpperCase()) {
							columnList.push(column.key);
							return;
						}
				columnList.push(column.value.sql_name + " AS " + column.key);
			});
		}
		
		return columnList.join();
	},
	processStyle: function(columnObject,valueIn) {
		if(columnObject.style == null) return "";
		var options = columnObject.style.options;
		if(options == null) return "";
		var option=null
		var value = columnDBTypeConvertValue((columnObject.localQueryType==null?columnObject.dataType:columnObject.localQueryType),valueIn);
		
		var optionLength = options.length;
		for(var i=0; i<optionLength; i++) {
			option=options[i];
			if(option.gteq != "" && option.lteq != "") {
				if(value >= option.gteq && value <= option.lteq)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.gt != "" && option.lt != "") {
				if(value > option.gt && value < option.lt)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.gt != "" && option.lteq != "") {
				if(value > option.gt && value <= option.lteq)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.gteq != "" && option.lt != "") {
				if(value >= option.gteq && value < option.lt)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.gteq != "") {
				if(value >= option.gteq)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.lteq != "") {
				if(value <= option.lteq)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.gt != "") {
				if(value > option.gt)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.lt != "") {
				if(value < option.lt)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.eq != "") {
				if(value == option.eq)
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			} else if(option.isnull != "") {
				if((value==null) == (option.isnull=="true"))
					return COLUMN_HIGHLIGHT_STYLE(option.style);
			}
		}
	}
});