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
CORE_CLIENT_ACTIONS.set("getHeadlessTableForm",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_getHeadlessForm", "list_table");

		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		this.pageCallParameters = callParameters;
		this.schema = callParameters.schema;
		this.table = callParameters.table;
		this.showParameters = callParameters.showParameters != null ? callParameters.showParameters : true;
		this.showTitles = callParameters.showTitles != null ? callParameters.showTitles : true;
		this.firstLoad = true;
		this.localTableDeffinition = null;
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID).registerNestedObject(this.elementUniqueID, this);
		
		ObjectManager.getTableDefinition(this.table, this.schema, 
			"getPanel('" + this.parentStageID + "', '" + this.parentWindowID + "', '" + this.parentPanelID + "').nestedObject.get('" + this.elementUniqueID + "').setTableDefinition", 
			"getPanel('" + this.parentStageID + "', '" + this.parentWindowID + "', '" + this.parentPanelID + "').nestedObject.get('" + this.elementUniqueID + "').setErrorMessage", 
			"getPanel('" + this.parentStageID + "', '" + this.parentWindowID + "', '" + this.parentPanelID + "').nestedObject.get('" + this.elementUniqueID + "').setLoading"
			);

	},
	
	setTableDefinition: function(tableDefinitionObject){
		this.localTableDeffinition = tableDefinitionObject;
		this.draw();
	},
	
	setLoading: function(OnOrOff) {
		if(OnOrOff)
			getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:100%;height:100%;position:static;' cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center' valign='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr><tr><td align='center'><h2>Loading table definition</h2></td></tr></table>", 'Loading table definition', null, 'hidden');
	},
	
	setErrorMessage: function(message) {
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent("<table style='width:100%;height:100%'><tr><td align='center'><h2>" + message + "</h2></td></tr></table>", 'Error', null, 'hidden');
	},
	
	draw: function() {
		var thisObject = this
			,output = "";
		if(this.localTableDeffinition.parameters.length > 0 && this.showParameters) {
			var i = 0
				,parm = null;
			output += "<div>";
			if(this.localTableDeffinition.components.columns != null)
				output += this.showTitles ? "<h3>Parameters</h3>" : "";
			output += "<table class='tableHeader' id='" + this.elementUniqueID + "_title' style='padding:0px;margin:0px;' cellpadding='0px' cellspacing='0px' >";

			for(i=0; i < this.localTableDeffinition.parameters.length; i++) {
				parm = this.localTableDeffinition.parameters[i];
				var paramType = parm.type.toLowerCase();
				var disabled = coalesce(parm.disabled,'false').toLowerCase();
				disabled = disabled == "true" ? "disabled " : "";
				
				var visible = (coalesce(parm.visible,'false').toLowerCase()!="false");
				
				output += "<tr" + (!visible ? " style='display:none;' " : "") +	">" 
						+	"<td><NOBR>" + parm.title + "</NOBR>";
				if(parm.info != null)
					output += "\n<img src=\"images/info.gif\" style='display:block;vertical-align: middle;' onclick='show_GENERAL_BLANK_POPUP(null, \"<div style=\\\"padding:10px;width:350px\\\">\" + getPanel(\"" + this.parentStageID + "\", \"" + this.parentWindowID + "\", \"" + this.parentPanelID + "\").nestedObject.get(\"" + this.elementUniqueID + "\").localTableDeffinition.parameters[" + i + "].info + \"</div>\") '/>";	
				output +=	"</td><td>";
				
				var value = this.pageCallParameters[parm.name];
				
				if(value == null)
					value = "";	
				else if(Object.isNumber(value))
					value = value;
				else if(Object.isString(value))
					value = value.escapeHTML();
				else
					value = escape(parm.value);
				if(paramType == "lob" || paramType == 'l' || paramType == "clob")
					output += "<TEXTAREA " + disabled + "NAME='" + parm.name + "' COLS=50 ROWS=6>" + value + "</TEXTAREA>";
				else
					output += "<input " + disabled + "size=50 type='text' value='" + value + "' name='" + parm.name + "'/>";
				output += "</td></tr>";
				}
			output += 		"<td style='width:100px;'/></tr>"
					+ 	"</table>"
					+ "</div>";
		}	
		output += "<div>"
				+ "<table class='tableHeader' id='" + this.elementUniqueID + "_title' style='padding:0px;margin:0px;' cellpadding='0px' cellspacing='0px' >";

		var columns = $H(this.localTableDeffinition.components.columns);
		columns.each(function(column) {
					output += "<tr><td><NOBR>"+column.title.escapeHTML()+"</NOBR></td>"
							+ 	"<td>"
							+ 		"<table id='" + thisObject.elementUniqueID + "_" + column.name + "_editableSelect' style='width:400px;border:1px solid black;' cellpadding='0px' cellspacing='0px'>"
							+ 			"<tbody>" 
							+				"<tr>"
							+					"<td>"
							+						"<input id='" + thisObject.elementUniqueID + "_" + column.name + "_editableSelect_textInput' type='text' style='border:none;width:100%;display:block;' name='" + column.name + "' value='" + (this.pageCallParameters[column.name] != null ? this.pageCallParameters[column.name].escapeHTML() : "") + "'/>"
							+ 					"</td>"
							+					"<td id='" + thisObject.elementUniqueID + "_" + column.name + "_editableSelect_buttonHolder' style='width:0px;'>"
							+					"</td>"
							+				"</tr>"
							+			"</tbody>"
							+		"</table>"
							+ 	"</td>"
							+ "</tr>";
			});

		output += 	"</table>"
				+ "</div>";
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, this.localTableDeffinition.pluralName, null, 'hidden');
	}

}));