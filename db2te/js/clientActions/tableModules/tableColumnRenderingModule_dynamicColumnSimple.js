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
TABLE_COLUMN_RENDERING_MODULES.set("dynamiccolumnsimple", {
	
	groupTitle: "Simple Dynamic Columns",
	
	render: function(tableObject, rowToRender, columnObject) {
		var accessPoint = tableObject.baseTableData.primaryKeys;
		
		if(accessPoint == null) return;
		
		if(accessPoint.length == 0) return CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES.NO_PRIMARY_KEYS_SET;
		
		var columnIndex =  tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()];
		if(columnIndex == null) {
			tableObject.baseTableData.columnsInfo.name.push(columnObject.name);
			columnIndex = tableObject.baseTableData.columnsInfo.name.length;
			tableObject.baseTableData.resultSetIndexByColumnName[columnObject.name.toUpperCase()] = columnIndex;
		}
		
		columnObject.localQueryDataIndex = columnIndex;
		
		if(columnObject.timeSinceLast == null) {
			var secondsSinceMidnight = tableObject.baseTableData.baseData[rowToRender][tableObject.baseTableData.resultSetIndexByColumnName['DYNAMIC_COLUMNS_SIMPLE_MIDNIGHT_SECONDS']];
			var microSeconds = tableObject.baseTableData.baseData[rowToRender][tableObject.baseTableData.resultSetIndexByColumnName['DYNAMIC_COLUMNS_SIMPLE_MICROSECONDS']];
			secondsSinceMidnight += microSeconds/1000000;
			if(columnObject.lastTime == null) {
				columnObject.lastTime = secondsSinceMidnight;
				columnObject.timeSinceLast = 0;
			} else if(secondsSinceMidnight >= columnObject.lastTime) {
				columnObject.timeSinceLast = secondsSinceMidnight - columnObject.lastTime;
				columnObject.lastTime = secondsSinceMidnight;
			} else {
				columnObject.timeSinceLast = secondsSinceMidnight + (86401 - columnObject.lastTime);
				columnObject.lastTime = secondsSinceMidnight;
			}
		}
		
		if(columnObject.columnIndex == null && columnObject.column != null) 
			columnObject.columnIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.column];
		
		if(columnObject.columnSecondaryIndex == null && columnObject.columnSecondary != null) 
			columnObject.columnSecondaryIndex = tableObject.baseTableData.resultSetIndexByColumnName[columnObject.columnSecondary];
		
		tableObject.baseTableData.baseData[rowToRender][columnObject.localQueryDataIndex] = columnObject.typeProccessor.inlineFunctionProcessor(tableObject, tableObject.baseTableData.baseData[rowToRender], columnObject, accessPoint);
		return TABLE_COLUMN_RENDERING_MODULES.get("column").render(tableObject, rowToRender, columnObject);
	},

	columnCheck: function(baseTableObject, columnName) {

		var dynamicColumn = baseTableObject.components.dynamiccolumnsimple[columnName];
		dynamicColumn.render= isDatabaseConnectionVersion(dynamicColumn);
		if(	dynamicColumn == null) {
			openModalAlert("Dynamic column '" + columnName + "' not defined");
			return false;
		}
		if(baseTableObject.components.column[dynamicColumn.column] == null) {
			openModalAlert("Primary column '" + dynamicColumn.column + "' is not defined in the XML profile for the dynamic column '" + columnName + "'");
			return false;
		}

		if(dynamicColumn.columnSecondary != "" && dynamicColumn.columnSecondary != null) 
			if(baseTableObject.components.column[dynamicColumn.columnSecondary] == null) {
				openModalAlert("Secondary column '" + dynamicColumn.columnSecondary + "' is not defined in the XML profile for the dynamic column '" + columnName + "'");
				return false;
			}

		dynamicColumn.column = dynamicColumn.column.toUpperCase();
		dynamicColumn.columnSecondary = dynamicColumn.columnSecondary.toUpperCase();
		dynamicColumn.type = dynamicColumn.type.toUpperCase();

		if(dynamicColumn.dataType == "") {
			var dynamicTypeDef = TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.get(dynamicColumn.type);
			dynamicColumn.typeProccessor = dynamicTypeDef;
			if(dynamicTypeDef.dataType != null)
				dynamicColumn.dataType = dynamicTypeDef.dataType;
			else
				dynamicColumn.dataType = "REAL";
			if(dynamicColumn.typeProccessor.inlineFunctionProcessor == null)
				return null;
		}
		dynamicColumn.getStoredValue = function(tableObject, rowToRender, columnObject, accessPoint) {
			var base = columnObject.HistoryStore;
			for(var i=0; i<accessPoint.length && base != null; i++)
				base = base[rowToRender[tableObject.baseTableData.resultSetIndexByColumnName[accessPoint[i].toUpperCase()]]];
			if(base == null)
				return null;
			return base.value;	
		};
		
		dynamicColumn.setStoredValue = function(tableObject, rowToRender, columnObject, accessPoint, value) {
			var i = 0;
			var base = columnObject.HistoryStore;
			var key = null;
			for(i=0; i<accessPoint.length; i++) {
				key = rowToRender[tableObject.baseTableData.resultSetIndexByColumnName[accessPoint[i].toUpperCase()]];
				if(base[key] == null)
					base[key] = {};
				base = base[key];
			}
			if(base.age == null)
				base.age = -1;	
			base.value = value;
			return base.value;
		};
		dynamicColumn.HistoryStore = {};
		dynamicColumn.localQueryDataType = DB2_STRING;
		return true;		
	},
	
	getDisplayClass : function(columnObject)
	{
		if(columnObject.fieldType == null) columnObject.fieldType = 's';
		
		switch(columnObject.fieldType.toLowerCase()) {
			case "n":
				return "table-Number";
			case "l":
				return "table-LOBText";
		}
		return "table-NormalText";
	},
	
	//Indicates if this column type requiers column data to be returned in the general query
	containsColumnForQuery : true, // boolean
	//return a list of columns to be retrived which will be appended to the column section of the select statment
	columnQueryPortion : function(baseTableObject) {
		var dynamicColumns = $H(baseTableObject.components.dynamiccolumnsimple);
		dynamicColumns.each(function(dynamicColumn) {
			dynamicColumn.value.timeSinceLast = null;
		});
		return " MIDNIGHT_SECONDS(CURRENT TIMESTAMP) as DYNAMIC_COLUMNS_SIMPLE_MIDNIGHT_SECONDS, MICROSECOND(CURRENT TIMESTAMP) as DYNAMIC_COLUMNS_SIMPLE_MICROSECONDS ";
	}
});