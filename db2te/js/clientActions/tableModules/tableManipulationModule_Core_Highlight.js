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
TABLE_MANIPULATION_MODULES.set("Core_Highlight", {
	
	/*cellMouse1ClickAction: function(tableObject, rowNumber, columnType, columnName) {
	
		this.clearHighlight(tableObject);

		if(tableObject.Core_Highlight_Data.selectedRow == rowNumber && tableObject.Core_Highlight_Data.selectedColumnType == columnType && tableObject.Core_Highlight_Data.selectedColumnName == columnName)
		{
			tableObject.Core_Highlight_Data.selectedColumnType = null;
			tableObject.Core_Highlight_Data.selectedColumnName = null;
			tableObject.Core_Highlight_Data.selectedRow = null;
			return;
		}
		tableObject.Core_Highlight_Data.selectedColumnType = columnType;
		tableObject.Core_Highlight_Data.selectedColumnName = columnName;
		tableObject.Core_Highlight_Data.selectedRow = rowNumber;

		$$("." + tableObject.elementUniqueID + "_ColumnClass_" + tableObject.Core_Highlight_Data.selectedColumnType + "_" + tableObject.Core_Highlight_Data.selectedColumnName).each(function(elm){elm.setStyle({ "background": "AliceBlue" })});
		
		$$("." + tableObject.elementUniqueID + "_RowClass_" + tableObject.Core_Highlight_Data.selectedRow).each(function(elm){elm.setStyle({ "background": "AliceBlue" })});

		$(tableObject.elementUniqueID + "_Cell_" + tableObject.Core_Highlight_Data.selectedColumnType + "_" + tableObject.Core_Highlight_Data.selectedColumnName + "_" + tableObject.Core_Highlight_Data.selectedRow).setStyle({ "background": "DeepSkyBlue" });
		
	},*/
	
	columnHeadMouse1ClickAction: function(tableObject, columnType, columnName) {
		this.clearHighlight(tableObject);

		if(	tableObject.Core_Highlight_Data.selectedColumnType == columnType &&	tableObject.Core_Highlight_Data.selectedColumnName == columnName) {
			tableObject.Core_Highlight_Data.selectedColumnType = null;
			tableObject.Core_Highlight_Data.selectedColumnName = null;
			return;
		}
		tableObject.Core_Highlight_Data.selectedColumnType = columnType;
		tableObject.Core_Highlight_Data.selectedColumnName = columnName;
		tableObject.Core_Highlight_Data.selectedRow = null;
		$$("." + tableObject.elementUniqueID + "_ColumnClass_" + tableObject.Core_Highlight_Data.selectedColumnType + "_" + tableObject.Core_Highlight_Data.selectedColumnName).each(function(elm){elm.setStyle({ "background": "DeepSkyBlue" });});
		
	},

	rowHeadMouse1ClickAction: function(tableObject, rowNumber) {
		this.clearHighlight(tableObject);
		
		if(tableObject.Core_Highlight_Data.selectedRow == rowNumber && tableObject.Core_Highlight_Data.selectedColumnType == null && tableObject.Core_Highlight_Data.selectedColumnName == null) {
			tableObject.Core_Highlight_Data.selectedRow = null;
			return;
		}
		tableObject.Core_Highlight_Data.selectedColumnType = null;
		tableObject.Core_Highlight_Data.selectedColumnName = null;
		tableObject.Core_Highlight_Data.selectedRow = rowNumber;
		$$("." + tableObject.elementUniqueID + "_RowClass_" + tableObject.Core_Highlight_Data.selectedRow).each(function(elm){elm.setStyle({ "background": "DeepSkyBlue" });});
	},
	
	clearHighlight: function(tableObject)  {
		if(tableObject.Core_Highlight_Data == null)
			tableObject.Core_Highlight_Data = {
				selectedColumnType: null,
				selectedColumnName:null,
				selectedRow:null
			};
		
		if(tableObject.Core_Highlight_Data.selectedColumnType != null && tableObject.Core_Highlight_Data.selectedColumnName != null)
			$$("." + tableObject.elementUniqueID + "_ColumnClass_" + tableObject.Core_Highlight_Data.selectedColumnType + "_" + tableObject.Core_Highlight_Data.selectedColumnName).each(function(elm){elm.setStyle({ "background": "" });});
		if(tableObject.Core_Highlight_Data.selectedRow != null)
			$$("." + tableObject.elementUniqueID + "_RowClass_" + tableObject.Core_Highlight_Data.selectedRow).each(function(elm){elm.setStyle({ "background": "" });});
		if(tableObject.Core_Highlight_Data.selectedRow != null && tableObject.Core_Highlight_Data.selectedColumnType != null && tableObject.Core_Highlight_Data.selectedColumnName != null)
			$(tableObject.elementUniqueID + "_Cell_" + tableObject.Core_Highlight_Data.selectedColumnType + "_" + tableObject.Core_Highlight_Data.selectedColumnName + "_" + tableObject.Core_Highlight_Data.selectedRow).setStyle({ "background": "" });
	}
});