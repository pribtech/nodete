/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012-2013 All rights reserved.
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
TABLE_MANIPULATION_MODULES.set("Data_Summarize", {
	panelLeftMenuObject: function(tableObject, menuArray) {
		var columns=getNodesByXPath(tableObject.baseTableData.sourceDOM,tableObject.baseTableData.sourceDOM,'//column[count(@dimension)>0 or count(./dimension)>0]');
		if(columns.length==0) return menuArray;
		var menuDimensions = [];
		for(var i=0;i<columns.length;i++) { 
		    var dimensionType=columns[i].getAttribute('dimension');
		    if(dimensionType==null) {
		    	this.dimensionMenu(null,tableObject,columns[i],menuDimensions)
		    	continue;
		    }
			var dimensionDOM=getDOMParsed('tableDefinitions/dimensions/'+dimensionType+'.xml',null,this.getDOMParsedCallback,this,dimensionType);
			if(dimensionDOM!=null)
				this.dimensionMenu(dimensionDOM,tableObject,columns[i],menuDimensions);
		}
		menuDimensions.push({
			  nodeType : "leaf"
			 ,elementID : tableObject.elementUniqueID + '_Summarize_unset_button'
			,elementValue : 'No Summarization'
			,elementAction : 'onClick="TABLE_MANIPULATION_MODULES.get(\'Data_Summarize\').unsetSummarization(\'' + tableObject.GUID  + '\');"'
			});
		menuArray.push({
			 nodeType : "branch"
			,elementValue : "Summarize"
			,elementAction : ""
			,elementSubNodes : menuDimensions			
			});
		return menuArray;
	},

	dimensionMenu: function(dimensionDOM,tableObject,column,menuDimensions) {
		var menuDimensionLevels = [];
		var columnName=column.getAttribute('name');
		if(dimensionDOM==null) {
			var title=getNodesByXPath(tableObject.baseTableData.sourceDOM,column,'./dimension/@title');
			if(title.length==0)	title=getNodesByXPath(tableObject.baseTableData.sourceDOM,column,'title');
			var titleText=(title.length==0?columnName:title[0].textContent);
			for (var i=0;i<menuDimensions.length;i++) 
				if(menuDimensions[i].elementValue==titleText) return;
			var dimensionLevels=getNodesByXPath(tableObject.baseTableData.sourceDOM,column,"./dimension/level");
		} else
			var titleText=tableObject.baseTableData.components.column[columnName.toUpperCase()].title
				,dimensionLevels=getNodesByXPath(dimensionDOM,dimensionDOM,"/dimension/level");
		for(var l=0;l<dimensionLevels.length;l++)
			menuDimensionLevels.push({
				 nodeType : "leaf"
				,elementID : tableObject.elementUniqueID + '_Summarize_'+columnName+'_button'
				,elementValue : this.getLevelTitle(dimensionLevels[l])
				,elementAction : 'onClick="TABLE_MANIPULATION_MODULES.get(\'Data_Summarize\').setSummarization(\'' + tableObject.GUID  + '\',\'' + columnName.toUpperCase() + '\',\'' + dimensionLevels[l].getAttribute('id') + '\');"'
				});
		menuDimensions.push({
			 nodeType : "branch"
			,elementValue : titleText
			,elementAction : ""
			,elementSubNodes : menuDimensionLevels			
			});
	},
	getLevelTitle: function(level) {
		return coalesce(level.getAttribute('title'),level.getAttribute('id'));
	},
	getLevelId: function(level) {
		return level.getAttribute('id');
	},
	getColumnNode: function(tableObject,columnName) {
		return getNodeByXPath(tableObject.baseTableData.sourceDOM,tableObject.baseTableData.sourceDOM,"/table/column[@name='"
				+tableObject.baseTableData.components.column[columnName].nameRaw
				+"']");
	},
	getDimensionDepth: function(tableObject,dimensionColumn) {
		var level=this.getDimensionLevel(tableObject,dimensionColumn);
		if(level==null) return null;
		return  level.getAttribute('depth');
	},
	getDimensionTitle: function(tableObject,columnObject) {
		if(typeof columnObject == "string")
			var dimensionColumn=column
				,column=this.getColumnNode(tableObject, columnObject)
				,title=getNodesByXPath(tableObject.baseTableData.sourceDOM,column,'./dimension/@title');
		else
			var dimensionColumn=columnObject.getAttribute('name')
				,column=columnObject
				,title=getNodesByXPath(tableObject.baseTableData.sourceDOM,column,'./dimension/@title');
		if(title.length!=0) return title[0].textContent;
		title=getNodesByXPath(tableObject.baseTableData.sourceDOM,column,'title');
		return (title.length==0?dimensionColumn:title[0].textContent);
	},
	columnHeaderInterface: function(displayColumn ,thisObject) {
		if(!thisObject.baseTableData.isSummarized) return "";
		if(displayColumn.type!="column") {
			displayColumn.isSummaryHidden=true;
			return "";
		}
		var cellObject=thisObject.baseTableData.components[displayColumn.type][displayColumn.name];
		displayColumn.isSummaryHidden = !(cellObject.isCubeAttribute);
		if(displayColumn.isSummaryHidden) return "";
		if(thisObject.baseTableData.summary[displayColumn.name]==null) {
			displayColumn.isSummaryHidden=(cellObject.measure=="");
			return "";
		}
		var level=thisObject.baseTableData.summary[displayColumn.name]
			,columnNameRaw=thisObject.baseTableData.components.column[displayColumn.name].nameRaw
			,dimensionLevel=getNodesByXPath(thisObject.baseTableData.sourceDOM,thisObject.baseTableData.sourceDOM,"/table/column[@name='"+columnNameRaw+"']/dimension/level[@id='"+level+"']");
		if(dimensionLevel.length==0) {
		    var dimensionTypeDOM=getDOMParsed('tableDefinitions/dimensions/'+thisObject.baseTableData.components.column[displayColumn.name].dimension+'.xml',null,this.getDOMParsedCallback,this,thisObject.baseTableData.components.column[displayColumn.name].dimension);
			dimensionLevel=getNodesByXPath(dimensionTypeDOM,dimensionTypeDOM,"/dimension/level[@id='"+level+"']");
		}
		if(dimensionLevel[0].textContent==null || dimensionLevel[0].textContent.trim()=="") {      // All
			displayColumn.isSummaryHidden=true;
			return "";
		}
		displayColumn.RevisedTitle=thisObject.baseTableData.summary[displayColumn.name];
		return "";
	},
	getDOMParsedCallback: function(dom,name) {
		alert('timing issue or not found with load of shared dimension: '+name);
	},
	getLowerDimensionLevels: function(tableObject,dimensionColumn,depth) {
		if(depth==null) depth=this.getDimensionDepth(tableObject, dimensionColumn);
		if(depth==null) return [];
		return this.getDimensionLevelsDepth(tableObject, dimensionColumn, depth-1);
	},
	getHigherDimensionLevels: function(tableObject,dimensionColumn,depth) {
		if(depth==null) depth=this.getDimensionDepth(tableObject, dimensionColumn);
		if(depth==null) return [];
		return this.getDimensionLevelsDepth(tableObject, dimensionColumn, depth+1);
	},
	getDimensionLevelsDepth: function(tableObject,dimensionColumn,depth) {
		return this.getDimensionLevelXpath(tableObject, dimensionColumn, "[@depth='"+depth+"']");
	},
	getDimensionLevel: function(tableObject,dimensionColumn,levelOffset) {
		return this.getBaseDimensionLevel(tableObject.baseTableData, dimensionColumn, levelOffset);
	},
	getBaseDimensionLevel: function(baseTableData,dimensionColumn,levelOffset) {
		var level=baseTableData.summary[dimensionColumn.toUpperCase()];
		if(level==null) return null;
		return this.getBaseDimensionLevelXpath(baseTableData, dimensionColumn, "[@id='"+level+"']"+coalesce(levelOffset,""))[0];
	},
	getBaseDimensionLevelXpath: function(baseTableData,dimensionColumn,xpath) {
		if(baseTableData.summary[dimensionColumn.toUpperCase()]==null) return [];
		var dimensionLevels=getNodesByXPath(baseTableData.sourceDOM,baseTableData.sourceDOM,"/table/column[@name='"+dimensionColumn+"']/dimension/level"+xpath);
		if(dimensionLevels.length>0) return dimensionLevels;
		var dimensionLevels=getNodesByXPath(baseTableData.sourceDOM,baseTableData.sourceDOM,"/table/column[@name='"+dimensionColumn+"']/dimension");
		if(dimensionLevels.length>0) return [];
		var dimensionTypeDOM=getDOMParsed('tableDefinitions/dimensions/'+baseTableData.components.column[dimensionColumn.toUpperCase()].dimension+'.xml',null,this.getDOMParsedCallback,this,baseTableData.components.column[dimensionColumn.toUpperCase()].dimension);
			dimensionLevel=getNodesByXPath(dimensionTypeDOM,dimensionTypeDOM,"/dimension/level"+xpath);
		return dimensionLevels;
	},
	getDimensionLevelXpath: function(tableObject,dimensionColumn,xpath) {
		return this.getBaseDimensionLevelXpath(tableObject.baseTableData, dimensionColumn, xpath);
	},
	drillDownRowDimension: function(GUID, rowNumber, dimension, level) {
		var tableObject=GET_GLOBAL_OBJECT('list_table',GUID);
		if(level==null) return;
		if(tableObject.baseTableData.summaryFiltering==null) tableObject.baseTableData.summaryFiltering=[];
		if(tableObject.baseTableData.summaryFiltering[dimension]==null) tableObject.baseTableData.summaryFiltering[dimension]=[];
		var currentLevel=this.getBaseDimensionLevel(tableObject.baseTableData,dimension);
		if(currentLevel.textContent==null || currentLevel.textContent.trim()=="")
			tableObject.getDisplayColumns().each(function(Column) {Column.isSummaryHidden=false;});
		else
				tableObject.baseTableData.summaryFiltering[dimension].push(
						{"level": tableObject.baseTableData.summary[dimension.toUpperCase()]
							,value:tableObject.baseTableData.baseData[rowNumber][tableObject.getColumn(tableObject.baseTableData,dimension)]
						});
		tableObject.baseTableData.summary[dimension.toUpperCase()]=level;
		tableObject.draw();
		tableObject.retrieveTableData();
	},
	cellMouse2DownMenuObject: function(tableObject, menuArray, rowNumber, columnType, columnName) {
		if(!tableObject.baseTableData.isSummarized) return menuArray;
		if(tableObject.baseTableData.summary.size==0) return menuArray;
		var columns=getNodesByXPath(tableObject.baseTableData.sourceDOM,tableObject.baseTableData.sourceDOM,'//column[count(@dimension)>0 or count(./dimension)>0]');
		if(columns.length==0) return menuArray;
		var menuDimensions = [];
		for(var i=0;i<columns.length;i++) {
			var dimensionColumn=columns[i].getAttribute('name');
			var levels=this.getLowerDimensionLevels(tableObject, dimensionColumn);
			for(var j=0;j<levels.length;j++)
				menuDimensions.push({
					nodeType : "leaf"
						,elementValue : "Drill " + this.getDimensionTitle(tableObject, columns[i]) + " to "+this.getLevelTitle(levels[j])
						,elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Data_Summarize\").drillDownRowDimension(" + tableObject.GUID + ",\"" + rowNumber + "\",\"" + dimensionColumn + "\",\""+this.getLevelId(levels[j])+"\")'"
					});
		}
		if(menuDimensions.length==0) return menuArray;
		menuArray.push({
			 nodeType : "LINE"
			,elementValue : "Summary Dimensions"
			});
		for(var i=0;i<menuDimensions.length;i++)
			menuArray.push(menuDimensions[i]);
		return menuArray;
	},
	setSummarization: function(GUID,dimensionName,dimensionLevel) {
		var tableObject=GET_GLOBAL_OBJECT('list_table',GUID);
		if(tableObject.baseTableData.summary==null) tableObject.baseTableData.summary=[];
		tableObject.baseTableData.summary[dimensionName]=dimensionLevel;
		tableObject.baseTableData.isSummarized=true;
		tableObject.getDisplayColumns().each(function(Column) {Column.isSummaryHidden=false;});
		tableObject.draw();
		tableObject.retrieveTableData();
	},
	unsetSummarization: function(GUID) {
		var tableObject=GET_GLOBAL_OBJECT('list_table',GUID);
		tableObject.baseTableData.isSummarized=false;
		tableObject.baseTableData.summary=[];
		delete tableObject.baseTableData.summaryFiltering;
		tableObject.getDisplayColumns().each(function(Column) {Column.isSummaryHidden=false;});
		tableObject.draw();
		tableObject.retrieveTableData();
	},
	add2Where: function(joiner) {
		if(!this.isSummarized) return "";
		if(this.summaryFiltering==null) return "";
		var predicate=[];
		for(var dimensionColumn in this.summaryFiltering) {
			if(typeof this.summaryFiltering[dimensionColumn] == "function") break;
			if(this.summaryFiltering[dimensionColumn].length==0) continue;
			var filter=this.summaryFiltering[dimensionColumn][this.summaryFiltering[dimensionColumn].length-1];
			var level=TABLE_MANIPULATION_MODULES.get("Data_Summarize").getBaseDimensionLevelXpath(this, dimensionColumn, "[@id='"+filter.level+"']")[0];
			if (level==null) continue;
			predicate.push((joiner==null?level.textContent:level.getAttribute("id"))+" = '"+filter.value+"'")
		}
		return predicate.join(joiner==null?' and ':joiner);
	},
	getTitle: function() {
		if(!this.baseTableData.isSummarized) return;
	    var dimensionTitle=[]
	    	,Data_Summarize=TABLE_MANIPULATION_MODULES.get("Data_Summarize");
		for(var dimensionColumn in this.baseTableData.summary) {
			if(typeof this.baseTableData.summary[dimensionColumn] == "function") break;
			dimensionTitle.push(Data_Summarize.getDimensionTitle(this,dimensionColumn)
				+  " by "+ Data_Summarize.getLevelTitle(Data_Summarize.getBaseDimensionLevel(this.baseTableData,this.baseTableData.components.column[dimensionColumn].nameRaw))
				);
		}
		return dimensionTitle.join(', ') +" "+ Data_Summarize['add2Where'].apply(this.baseTableData,[', ']);
	},
	getRowTitle: function(rowNumber) {
		var rowTitle=[]
    		,Data_Summarize=TABLE_MANIPULATION_MODULES.get("Data_Summarize");
		for(var dimensionColumn in this.baseTableData.summary) {
			if(typeof this.baseTableData.summary[dimensionColumn] == "function") break;
			var level=Data_Summarize.getBaseDimensionLevel(this.baseTableData,this.baseTableData.components.column[dimensionColumn].nameRaw);
			if(level.textContent==null || level.textContent.trim()=="")      // All
				continue;
			rowTitle.push( Data_Summarize.getLevelTitle(level)
					+  ": "+ this.baseTableData.baseData[rowNumber][this.getColumn(this.baseTableData,dimensionColumn)]
			);
		}
		return rowTitle.join(', ');
	}
});