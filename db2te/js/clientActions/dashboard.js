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
/*
	The has array TABLE_COLUMN_RENDERING_MODULES contains a list of function to render columns of a given type. 
	the function definition is as follows:
	function(object baseTableData, int rowToRender, columnRenderingInfo)
	*/
var TABLE_COLUMN_RENDERING_MODULES = $H();

var TABLE_ROW_MODULES = $H();

var TABLE_MANIPULATION_MODULES = $H();

CORE_CLIENT_ACTIONS.set("dashboard",Class.create(CORE_CLIENT_ACTIONS.get("list_table"), {
	initialize: function($super, callParameters) {
		this.dashbordName = callParameters.dashboardName != null ? callParameters.dashboardName : "default";
		this.dashbordName = this.dashbordName.toUpperCase();
		$super(callParameters);
	},

	renderTableData: function() {
		this.clearError();

		var renderingClass = TABLE_COLUMN_RENDERING_MODULES.get('column');
		
		var keyComponent = this.baseTableData.components['column'][this.dashbordCore.keycolumn];
		
		var numOfGauges = this.dashbordCore.gauges.length;
		
		for(currentRow = 0; currentRow < this.baseTableData.rowsReturned; currentRow++)
		{
			var keyValueIndex = this.baseTableData.resultSetIndexByColumnName[this.dashbordCore.keycolumn.toUpperCase()];
			for(i=0; i<numOfGauges; i++)
			{
				var holder = $(this.elementUniqueID + "_dashboardComponentContent_" + i + "_valueContainer_"+ this.baseTableData.baseData[currentRow][keyValueIndex]);
				if(holder == null)
				{
					var container = $(this.elementUniqueID + "_dashboardComponentContent_" + i);
					container.insert("<tr><td>" + this.baseTableData.baseData[currentRow][keyValueIndex] + "</td><td id='" + this.elementUniqueID + "_dashboardComponentContent_" + i + "_valueContainer_"+ this.baseTableData.baseData[currentRow][keyValueIndex] + "'></td></tr>");
					holder = $(this.elementUniqueID + "_dashboardComponentContent_" + i + "_valueContainer_"+ this.baseTableData.baseData[currentRow][keyValueIndex]);
				}
				holder.update(renderingClass.render(this, currentRow, this.baseTableData.components['column'][this.dashbordCore.gauges[i].dataColumn]));
			}
		}
		
	},
	
	draw: function() {

		var thisObject = this;
		var sortDirection = null;
		var sortIndex = null;
		
		if(this.baseTableData.components['dashboard'] == null)
		{
			this.setErrorMessage("No dashboards were defined.");
			return;
		}
		
		this.dashbordCore = this.baseTableData.components['dashboard'][this.dashbordName];
		
		var numOfGauges = this.dashbordCore.gauges.length;
		
		var i = 0;
		
		if(this.dashbordCore == null)
		{
			this.setErrorMessage("Dashboard of name '" + this.dashbordName + "' was not found.");
			return;	
		}
		
		var output = "<div id='" + this.elementUniqueID + "_mainDisplayArea' style='width:100px;height:100px;overflow:hidden;position:static;'>";

			output += "<div id='" + this.elementUniqueID + "_tableErrorDisplayArea' style='display:none;height:200px;overflow-x: auto;overflow-y: auto;position:static;'>";
			output += "</div>";	

			output += "<div id='" + this.elementUniqueID + "_displayData' style='height:200px;overflow-x: auto;overflow-y: auto;position:static;'>";

			for(i=0; i<numOfGauges; i++)
			{
				output += "<table style='border-style:outset;border-width:4px;width:200px;' cellpadding='0' cellspacing='0' id='" + this.elementUniqueID + "_dashboardComponent_" + i + "'>";
				output += "<tr><td>";
				output += "<table style='border-style:solid;border-width:2px;background-color:lightgrey;width:100%;'><tr><td><nobr>";
				output += this.dashbordCore.gauges[i].title;
				output += "</nobr></td><td align='right'>";
				output += this.dashbordCore.gauges[i].info != null ? "<img style='float:none' onMouseUp=\"stopPropagation(event);\" onMouseDown='activeTables.get(\"" + thisObject.elementUniqueID + "\").displayInfoForGuage(" + i + ");' src=\"images/info.gif\"/>" : "";
				output += "</td></tr></table>";
				output += "</td></tr><tr><td><table id='" + this.elementUniqueID + "_dashboardComponentContent_" + i + "'>";
				output += "</table></td></tr>";
				output += "</table>";
			}
			
			output += "</div>";
		output += "</div>";

		getWindow(this.parentStageID, this.parentWindowID).WindowContainers.get( this.parentPanelID ).setContent(output, this.baseTableData.localTableDeffinition.pluralName, this.baseTableData.localTableDeffinition.description, null, null);


	},
	
	displayInfoForGuage: function(id) {
		show_GENERAL_BLANK_POPUP(null, "<div style='padding:10px;width:350px;'>" + this.dashbordCore.gauges[id].info + "</div>");
	}

}));