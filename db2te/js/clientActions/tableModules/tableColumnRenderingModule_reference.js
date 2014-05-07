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
TABLE_COLUMN_RENDERING_MODULES.set("reference", {
	
	groupTitle: "References",
	
	columnCheck: function(baseTableObject, columnName) {
		var referenceObject = baseTableObject.components.reference[columnName];
		referenceObject.title = referenceObject.title == null ? "" : referenceObject.title;
		referenceObject.titleNoQuots = referenceObject.title.replace("'", "&#39;").replace('"', "&quot;");
		if( baseTableObject.isSummarized ) actionObject.includeInSubMenu =  false;
		return true;
	},
	
	render: function(tableObject, rowToRender, referenceObject, maskingColumn) {
		if(!isDatabaseConnectionVersion(referenceObject)) return "";
		if( tableObject.baseTableData.isSummarized ) return "";
		return "<img style='display:inline;float:none;' alt='&#8658;' title='" + referenceObject.titleNoQuots + "' onclick='TABLE_COLUMN_RENDERING_MODULES.get(\"reference\").load(event, " + tableObject.GUID + "," + rowToRender + ", \"" + referenceObject.name + "\", \"" 
				+ (maskingColumn == null ? "" : maskingColumn) 
				+ "\");' class='tableAction' border='0' src='" 
				+ (referenceObject.icon != null ? referenceObject.icon : "images/sout.gif") 
				+ "'>";
	},
	
	load: function(event, tableID, row, referenceName, maskingColumn) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if(tableObject == null) return false;
		
		var frameString = tableObject.baseTableData.tableCallParameters.refTarget != null ? tableObject.baseTableData.tableCallParameters.refTarget : "detail";
		
		var referenceObject = 	(maskingColumn == ""
								? tableObject.baseTableData.components.reference[referenceName]
								: TABLE_COLUMN_RENDERING_MODULES.get('column').getObject("reference", maskingColumn, row, tableObject)
								);

		if(!isDatabaseConnectionVersion(referenceObject)) return;
		var parameters = {$parentGUID:this.GUID};
		var stageSting = tableObject.parentStageID;
		var windowString = tableObject.parentWindowID;
		if (referenceObject.frame) frameString = referenceObject.frame;
		if (referenceObject.stage) stageSting = referenceObject.stage;
		if (referenceObject.window) windowString = referenceObject.window;
	
		switch (referenceObject.reftype.toLowerCase()) {
			case "table":
				parameters.displayColumnsSet = referenceObject.displayColumnsSet;
				parameters.table = referenceObject.refvalue;
				parameters.action = "list_table";
				break;
			case "displayrow":
				parameters.$columnsSet = referenceObject.displayColumnsSet;
				parameters.$table = referenceObject.refvalue;
				parameters.action = "display";
				break;
			case "chart":
				parameters.$table = referenceObject.refvalue;
				parameters.action = "chart";
				break;
			case "graph":
				parameters.$table = referenceObject.refvalue;
				parameters.action = "graphYUI";
				break;
			case "action":
				parameters.action = referenceObject.refvalue;
				break;
			default:
				throw "Unknown reference type: "+referenceObject.reftype;
		}
		parameters.$extendedTitle='';
		referenceObject.ref.each(function(ref) {
			var column = ref.local_column_name != null ? ref.local_column_name.toUpperCase() : "";
			var key = ref.foreign_column_name;
			if (tableObject.baseTableData.resultSetIndexByColumnName[column] != null)  
				parameters[key] = tableObject.baseTableData.baseData[row][tableObject.baseTableData.resultSetIndexByColumnName[column]]; 
			else if(ref.value != null)
				parameters[key] = ref.value;
			else if(ref.expression!=null)
				parameters[key] = tableObject.getExpressionResult(ref.expression,tableObject.baseTableData,row);
			if(ref.comparetype != null)
				parameters['compare' + key] = ref.comparetype;
			parameters.$extendedTitle+=' '
									+( column=="" ? key
											:	( tableObject.baseTableData.components.column[column]==null ? column
													:	( tableObject.baseTableData.components.column[column].title==null ? column
														:tableObject.baseTableData.components.column[column].title).replace("/^\s+/g", "").replace("/\s+$/g", "")
													)
									)+ ( ref.comparetype==null ? ': ' : ' ' + ref.comparetype.replace("/^\s+/g", "").replace("/\s+$/g", "")+' ')
									+ ( parameters[key]==null ? '' : (typeof(parameters[key])=='string'?parameters[key].replace("/^\s+/g", "").replace("/\s+$/g", ""):parameters[key])
									);
		});


		if(event==null) return parameters;
		if(frameString.toLowerCase() == 'main' && windowString.toLowerCase() == '_blank') {
			loadPage({
				target	: windowString,
				raiseToTop:"",
				windowStage : stageSting,
				content	 : {
							type:"splitPane",
							direction:"h",
							panelA: {
								type:"panel",
								name:"main",
			 					PrimaryContainer:true,
								ContentType:"LINK",
								data:{
										type:"ACTION",
										data:{
											parameters:parameters	
										}
								}
							},
							panelB: {
								type:"panel",
								name:"detail",
								PrimaryContainer:false,
								ContentType:"RAW",
								data:""
							}
				}});
		} else {
			if(tableObject.baseTableData.refTarget != null)
				parameters.refTarget = tableObject.baseTableData.tableCallParameters.refTarget;		
				
			loadLink({
				type:"leaf",
				target: frameString,
				window: windowString,
				windowStage: stageSting,
				connectionRequired: false,
				formList: null,
				type: "LINK",
				data: {
						parameters: parameters
					}
				});
		}
		Event.stop(event);
		return false;
	},
	
	getDisplayClass : function(refernceObject) {
		return "table-Object";
	}
});