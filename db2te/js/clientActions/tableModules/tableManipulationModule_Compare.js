/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010-2012 All rights reserved.
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

TABLE_MANIPULATION_MODULES.set("Compare", {
	//When present this object should return a menu JSON object to be added to the top right table menu bar
	panelLeftMenuObject: function(tableObject, menuArray) {
		if(tableObject.baseTableData.localTableDeffinition.enableCompare == false) return menuArray;
		if(tableObject.baseTableData.localTableDeffinition.compare!=null)
			if(tableObject.baseTableData.localTableDeffinition.compare['menu']!=null)
				if(tableObject.baseTableData.localTableDeffinition.compare['menu']!='yes')
					return menuArray;
		menuID = tableObject.GUID + "_Compare_Menu";
		this.callback="TABLE_MANIPULATION_MODULES.get('Compare')";
		var output = "<table width='100px'>"
					+ "</table>";
		var menuFloatingPanel = new floatingPanel(menuID, 'RAW', output, menuID + '_button', false, false);
		getPanel(tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID).registerNestedObject(menuID, menuFloatingPanel);
		menuFloatingPanel.draw();
		menuArray.push({
				nodeType : "leaf",
				elementID : menuID + '_button',
				elementValue : "Compare",
				elementAction : 'onClick="'+this.callback+'.getCompareList(\''+tableObject.GUID+'\');"'
		});
		return menuArray;
	},
	appendColumnDetails: function(compareDOM,base,columnsNode,columns,match) {
		for (var j=0; j<columns.length;j++) {
			i=columns[j];
			columnName='???unknown???'
			if (base.baseTableData.columnsInfo.name[i]==undefined) {
				for ( column in base.baseTableData.resultSetIndexByColumnName ) {
					if(base.baseTableData.resultSetIndexByColumnName[column]==i) {
						columnName=column;
						break;
					}
				}
			} else {
				try { columnName = this.getColumnDetails(base.baseTableData.components,base.baseTableData.columnsInfo.name[i]).title; }
				catch(e) { columnName=base.baseTableData.columnsInfo.name[i]; }
			}
			if(i<base.baseTableData.columnsInfo.name.length)
				columnsNode.appendChild(
					this.newColumn(
					     compareDOM
						,match
						,base.baseTableData.columnsInfo.name[i]
 						,columnName
  						,base.baseTableData.columnsInfo.displaySize[i]
  						,base.baseTableData.columnsInfo.scale[i]
                   	    ,base.baseTableData.columnsInfo.precision[i]
  						,base.baseTableData.columnsInfo.type[i]
                       	,base.baseTableData.columnsInfo.width[i]
                       	,this.getColumnDetails(base.baseTableData.components,base.baseTableData.columnsInfo.name[i]).editable
						)
					);
			else {
				for(columnName in base.baseTableData.components.column)
					if(base.baseTableData.components.column[columnName].localQueryDataIndex==i) break;
				columnDetails=base.baseTableData.components.column[columnName];
				columnsNode.appendChild(
					this.newColumn(
						 compareDOM
						,match
						,columnDetails.nameRaw
 						,columnDetails.title
  						,(columnDetails.displaySize==null? 100 : columnDetails.displaySize )       
  						,(columnDetails.scale==null? 100: columnDetails.scale )
                   	    ,(columnDetails.precision==null? 0: columnDetails.precision )
  						,(columnDetails.fieldType==null? "s": columnDetails.fieldType )
                       	,(columnDetails.width==null? 100: columnDetails.width ) 
                       	,false 
						)
					);
			}
		}
	},
	applyMask: function(GUID,baseData) {
		var base=this.getListTableGUID(GUID,'base table');
		if(base.compare==undefined) return;
		if(base.compare.mask==undefined) return;
		if(base.compare.mask.length==undefined) return;
		var mask=base.compare.mask;
		for (column in mask ) {
			if( mask[column].override==undefined ) continue; 
			if( mask[column].override==null ) continue; 
			for (var i= 0; i < base.baseTableData.columnsInfo.name.length; i++)
				if(base.baseTableData.columnsInfo.name[i]==column) break;
			value=mask[column].override;
			for( var r = 0; r < baseData.length; r++)
				baseData[r][i]=value;
		}
	},
	displayMask: function(GUID) {
		var base=this.getListTableGUID(GUID,'base table');
		var output = '<table><tbody><tr><button onClick="'+this.callback+'.getCompareList(' + GUID + ',false);">Compare List</button></tr></tbody>'
					+'<table style="position:static;" cellspacing="1" cellpadding="1" align="center" valign="center"><tbody>'
					+'<tr><th>Column</th><th>Compare</th><th>Override Value</th></tr>';
		if(base.compare==undefined) base.compare=new Object();;
		if(base.compare.mask==undefined) base.compare.mask=new Array;
		for (var i= 0; i < base.baseTableData.columnsInfo.name.length; i++)	{
			displaySize=base.baseTableData.columnsInfo.displaySize[i];
			width=base.baseTableData.columnsInfo.width[i];
			columnName=base.baseTableData.columnsInfo.name[i];
			mask=this.getMask(GUID,columnName);
			override=(mask.override==undefined ? '' : mask.override );
			checked=( mask.compare ? ' checked="checked"' : '' );
			disabled=( mask.disableCompareChange ? ' disabled="disabled"' : ' ' );
			if(displaySize>64) displaySize=64;
			output += '<tr><td>'+this.getColumnDetails(base.baseTableData.components,columnName).title+'</td>'
					+ '<td><input type="checkbox"' + checked+disabled + ' onchange="'+this.callback+'.setMaskCompare('+GUID+',\''+columnName+'\',this.checked);" /></td>'
					+ '<td>'+(width>128 ? '' : '<input value="'+override+'" type="text" size="' + displaySize + '" maxsize="' + width +'" onchange="'+this.callback+'.setMaskOverRide('+GUID+',\''+columnName+'\',this.value);"/>')+'</td>'
					+ '</tr>';
		}
		output+= '</tbody></table>';
		var compareMenu = this.getCompareMenu(GUID);
		compareMenu.setContent(output,'Compare Mask');
	},
	generateAll: function(baseGUID,type,dataType,xsl,rows) {
		try {
			this.generateAllBase(this.getListTableGUID(baseGUID,'base'),type,dataType,xsl,rows);
		} catch(e) {
			openModalAlert(e);
			return;
		}
	},
	generateAllBase: function(base,options,dataType,xsl,rows,action) {
	    if (typeof options == "string")
	    	options = this.getOptions(base,options);
	    if(options.xsl==null)
		    if(options.destination!=null)
		    	if(options.destination.substr(0,3)=='fo2')
		    		var type='fo2';
		if(type==null)
			type=options.type;
		if(base.baseTableData==undefined) {
			var output="";
			var optionsTemp=options;
			for(var i=0;i<base.length;i++) {
				optionsTemp.title=base[i].getBaseQuery();
				output+=this.generateAllBase(base[i],optionsTemp,dataType,xsl,rows,'return')+'\n';
			}
			this.sendDestination(null,options,output);
			return;
		}
		if(base.baseTableData.output!=undefined)
		    if (base.baseTableData.output[options.type.toUpperCase()]!= undefined )
				var parameterList=base.baseTableData.output[options.type.toUpperCase()].parameterList;
		if(parameterList!=null) {
			var content='';
			for(parameterPosition=0; parameterPosition < parameterList.length; parameterPosition++) {
			    var parameter = parameterList[parameterPosition];
			    switch (parameter.parameterType) {
			        case 'input' :
						content+='<tr><td>'+parameter.title==null?parameter.name:parameter.title+'</td><input type="text" size="40" name="'+parameter.name+'" value="'+parameter.value+'"/><td>'+'</td></tr>';
			            break;
			    	default:
						options[ parameter.name ] = retrieveParameter(parameter);
				}
			}
			if (content!='') {
			        workAreaId=saveWorkArea(
					      {'base':base,'type':type,'options':options,'dataType':dataType,'rows':rows,'action':action,'xsl':xsl}
			        	);
					var menuId = "parameter_Panel_" + getGUID();
					content = '<br/><table>' + content + '</table>'
							+ '<input type="button" value="OK" onclick="'
							+ this.callback + ".generateInputCallback(this,"+workAreaId+")"
							+ '"/>'
							+ '<input type="button" value="Cancel" onclick="'+ this.callback + '.generateCancel('+workAreaId+')"/>';
					show_GENERAL_BLANK_POPUP('Options', content, null);
					return;
			}
		}
		this.generateAllBaseCallback(getDOMParsed(this.getXSL(base,options.type,xsl),null,this.generateAllBaseCallback,this,base,options,dataType,rows,action)
									,base,options,dataType,rows,action)
	},

	generateCancel: function(workAreaId) {
	   	deleteWorkArea(workAreaId);
		if(GENERAL_BLANK_POPUP != null)
			GENERAL_BLANK_POPUP.close();
	},

	generateInputCallback: function(okNode,workAreaId) {
	  	var workArea=getWorkArea(workAreaId);
	  	if(workArea!=null ) {
		  	var inputTags = okNode.parentElement.getElementsByTagName("INPUT");
		  	for(var i=0;i<inputTags.length;i++) {
		   		if(inputTags[i].name == null) continue;
		   		workArea.options[ inputTags[i].name ] = inputTags[i].value;
		  	}
		  	this.generateAllBaseCallback(
  		  		 getDOMParsed(this.getXSL(workArea.base,workArea.type,workArea.xsl),null,this.generateAllBaseCallback,this,workArea.base,workArea.options,workArea.dataType,workArea.rows,workArea.action)
  				,workArea.base,workArea.options,workArea.dataType,workArea.rows,workArea.action
  				);
  		}
		if(GENERAL_BLANK_POPUP != null)
			GENERAL_BLANK_POPUP.close();
	},

	generateAllBaseCallback: function(xsl,base,options,dataType,rows,action) {
		if(xsl==null) return;
		var type=options.type;
 		var compareDOM = getDOMParsed("<differences/>");
		var differencesNode = compareDOM.childNodes[0];
		
		if(base.baseTableData.primaryKeys==undefined)
			var colMatchIndex=[];
		else
			var colMatchIndex=this.getColumnIndex(base.baseTableData.primaryKeys,base);
		var colCompareIndex=[];

		if(base.baseTableData.resultSetIndexByColumnName==undefined) {
			for (var j=0; j<base.baseTableData.columnsInfo.num;j++)
				colCompareIndex[colCompareIndex.length]=j;
		} else
			for ( column in base.baseTableData.resultSetIndexByColumnName ) {
				i=base.baseTableData.resultSetIndexByColumnName[column];
				for (var j=0; j<colMatchIndex.length;j++)
					if(colMatchIndex[j]==i) break;
				if (j<colMatchIndex.length) continue;
				colCompareIndex[colCompareIndex.length]=i;
			}

		var columnsNode=compareDOM.createElement("columns");
		differencesNode.appendChild(columnsNode);
		this.appendColumnDetails(compareDOM,base,columnsNode,colMatchIndex,'y');
		this.appendColumnDetails(compareDOM,base,columnsNode,colCompareIndex,'n');

		if (rows==undefined) {
			if (base.baseTableData.baseData==undefined) 
				for( var i = 0; i < base.baseTableData.data.length; i++)
					this.newRow(compareDOM,base,base.baseTableData.data[i],base.baseTableData.data[i],dataType,differencesNode,colMatchIndex,colCompareIndex); 
			else
				for( var i = 0; i < base.baseTableData.baseData.length; i++) 
					this.newRow(compareDOM,base,base.baseTableData.baseData[i],base.baseTableData.baseData[i],dataType,differencesNode,colMatchIndex,colCompareIndex); 
		}
		else {
			var rowIndex=new Array();
			for (var i=0;i<base.baseTableData.baseData.length;i++) {
				var id=document.getElementById(base.GUID+'.rowNumber.'+i);
				if(id!=null)
					if(id.style.borderColor=='red') 
						rowIndex[rowIndex.length]=i;
			}
			if(rowIndex.length==0) rowIndex[0]=rows;
			for( var j = 0; j < rowIndex.length; j++) {
				i=rowIndex[j];
				this.newRow(compareDOM,base,base.baseTableData.baseData[i],base.baseTableData.baseData[i],dataType,differencesNode,colMatchIndex,colCompareIndex); 
			}
		}
		
		if(action==null) {
			action='';
			if(base.baseTableData.output!=undefined)
				if(base.baseTableData.output[type]!=undefined)
					action=(base.baseTableData.output[type]['action']==undefined?'':base.baseTableData.output[type]['action']);
		}
	
		var outputMethods=getNodesByXPath(xsl,xsl,'stylesheet/output/@method');
		var method=(outputMethods.length>0?outputMethods[0].contentText:null);

		if (options.destination!=null)
			destination = options.destination;
		else if(base.baseTableData.output==undefined?true:base.baseTableData.output[type]==undefined) 
			destination = 'adhoc';
		else
			destination = (base.baseTableData.output[type]['destination']==undefined?'adhoc':base.baseTableData.output[type]['destination']);
		switch (destination.toLowerCase()) {
			case 'float' :
				break;
			case 'adhoc' :
				method='text';
		}
		try {
			switch (action) {
				case 'return' :
					var output=getXSLTransformed(compareDOM
							,this.getXSL(base,type,xsl)
							,options
							);
					return (method=='text'?output.firstChild.firstChild.data:getXMLString(output));
				case '' :
				case 'xsl' :
					var output=getXSLTransformed(compareDOM
									,this.getXSL(base,type,xsl)
									,options
									);
					this.sendDestination(base,options,(method=='text'?output.firstChild.firstChild.data:getXMLString(output)));
					break;
				default:
					this.processAction(null,base,type,action,compareDOM,xsl,method);
			}
		} catch (e) {openModalAlert(e);return;}
	},
	generateUpdates: function(GUID,xsl) {
		var base=this.getListTableGUID(GUID,'base table');
		getDOMParsed(xsl,null,this.generateUpdatesCallback,this,GUID);
	},
	generateUpdatesCallback: function(xslDOM,GUID) {
		var base=this.getListTableGUID(GUID,'base table');
		try {
			var output=getXSLTransformed(base.compareDOM
									,xslDOM
									,(base.schema==null	?{"table":base.table}
												:{"schema":base.schema 
												 ,"table":base.table
									 })
									);
		} catch (e) {openModalAlert(e);return;}

		miniLinkLoader({action:'ADHOC', termChar:'@', LoadSQLData:output.firstChild.firstChild.data});
	},
	getColumnDetails: function(components,column) {
		if(column==null)
			throw 'Column name null';
		if(components==null)
			return {title: column, editable:true}; 
		if(components.column[column]) return components.column[column];
		if(components.dynamiccolumnsimple!=null)
			if(components.dynamiccolumnsimple[column]) return components.dynamiccolumnsimple[column];
		throw 'TABLE_MANIPULATION_MODULES Compare - Cannot find column details for: '+ column ;
	},
	getColumnIndex: function(columnList,tableList) {
		if (tableList==null) tableList=this;
		if (columnList instanceof Array) 
			groupingArray=columnList;
		else 
			var groupingArray=columnList.split(",");
		groupIndex=[];
		if(tableList.baseTableData.resultSetIndexByColumnName==null)
			throw "No output";
		for (var j=0; j<groupingArray.length;j++) {
			try{
				groupIndex[j]=tableList.baseTableData.resultSetIndexByColumnName[groupingArray[j]];
			} catch(e) {
				throw "TABLE_MANIPULATION_MODULES compare getColumnIndex column "+groupingArray[j]+" not found in table";
			}
		}
		return groupIndex; 
	},
	getCompareList: function(GUID,show) {
		var compareMenu = this.getCompareMenu(GUID);
		var tableObjects = GET_TABLE_LIST_SAME(GUID);
		var output="<table><tbody>";
		if (tableObjects.length==0)
			output += "<tr>No similar table list open</tr>";
		else {
			output += '<tr><button onClick="'+this.callback+'.displayMask(' + GUID + ');">Mask</button></tr>'
					+ '</tbody></table><table><tbody>'
					+ '<tr><td align="center">Unique Id.</td><td align="center">Connection</td></tr>'
					+ '<tr></tr>';
			for (var i=0;i<tableObjects.length;i++) {
				output += '<tr onMouseOver="this.bgColor=\'#00FFFF\';" onMouseOut="this.bgColor=\'#FFFFFF\';" onMouseDown="'+this.callback+'.getDifferences('+GUID+','+tableObjects[i].GUID+');">'
						+ 	'<td align="right">' + tableObjects[i].GUID + '</td>'
						+ 	'<td align="right">' + tableObjects[i].pageCallParameters.USE_CONNECTION + '</td>'
						+ '</tr>';
			}
		}
		output+='</tbody></table>';
		compareMenu.setContent(output,'Compare Choose Target');
		if (show!==undefined)
			if (!show) return
		compareMenu.show_and_size(GUID + '_Compare_Menu_button')
	},
	getCompareMenu: function(GUID) {
		var compareMenu = FLOATINGPANEL_activeFloatingPanels.get(GUID + '_Compare_Menu');
		if(compareMenu==null) throw "Compare menu no longer exists";
		return compareMenu;
	},
	getDifferences: function(baseGUID,otherGUID) {
		var base = this.getListTableGUID(baseGUID,'base');
	    getDOMParsed(this.getXSL(base,'compare'),null,this.getDifferencesCallback,this,baseGUID,otherGUID);
	},
	getDifferencesCallback: function(baseCompareXslDOM,baseGUID,otherGUID) {
		var compareDOM = getDOMParsed("<differences/>");
		var differencesNode = compareDOM.childNodes[0];
		var compareMenu = this.getCompareMenu(baseGUID);
		var output="<table style='width:100px;height:100px;position:static;'cellspacing='0' cellpadding='0' align='center' valign='center'><tbody><tr><td><img style='float:none;' src='images/loadingpage.gif'/></td></tr></tbody></table>";
		compareMenu.setContent(output,'Compare Differences Checking');
		output="<table style='position:static;'cellspacing='1' cellpadding='1' align='center' valign='center'><tbody>";
		sameCnt=0;
		updateCnt=0;
		insertCnt=0;
		deleteCnt=0;
		try {
			var base = this.getListTableGUID(baseGUID,'base');
			var other = this.getListTableGUID(otherGUID,'compare target');
			var colsTot=base.baseTableData.columnsInfo.name.length;
			if(colsTot!=other.baseTableData.columnsInfo.name.length)
				throw "Number of columns different between compared tables so can't be same table or version of table";

			var columnsNode=compareDOM.createElement("columns");
			differencesNode.appendChild(columnsNode);
			var colMatchIndex=this.getColumnIndex(base.baseTableData.primaryKeys,base);
			var colCompareIndex=[];

			for (var i= 0; i <base.baseTableData.columnsInfo.name.length; i++)	{
				for (var j=0; j<colMatchIndex.length;j++) 
					if(colMatchIndex[j]==i) break;
				if (j<colMatchIndex.length) continue;
				mask=this.getMask(baseGUID,base.baseTableData.columnsInfo.name[i]);
				if(mask.compare!=undefined)
					if(!mask.compare) continue;
				colCompareIndex[colCompareIndex.length]=i;
			}
			
			var otherData = other.baseTableData.baseData.clone();
			var baseData = base.baseTableData.baseData.clone(); 
			this.applyMask(baseGUID,baseData);
			if (colMatchIndex.length>0) {
				var thisObject=this;
				otherData.sort(function(a,b){return thisObject.rowMatch(a,b,colMatchIndex)});
				baseData.sort(function(a,b){return thisObject.rowMatch(a,b,colMatchIndex)});
			}
			this.appendColumnDetails(compareDOM,base,columnsNode,colMatchIndex,'y');
			this.appendColumnDetails(compareDOM,base,columnsNode,colCompareIndex,'n');
			var rowBase;
			var rowOther=null;
			var otherIndex=0;
			var	rowMatchOrder=-1;
			
			for( var i = 0; i < baseData.length; i++) {
				rowBase=baseData[i];
				for(otherIndex; otherIndex<otherData.length;otherIndex++) {
					rowOther=otherData[otherIndex];
					rowMatchOrder=this.rowMatch(rowBase,rowOther,colMatchIndex);
					if(rowMatchOrder<=0) break;
					insertCnt++;
					this.newRow(compareDOM,base,null,rowOther,'insert',differencesNode,colMatchIndex,colCompareIndex); 
				}
				if(otherIndex>=otherData.length) 
						rowMatchOrder=-1;
				if(rowMatchOrder<0) {
					deleteCnt++;
					if(colMatchIndex.length>0) 
						this.newRow(compareDOM,base,rowBase,null,'delete',differencesNode,colMatchIndex,colCompareIndex); 
					else
						this.newRow(compareDOM,base,rowBase,null,'delete',differencesNode,colCompareIndex,[]); 
					continue;
				}
				colDiffIndex=[];
				for( var j = 0; j < colCompareIndex.length; j++) {
					c=colCompareIndex[j];
					if(rowBase[c]!=rowOther[c])  
						colDiffIndex[colDiffIndex.length]=c;
				}
				if (colDiffIndex.length>0) {
					if(colMatchIndex.length>0) {
						updateCnt++;
						this.newRow(compareDOM,base,rowBase,rowOther,'update',differencesNode,colMatchIndex,colDiffIndex);
					} else {
						deleteCnt++;
						this.newRow(compareDOM,base,rowBase,null,'delete',differencesNode,colCompareIndex,[]); 
						insertCnt++;
						this.newRow(compareDOM,base,null,rowOther,'insert',differencesNode,colMatchIndex,colCompareIndex); 
					}
				} else sameCnt++;
				otherIndex++;
			}
			for(otherIndex; otherIndex<otherData.length;otherIndex++) {
				rowOther=otherData[otherIndex];
				insertCnt++;
				this.newRow(compareDOM,base,null,rowOther,'insert',differencesNode,colMatchIndex,colCompareIndex); 
			}
			
			if ( (insertCnt+updateCnt+deleteCnt)>0 ) {
				if (this.getXSL(base,'DDL')!=null)
					if (this.getXSL(base,'DDL')!="")
						output += '<tr><button onClick="'+this.callback+'.generateUpdates(' + baseGUID+');">Generate Updates</button></tr></tbody></table>'
								+ '<table><tbody>';
				output += getXMLString(getXSLTransformed(compareDOM,baseCompareXslDOM));
			}
			base.compareDOM=compareDOM;
		} catch (e) {
			output+="<tr><td>"+e+"</td></tr>";
		}
		output+="</tbody></table><table><tbody>"
				+"<tr><td>Total rows compared:</td><td>"+(sameCnt+insertCnt+updateCnt+deleteCnt)+"</td></tr>"
				+"<tr><td>Inserts:</td><td>"+insertCnt+"</td></tr>"
				+"<tr><td>Updates:</td><td>"+updateCnt+"</td></tr>"
				+"<tr><td>Deletes:</td><td>"+deleteCnt+"</td></tr>"
				+"</tbody></table>";
		compareMenu.setContent(output,'Compare Differences');
	},
	getListTableGUID: function(GUID,msg) {
		if(GUID==null) throw "Table not specified for "+msg;
		if(typeof GUID =='object') return GUID;
		var guid = GET_GLOBAL_OBJECT('list_table', GUID);
		if(guid==null) throw "Table no longer exists for "+msg;
		return guid;
	},
	getMask: function(GUID,column) {
		var base=this.getListTableGUID(GUID,'base table');
		if(base.compare==undefined) base.compare=new Object();;
		if(base.compare.mask==undefined) base.compare.mask=new Array;
		if(base.compare.mask[column]==undefined) base.compare.mask[column]=new Object;
		if(base.compare.mask[column].compare==undefined) 
			base.compare.mask[column].compare=(base.baseTableData.components.column[column]==null?false:base.compare.mask[column].compare=base.baseTableData.components.column[column].compareDefault);
		if(base.compare.mask[column].disableCompareChange==undefined) base.compare.mask[column].disableCompareChange=false;
		for (var j= 0; j < base.baseTableData.primaryKeys.length; j++)	{
			if(base.baseTableData.primaryKeys[j]==column) {
				base.compare.mask[column].disableCompareChange=true;
				base.compare.mask[column].compare=false;
				break;
			}
		}
		return base.compare.mask[column];
	},
	getOptions: function(base,options) {
		if (typeof options == 'object') {
			if (options.type==undefined) options.type='insert';
		} else { 
			type=(options==null ? 'insert' : options);
			var ACTIVE_DATABASE_CONNECTION_OBJECT;
			var options={};
			if(base.table==undefined) 
				options.table="table???";
			else if(base.schema==null) {
					table=base.baseTableData.getBaseQuery().split('.');
					if(table.length>1) {
						options.schema=( table[0].substr(0,1)=='"' ? table[0].substr(1,table[0].length-2) : table[0].toUpperCase() );
						options.table =( table[1].substr(0,1)=='"' ? table[1].substr(1,table[1].length-2) : table[1].toUpperCase() );
					} else
						options.table =( table[0].substr(0,1)=='"' ? table[0].substr(1,table[1].length-2) : table[0].toUpperCase() );
			} else
				options={"schema": base.schema
						,"table": base.table
						};
			options.connection=getActiveDatabaseConnection();
			options.databaseDriver=getActiveDatabaseDriver();
			options.database=getActiveDatabaseName();
			options.databaseVersion=ACTIVE_DATABASE_CONNECTION_VERSION;
			options.databaseDBMS=ACTIVE_DATABASE_DBMS;
			options.databaseFixpak=ACTIVE_DATABASE_CONNECTION_FIXPAK;
			options.type=type;
		}
		if(base.baseTableData==undefined) return options;
		if(base.baseTableData.output==undefined)  return options;
		if(base.baseTableData.output[options.type]==undefined) return options;
		var parameterList=base.baseTableData.output[options.type].parameterList;
		if(parameterList==null) return options;
		for(parameterPosition=0; parameterPosition < parameterList.length; parameterPosition++)
		    switch (parameterList[parameterPosition].parameterType) {
		        case 'input' :
		            break;
		    	default:
					options[ parameterList[parameterPosition].name ] = retrieveParameter(parameterList[parameterPosition]);
			}
		return options;
	},
	getXSL: function(base,name,xsl) {
		if(xsl!=null) return xsl;
		if(base.baseTableData.output!=null)
			if(name!=null)
				if(base.baseTableData.output[name]!=null)
					if(base.baseTableData.output[name]['generator']!=null)
						return base.baseTableData.output[name]['generator'];
		switch (name) {
			case 'compare' : return 'XSL/compareTableHtml.xsl';
			case 'fo2' : return 'XSL/compareTable2FO.xsl';
		}
		return "XSL/compareTableUpdates.xsl";
	},
	newColumn: function(xmlDOM,match,name,title,displaySize,scale,precision,type,width,editable) {
		colElement=xmlDOM.createElement("column");
		colElement.setAttribute("match",match);
		colElement.setAttribute("name",name);
		colElement.setAttribute("title",title);
		colElement.setAttribute("displaySize",displaySize);
		colElement.setAttribute("scale",scale);
		colElement.setAttribute("precision",precision);
		colElement.setAttribute("type",type);
		colElement.setAttribute("width",width);
		colElement.setAttribute("editable",editable);
		return colElement; 
	},
	newData: function(xmlDOM,column,oldValue,newValue) {
		var dataElement=xmlDOM.createElement("data");
		dataElement.setAttribute("name",column);
		if(oldValue!=null)
			dataElement.appendChild(xmlDOM.createTextNode(oldValue));
		if(newValue!=null) {
			newElement=xmlDOM.createElement("new");
			dataElement.appendChild(newElement);
			newElement.appendChild(xmlDOM.createTextNode(newValue));
		}
		return dataElement;
	},
	newKey: function(xmlDOM,name,value) {
		newElement=xmlDOM.createElement("key");
		newElement.setAttribute("name",name);
		newElement.appendChild(xmlDOM.createTextNode(value));
		return newElement; 
	},
	newRow: function(xmlDOM,base,row,newRow,action,node,keys,columns) {
		rowElement=xmlDOM.createElement("row");
		rowElement.setAttribute("action",action);
		for (var i=0; i<keys.length;i++) {
			j=keys[i];
			rowElement.appendChild(this.newKey(xmlDOM,base.baseTableData.columnsInfo.name[j],action=='insert'?newRow[j]:row[j]));
		}
		for (var i=0; i<columns.length;i++) {
			j=columns[i];
			rowElement.appendChild(this.newData(xmlDOM,base.baseTableData.columnsInfo.name[j],row==null?null:row[j],newRow==null?null:newRow[j]));
		}
		node.appendChild(rowElement);
	},
	processActionCallbackActionBlockType: function(actionBlockTypeXslDOM,blockData,GUID,type,actionName,processStackDOM,xsl,method) {
	  this.processAction(blockData,GUID,type,actionName,processStackDOM,xsl,method,actionBlockTypeXslDOM);
	},
	processAction: function(blockData,GUID,type,actionName,processStackDOM,xsl,method,actionBlockTypeXslDOM) {
		if (blockData==null) {
			var action = GLOBAL_TE_SCRIPT_STORE.get(actionName);
			if(action==null) throw 'action "'+action+'" not found';
			var base=this.getListTableGUID(GUID,'processAction');
			var TEScriptMain = new actionScript(base.baseTableData.tableName + '_' + action, action, null, base.parentStageID, base.parentWindowID, base.parentPanelID, base.parentPageID);
			var workingBlock = $H();
			var actionBlock = {
					 'GUID'			:base
					,'action'		:action
					,'actionName'	:actionName
					,'type'			:type
					,'xslDOM'		:xsl
					,'callback'		: this.callback+'.processAction'
					,'processStack'	: processStackDOM
					,'returnValue'	: ""
					,'outputMethod'	: method
					,'super'		: TEScriptMain
					}
			workingBlock.set('$tableObject', this);
			workingBlock.set('$actionBlock', actionBlock);
			if(base.baseTableData.localTableDeffinition.useConnectWithTag != null)
				workingBlock.set('useConnectWithTag', base.baseTableData.localTableDeffinition.useConnectWithTag);
		} else {
			var workingBlock=blockData.workingBlock
				,actionBlock=workingBlock.get('$actionBlock');
		    if (actionBlockTypeXslDOM==null && GUID != null) {
		     	getDOMParsed(this.getOptions(this.getListTableGUID(GUID,'processAction')
		     								,actionBlock.type)
		     				,null
		    				,this.processActionCallbackActionBlockType
		    				,this
							,blockData,GUID,type,actionName,processStackDOM,xsl,method
							);
				return;
		    }
			var actionReturn=blockData.actionResults.get(actionBlock.actionName);
			if (actionReturn.returnCode==false || actionReturn.returnCode=="false" || actionReturn.returnCode=="ERROR") {
				openModalAlert("compare.processAction, action: "+actionBlock.actionName+" error: "+actionReturn.returnValue);
				return;
			}
			var base=this.getListTableGUID(actionBlock.GUID,'processActionProcessResults');
			try {
				returnValue=getXSLTransformed(actionReturn.returnValue
									,actionBlock.xslDOM
									,(actionBlockTypeXslDOM==null?workingBlock._object:actionBlockTypeXslDOM)
									);
			} catch (e) {
				openModalAlert("compare.processAction, action: "+actionBlock.actionName+" error: "+e);
				return;
			}
			if(actionBlock.outputMethod=='text')
				actionBlock.returnValue+=returnValue.firstChild.firstChild.data;
			else
				actionBlock.returnValue+=getXMLString(returnValue);
		}
		var table=actionBlock.processStack;
		var row=table.childNodes[0].childNodes[1];
		if(row==null) {
			this.sendDestination(actionBlock.GUID,actionBlock.type,actionBlock.returnValue);
			return;
		}

		var cols=row.childNodes;
		for (i=0;i<cols.length;i++) 
			workingBlock.set(cols[i].getAttribute('name'),cols[i].firstChild.textContent);
		table.childNodes[0].removeChild(row); 
 		var parameterList=base.baseTableData.output[actionBlock.type].parameterList;
 		if(parameterList!=null)
 			for(parameterPosition=0; parameterPosition < parameterList.length; parameterPosition++)
 				workingBlock.set(parameterList[parameterPosition].name , retrieveParameter(parameterList[parameterPosition], workingBlock, workingBlock));
		actionBlock.super.callAction(workingBlock, '', actionBlock.callback, null);
	},
	rowMatch: function(rowA,rowB,colMatchIndex) {
		for (var i= 0; i < colMatchIndex.length; i++) {
			j=colMatchIndex[i];
			if( rowA[j] >  rowB[j] ) return 1;
			if( rowA[j] <  rowB[j] ) return -1;
		}
		return 0;
	},
	sendDestination: function(GUID,options,output) {
		if (typeof options == 'object') {
			var type=(options.type==undefined?'insert':options.type);
			var destination=(options.destination==null?null:options.destination);
			var typeClass=(options.class==null?null:options.class);
			var title=(options.title==null?null:options.title);
		} else 
			var type=options;
		if(GUID!=null) {
			var base=this.getListTableGUID(GUID,'sendDestination');
			if(base.baseTableData.output==undefined?true:base.baseTableData.output[type]==undefined) {
				if(title==null) var title="Generated Output for "+type;
				if(destination==null) var destination='adhoc';
				if(typeClass==null) var typeClass='SQL';
			} else {
				if(title==null) var title=(base.baseTableData.output[type]['title']==null?"Generated Output":base.baseTableData.output[type]['title']);
				if(destination==null) var destination = (base.baseTableData.output[type]['destination']==undefined?'adhoc':base.baseTableData.output[type]['destination']);
				if(typeClass==null) var typeClass = (base.baseTableData.output[type]['class']==undefined?'SQL':base.baseTableData.output[type]['class']);
			}
		}
		switch (destination.toLowerCase()) {
			case 'float' :
				menu=this.getCompareMenu(base.GUID);
				menu.setContent(output,title);
				menu.show_and_size();
				break;
			case 'window' :
				dataExportedWindow = open('','displayWindow','width=800,height=400,left=60,top=60,scrollbars=yes');
				dataExportedWindow .document.open();
				dataExportedWindow .document.write(output);
				dataExportedWindow .document.close(); 				
				break;
			case 'spreadsheet' :
				window.open('data:application/vnd.ms-excel;charset=utf-8;Content-Disposition: inline; filename=data.csv,'+ encodeURIComponent(output), "child");
				break;
			case 'msword' : 
				window.open('data:application/msword;charset=utf-8;Content-Disposition: inline; filename=data.txt,'+ encodeURIComponent(output), "child");
				break;
			case 'text' : 	
				window.open('data:application/plain;charset=utf-8;Content-Disposition: inline; filename=data.txt ,'+ encodeURIComponent(output), "child");
				break;
		    case 'pdf' : 	
				window.open('data:application/pdf;Content-Disposition: inline; filename=data.pdf;base64,'+ output, "child");
				break;
		    case 'fo2pdf' :
		    	this.convertFO(GUID,options,output);
		    	break; 	
			case 'adhoc' :
			default:
				if(typeClass=='SHELL')
					miniLinkLoader({action:'ADHOC', scriptMode:'SHELL', termChar:';' ,LoadSQLData:'-- Title: '+title+'\n'+output});
				else
					miniLinkLoader({action:'ADHOC', termChar:'@' ,LoadSQLData:'-- Title: '+title+'\n'+output});
		}
	},
	
	setMaskCompare: function(GUID,column,compare) {
		this.getMask(GUID,column).compare=compare;
	},
	
	setMaskOverRide: function(GUID,column,override) {
		this.getMask(GUID,column).override=override;
	},
	
	convertFO: function(GUID,options,output) {
		var thisObject = this;
		POSTDATA = new Object();
		POSTDATA.returntype 	= 'JSON';
		POSTDATA.action         = 'convertFO';
		POSTDATA.fo             = output;
		POSTDATA.base64         = 'true'
		POSTDATA.options        = options;
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null)
					throw 'An invalid JavaScript object was returned';
				if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false)
					throw result.returnValue==""?"Error but no message":result.returnValue;
				options.destination='pdf';
				thisObject.sendDestination(transport.request.parameters.GUID,transport.request.parameters.options,result.returnValue)
			},
			onComplete: function(transport) {
			}
		});
	}
});