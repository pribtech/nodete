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
TABLE_MANIPULATION_MODULES.set("Data_Export", {
	//When present this object should return a menu JSON object to be added to the top right table menu bar
	rowMouse2DownMenuObject: function(tableObject, menuArray, rowNumber) {
		if(!isDatabaseConnectionVersion(tableObject)) return menuArray;
		if( tableObject.baseTableData.isSummarized ) return menuArray;
		var menu = [];
		if( (tableObject.baseTableData.output==null ? true : (tableObject.baseTableData.output['DDL']==null ? true : tableObject.baseTableData.output['DDL']['generator']!='' ))) {
			menu.push({
					nodeType : "leaf",
					elementValue : 'add DDL/DML',
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Compare\").generateAll(" + tableObject.GUID + ",\"DDL\",\"insert\",null, \"" + rowNumber + "\");'"
				});
			menu.push({
					nodeType : "leaf",
					elementValue : 'drop DDL/DML',
					elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Compare\").generateAll(" + tableObject.GUID + ",\"DDL\",\"delete\",null, \"" + rowNumber + "\");'"
			});
		}
		if (tableObject.baseTableData.output!=null)		
			if (!Object.isArray(tableObject.baseTableData.output))		
				for (var name in tableObject.baseTableData.output) {
					if(name=="DDL") continue; 
					menu.push({
							nodeType : "leaf",
							elementValue : (tableObject.baseTableData.output[name].title==null?name:tableObject.baseTableData.output[name].title),
							elementAction : "onClick='TABLE_MANIPULATION_MODULES.get(\"Compare\").generateAll(" + tableObject.GUID + ",\"" + name + "\",\"no change\",null, \"" + rowNumber + "\");'"
						});
				}

		if(menu.length > 4) {
			menuArray.push({
							nodeType : "branch",
							elementValue : "Export",
							elementAction : null,
							elementSubNodes : menu,
							elementSubNodeDirection : HORIZONTAL
						});
		} else if(menu.length > 0) {
			menuArray.push({
							nodeType : "LINE",
							elementValue : "Export"
						});
			for (var i=0;i<menu.length;i++) 
				menuArray.push(menu[i]);
		}
		return menuArray;
	},

	panelLeftMenuObject: function(tableObject, menuArray) {
		if(IS_TOUCH_SYSTEM) return menuArray;
		if(!isDatabaseConnectionVersion(tableObject)) return menuArray;
		if( tableObject.baseTableData.isSummarized ) return menuArray;
		var menuID = "Data_Export";
		this.exportHeadingType='title';
		this.exportOutputType='csv';
		var output = "<table width='500px'>"
					+ "<tr><td>Type</td><td>"
					+ 		"<select onchange='TABLE_MANIPULATION_MODULES.get(\"" + menuID + "\").setParameter(\"exportOutputType\",this.value);'/>"
					+			'<option selected="selected" value="csv">csv - comma delimitered</option>'
					+			'<option value="html">html</option>'
					+			'<option value="xml">xml</option>'
					+		'</select>'
					+ 	'</td></tr>'
					+ "<tr><td>Heading</td><td>"
					+ 		"<select onchange='TABLE_MANIPULATION_MODULES.get(\"" + menuID + "\").setParameter(\"exportHeadingType\",this.value);'/>"
					+			'<option selected="selected" value="title">Title</option>'
					+			'<option value="column">Column Name</option>'
					+			'<option value="noHeading">No Heading</option>'
					+		'</select>'
					+ 	'</td></tr>'
					+ "</table>"
					+ "<table>"
					+ "<tr><input type='button' value='Generate' onclick='TABLE_MANIPULATION_MODULES.get(\"" + menuID + "\").output(" + tableObject.GUID + ");'/></tr>"
					+ this.getOutput(tableObject)
					+ "</table>";	
		var menuFloatingPanel = new floatingPanel(tableObject.elementUniqueID + "_" + menuID + '_Menu', 'RAW', output, tableObject.elementUniqueID + "_" + menuID + '_Menu_button', false, false);
		getPanel(tableObject.parentStageID, tableObject.parentWindowID, tableObject.parentPanelID).registerNestedObject(tableObject.elementUniqueID + "_" + menuID + '_Menu', menuFloatingPanel);
		menuFloatingPanel.draw();

		menuArray.push({
				nodeType : "leaf",
				elementID : tableObject.elementUniqueID + "_" + menuID + '_Menu_button',
				elementValue : "Export",
				elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + tableObject.elementUniqueID + "_" + menuID + '_Menu\').show_and_size(\'' + tableObject.elementUniqueID +"_" + menuID + '_Menu_button\');"'
		});
		return menuArray;
	
	},

	setParameter: function(name,value) {
		this[name]=value;
	},

	getOutput: function(tableObject) {
		var output = "<tr><input type='button' value='Generate add DDL/DML' onclick='TABLE_MANIPULATION_MODULES.get(\"Compare\").generateAll(" + tableObject.GUID + ",\"DDL\",\"insert\");'/></tr>"
					+ "<tr><input type='button' value='Generate remove DDL/DML' onclick='TABLE_MANIPULATION_MODULES.get(\"Compare\").generateAll(" + tableObject.GUID + ",\"DDL\",\"delete\");'/></tr>";
		if(tableObject.baseTableData.output==null) return output;
		if( Object.isArray(tableObject.baseTableData.output) ) return output;
		if(tableObject.baseTableData.output['DDL']!=null) 
			if(tableObject.baseTableData.output['DDL']['generator']=='') 
				var output="";		
		for (var name in tableObject.baseTableData.output) {
			if(name=="DDL") continue;
			output += "<tr><input type='button' value='" 
					+ (tableObject.baseTableData.output[name].title==null?name:tableObject.baseTableData.output[name].title) 
					+ "' onclick='TABLE_MANIPULATION_MODULES.get(\"Compare\").generateAll(" + tableObject.GUID + ",\"" + name + "\",\"no change\");'/></tr>";
		}
		return output;
	},
	
	output: function(tableID,outputType,headType) {
		var tableObject = GET_GLOBAL_OBJECT('list_table', tableID);
		if (tableObject.baseTableData.columnsInfo==null) {
			openModalAlert('No output');
			return;
		}
		if (tableObject.baseTableData.columnsInfo.name.length==0) {
			openModalAlert('no columns in output');
			return;
		}
		TABLE_MANIPULATION_MODULES.get("Compare").generateAllBase(tableObject
									,{"type":this.exportOutputType,"title":'no',"heading":this.exportHeadingType,"table":tableObject.baseTableData.tableName,"destination":"window"}
									,this.exportOutputType);
		return;
	}
});