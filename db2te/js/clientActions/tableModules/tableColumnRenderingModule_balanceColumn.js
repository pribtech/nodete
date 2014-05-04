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
TABLE_COLUMN_RENDERING_MODULES.set("balancecolumn", {
	
	groupTitle: "Balance Columns",
	
	render: function(tableObject, rowToRender, columnObject) {
		
		if(columnObject.primaryColumnIndex == null) 
		{
			columnObject.primaryColumnIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.primaryColumn];
		}
		
		if(columnObject.averageColumnIndex == null) 
		{
			columnObject.averageColumnIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.averageColumn];
		}
		
		if(columnObject.upperBoundColumnIndex == null) 
		{
			columnObject.upperBoundColumnIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.upperBoundColumn];
		}
		
		
		var primaryColumnValue = tableObject.baseTableData.baseData[rowToRender][columnObject.primaryColumnIndex];
		var averageColumnValue = tableObject.baseTableData.baseData[rowToRender][columnObject.averageColumnIndex];
		var upperboundColumnValue = tableObject.baseTableData.baseData[rowToRender][columnObject.upperBoundColumnIndex];
		
		output = "<table style='padding:0px;margin:0px;height:100%;width:100%;min-width:" + columnObject.minWidth + "px;'><tbody><tr><td style='padding:0px;width:50%;'>";
		
		if(primaryColumnValue < 0)
		{
			output += "<table style='height:100%;padding:0px;margin:0px;width:100%;height:10px;'><tbody><tr><td style='padding:0px;width:100%;background-color:red;'></td></tr></tbody></table>";
		}
		else if(primaryColumnValue < averageColumnValue)
		{
			var ratio = 100 - parseInt((primaryColumnValue / averageColumnValue)*100);
			output += "<table style='height:100%;padding:0px;margin:0px;width:100%;height:10px;'><tbody><tr><td style='width:" + (100-ratio) + "%;'></td><td style='padding:0px;width:" + ratio + "%;background-color:" + this.getColorCode(ratio) + ";'></td></tr></tbody></table>";
		}

		output += "</td><td style='padding:1px;width:1px;background-color:black'></td>";
		
		if(columnObject.lableColumn != null)
		{
			output += "</td><td align='center' style='padding:0px;" + (columnObject.lableColumnWidth != null ? "width:" + columnObject.lableColumnWidth + "px;" : "" ) + "'>";
			
			output += TABLE_COLUMN_RENDERING_MODULES.get("column").render(tableObject, rowToRender, tableObject.baseTableData.components.column[columnObject.lableColumn]);

			output += "</td><td style='padding:1px;width:1px;background-color:black'></td>";
		}

		output += "<td style='padding:0px;width:50%;'>";	

		if(primaryColumnValue < 0)
		{
			output += "<table style='height:100%;padding:0px;margin:0px;width:100%;height:10px;'><tbody><tr><td style='padding:0px;width:100%;background-color:red;'></td></tr></tbody></table>";
		}
		else if(primaryColumnValue > averageColumnValue)
		{
			var ratio = parseInt(((primaryColumnValue-averageColumnValue) / (upperboundColumnValue-averageColumnValue))*100);
			output += "<table style='height:100%;padding:0px;margin:0px;width:100%;height:10px;'><tbody><tr><td style='width:" + ratio + "%;background-color:" + this.getColorCode(ratio) + ";'></td><td style='width:" + (100-ratio) + "%;'></td></tr></tbody></table>";
		}
		
		output += "</td></tr></tbody></table>";
		
		return output;
	},
	
	getColorCode: function(colorCoding) {

		if(colorCoding <= 33)
		{
			var hexCode = (156+colorCoding*3).toString(16);
			var index = hexCode.indexOf('.');
			if(index > 0)
				hexCode = hexCode.substr(0,index);
			
			return "#00" + (hexCode.length == 1 ? "0" + hexCode : hexCode) + "00";
		}
		else if(colorCoding < 66)
		{
			var hexCode = (7.5*(colorCoding-33)).toString(16);
			var index = hexCode.indexOf('.');
			if(index > 0)
				hexCode = hexCode.substr(0,index);

			return "#" + (hexCode.length == 1 ? "0" + hexCode : hexCode) + "FF00";
		}
		else
		{
			var hexCode = (254 - (7.5*(colorCoding-66))).toString(16);
			var index = hexCode.indexOf('.');
			if(index > 0)
				hexCode = hexCode.substr(0,index);

			return "#FF" + (hexCode.length == 1 ? "0" + hexCode : hexCode) + "00";
		}
		return "#00FF00";
	},

	columnCheck: function(baseTableObject, columnName) {

		var balancecolumn = baseTableObject.components.balancecolumn[columnName];
		
		if(	balancecolumn == null)
		{
			openModalAlert("Balance column '" + columnName + "' not defined");
			return false;
		}
		if(balancecolumn.primaryColumn == null)
		{
			openModalAlert("Balance column's primary column is not defined");
			return false;
		}
		if(balancecolumn.averageColumn == null)
		{
			openModalAlert("Balance column's average column is not defined");
			return false;
		}
		if(balancecolumn.upperBoundColumn == null)
		{
			openModalAlert("Balance column's upper bound column is not defined");
			return false;
		}
		if(baseTableObject.components.column[balancecolumn.primaryColumn] == null) 
		{
			openModalAlert("Primary column '" + balancecolumn.column + "' is not defined in the XML profile for the balance column '" + columnName + "'");
			return false;
		}
		if(baseTableObject.components.column[balancecolumn.averageColumn] == null) 
		{
			openModalAlert("Average column '" + balancecolumn.column + "' is not defined in the XML profile for the balance column '" + columnName + "'");
			return false;
		}
		if(baseTableObject.components.column[balancecolumn.upperBoundColumn] == null) 
		{
			openModalAlert("Upper bound column '" + balancecolumn.column + "' is not defined in the XML profile for the balance column '" + columnName + "'");
			return false;
		}
		if(balancecolumn.lableColumn == "") balancecolumn.lableColumn = null;
		if(balancecolumn.lableColumn != null)
		{
			if(baseTableObject.components.column[balancecolumn.lableColumn] == null) 
			{
				openModalAlert("Lable column '" + balancecolumn.lableColumn + "' is not defined in the XML profile for the balance column '" + columnName + "'");
				return false;
			}
		}
		return true;
	}
});