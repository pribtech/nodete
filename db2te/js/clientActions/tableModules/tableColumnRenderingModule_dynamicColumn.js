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
TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF = $H();

TABLE_COLUMN_RENDERING_MODULES.set("dynamiccolumn", {
	
	groupTitle: "Dynamic Columns",
	
	render: function(tableObject, rowToRender, columnObject) {
		if(tableObject.baseTableData.primaryKeys.length == 0) return "";
		return TABLE_COLUMN_RENDERING_MODULES.get("column").render(tableObject, rowToRender, columnObject);
	},
	
	columnCheck: function(baseTableObject, columnName) {
		var dynamicColumn = baseTableObject.components.dynamiccolumn[columnName];
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
			if(baseTableObject.components.column[dynamicColumn.columnSecondary] == null)  {
				openModalAlert("Secondary column '" + dynamicColumn.columnSecondary + "' is not defined in the XML profile for the dynamic column '" + columnName + "'");
				return false;
			}
		dynamicColumn.type = dynamicColumn.type.toUpperCase();
		
		if(dynamicColumn.dataType == "") {
			var dynamicTypeDef = TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.get(dynamicColumn.type);
			dynamicColumn.dataType = dynamicTypeDef.dataType == null ? "REAL" : dynamicTypeDef.dataType;
		}

		return true;		
	},
	
	//Indicates if this column type requirer common table Expressions to be included in the general query
	containsCommonTableExpressionsForQuery : true,
	//returns a list of common table expressions which will be included in the general query
	commonTableExpressionsQueryPortion : function(baseTableObject) { 
		if(baseTableObject.dynamicColumnIDCount == null) baseTableObject.dynamicColumnIDCount = 0;
		if(baseTableObject.primaryKeys.length == 0) {
			if(baseTableObject.dynamicColumnErrorRaised != true)
				openModalAlert("No primary keys set for table, dynamic columns have been disabled!");
			baseTableObject.dynamicColumnErrorRaised = true;
			return "";
		}
		var tableName = baseTableObject.tableName;
		var dynamicColumns = $H(baseTableObject.components.dynamiccolumn);
		var firstKey = true;
		var parameters = null;
		var output = "A_DYNAMIC_DATA_TABLE AS (";
		var count = 0;
		var thisObject = this;
		if(baseTableObject.dynamicHistoricalXML == null && baseTableObject.dynamicHistoricalXMLQuery != null) {
			output += "SELECT "
					+ ( this.isDB2Atleast97FP1() ? "CURRENT TIMESTAMP" : "(CURRENT TIMESTAMP - CURRENT TIMEZONE)")
					+ " as DYNAMIC_COLUMN_TIMESTAMP ";
			dynamicColumns.each(function(dynamicColumn) {
				if(dynamicColumn.value.ID == null)
					dynamicColumn.value.ID = "D" + baseTableObject.dynamicColumnIDCount++;
				
				parameters = thisObject.buildParameters(baseTableObject, dynamicColumn);

				if(dynamicColumn.value.firstArchiveReturn != null)
					output += ", " + encodeMessage(dynamicColumn.value.firstArchiveReturn, parameters);
				else  {
					dynamicTypeDef = TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.get(dynamicColumn.value.type);
					if(dynamicTypeDef)
						if(dynamicTypeDef.firstArchiveReturn != "")
							output += ", " + encodeMessage(dynamicTypeDef.firstArchiveReturn, parameters);
				}
			});
			output += " FROM SYSIBM.SYSDUMMY1";
		} else {
			output += "select c.* from XMLTABLE ('$d/t/r' passing ";
			if(baseTableObject.dynamicHistoricalXMLQuery != null)
				output += "XMLPARSE( document '" + baseTableObject.dynamicHistoricalXML.replace(/[\']/g, "\'\'") + "')";
			else
				output += "XMLPARSE( document cast( ?!name=timestamp&type=TE_INLINE_BIND&value=A_DYNAMIC_DATA_TABLE.0.0.0? as clob(10m))) ";
			output += " as \"d\"columns "
					+ "DYNAMIC_COLUMN_TIMESTAMP TIMESTAMP PATH '../@time'";
			
			count = 0;
			baseTableObject.primaryKeys.each(function(pkey) {
				output += ", DYNAMIC_COLUMN_" + pkey + " varchar(128) PATH '@P" + (++count) + "' "; 
			});
			
			dynamicColumns.each(function(dynamicColumn) {
				if(dynamicColumn.value.ID == null)
					dynamicColumn.value.ID = "D" + baseTableObject.dynamicColumnIDCount++;
				
				parameters = thisObject.buildParameters(baseTableObject, dynamicColumn);
				
				if(dynamicColumn.value.dataHistoryRetrieval != null)
					output += ", " + encodeMessage(dynamicColumn.value.dataHistoryRetrieval, parameters) + " ";
				else  {
					dynamicTypeDef = TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.get(dynamicColumn.value.type);
					if(dynamicTypeDef)
						if(dynamicTypeDef.dataHistoryRetrieval != "")
							output += ", " + encodeMessage(dynamicTypeDef.dataHistoryRetrieval, parameters)+ " ";
				}
			});
			
			output += ")  as c ";
		}
		output += ") ";
		return output;
	},
	
	getDisplayClass : function(columnObject) {
		if(columnObject.fieldType == null) columnObject.fieldType = 's';
		
		switch(columnObject.fieldType.toLowerCase()) {
			case "n":
				return "table-Number";
			case "l":
				return "table-LOBText";
		}
		return "table-NormalText";
	},
	
	//Indicates if this column type requires column data to be returned in the general query
	containsColumnForQuery : true, // boolean
	//return a list of columns to be retrieved which will be appended to the column section of the select statment
	columnQueryPortion : function(baseTableObject) { 
		if(baseTableObject.dynamicColumnIDCount == null) baseTableObject.dynamicColumnIDCount = 0;
		if(baseTableObject.primaryKeys.length == 0) return "";
		var dynamicColumns = $H(baseTableObject.components.dynamiccolumn);
		var columnList = "";
		var parameters = null;
		var firstKey = true;
		var thisObject = this;
		dynamicColumns.each(function(dynamicColumn) {
			if(dynamicColumn.value.ID == null)
				dynamicColumn.value.ID = "D" + baseTableObject.dynamicColumnIDCount++;
			
			parameters = thisObject.buildParameters(baseTableObject, dynamicColumn);
			
			if(dynamicColumn.value.currentDataReturn != null)
				output += ", " + encodeMessage(dynamicColumn.value.currentDataReturn, parameters);
			else {
				dynamicTypeDef = TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.get(dynamicColumn.value.type);
				if(dynamicTypeDef)
					if(dynamicTypeDef.currentDataReturn != "") {
							if(!firstKey) columnList += ", "; firstKey = false;
							columnList += encodeMessage(dynamicTypeDef.currentDataReturn, parameters) + " AS " + dynamicColumn.value.name;
					}
			}
		});
		return columnList;
	},

	//Indicates if this column type requires tables to be included in the general query
	containsTablesForQuery : true, // boolean
	//return a table to be added to the from section of the query
	tablesForQueryPortion : function(baseTableObject) { 
		if(baseTableObject.dynamicColumnIDCount == null) baseTableObject.dynamicColumnIDCount = 0;
		if(baseTableObject.primaryKeys.length == 0) return "";
		if(baseTableObject.dynamicHistoricalXML == null && baseTableObject.dynamicHistoricalXMLQuery != null)
			return "A_DYNAMIC_DATA_TABLE";
		return "";
	},

	// will allow you to start you query with a join clause which will be attached to the current table set
	containsTableForJoinInQuery : true, // boolean
	//return a table to be joined to the main table
	tableForJoinInQuery : function(baseTableObject, rootTable) { 
		if(baseTableObject.dynamicColumnIDCount == null) baseTableObject.dynamicColumnIDCount = 0;
		if(baseTableObject.primaryKeys.length == 0) return rootTable;
		var tableName = baseTableObject.tableName;
		if(baseTableObject.dynamicHistoricalXML != null || baseTableObject.dynamicHistoricalXMLQuery == null) {
			var firstKey = true;
			rootTable = rootTable + " left join A_DYNAMIC_DATA_TABLE on "; 
			baseTableObject.primaryKeys.each(function(pkey) { if(!firstKey) rootTable += " AND "; firstKey = false; rootTable += tableName + "." + baseTableObject.components.column[pkey].sql_name + " = A_DYNAMIC_DATA_TABLE.DYNAMIC_COLUMN_" + pkey; });
		}
		return rootTable;
	},

	//Indicates if this column type requires a secondary query to be run outside of the primary query
	ContainsSecondaryQueries : true, // boolean
	//return an array of secondary query to be executed
	secondaryQueries : function(baseObject) {
		var baseTableObject=baseObject.baseTableData;
		if(baseTableObject.dynamicColumnIDCount == null) baseTableObject.dynamicColumnIDCount = 0;
		if(baseTableObject.primaryKeys.length == 0) return "";
		
		var dynamicColumns = $H(baseTableObject.components.dynamiccolumn);
		
		baseTableObject.dynamicHistoricalXMLQuery = true;
		
		var innerSelectQuery = baseObject.getQueryBuilder().buildWithList(baseTableObject) + "SELECT XMLELEMENT(NAME \"r\", XMLATTRIBUTES(";
		var columnList = "";
		var dynamicTypeDef = null;
		var parameters = null;
		var thisObject = this;
		var returnObject = [];
		var count = 0;
		var keyDelimiter="";
		baseTableObject.primaryKeys.each(function(pkey) { 
			innerSelectQuery += keyDelimiter + baseTableObject.components.column[pkey].sql_name + " AS P" + (++count); 
			keyDelimiter=", ";
		});
		
		dynamicColumns.each(function(dynamicColumn) {
			if(dynamicColumn.value.ID == null)
				dynamicColumn.value.ID = "D" + baseTableObject.dynamicColumnIDCount++;
			
			parameters = thisObject.buildParameters(baseTableObject, dynamicColumn);
				
			if(dynamicColumn.value.dataToArchive != null)
				output += ", " + encodeMessage(dynamicColumn.value.dataToArchive, parameters);
			else {
				dynamicTypeDef = TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.get(dynamicColumn.value.type);
				if(dynamicTypeDef)
					if(dynamicTypeDef.dataToArchive != "") {
						innerSelectQuery += keyDelimiter + encodeMessage(dynamicTypeDef.dataToArchive, parameters);
						keyDelimiter=", ";
					}
			}
		});
		innerSelectQuery += ")) FROM " + baseObject.getQueryBuilder().buildFrom(baseTableObject); //Tables
		
		if(baseTableObject.detailedView == true)
			innerSelectQuery += " " + baseObject.getQueryBuilder().buildWhereClause(baseTableObject);
		
		var xQueryTimeFunction = this.isDB2Atleast97FP1() ?	'db2-fn:current-local-dateTime()' : 'fn:current-dateTime()';
		
		returnObject.push({
			name : 'A_DYNAMIC_DATA_TABLE',
			sql: "xquery let $info := db2-fn:sqlquery('" + innerSelectQuery.replace(/[\']/g, "\'\'") + "')return <t time='{" + xQueryTimeFunction + "}'> {for $table in $info return $table} </t>"
		});
		
		baseTableObject.dynamicHistoricalXMLQuery = null;
		return returnObject;
	},
	
	processSecondaryQueriesReturn : function(baseTableObject, STMTReturnArray) { 
		if(baseTableObject.primaryKeys.length == 0) return "";
		baseTableObject.dynamicHistoricalXML = STMTReturnArray['A_DYNAMIC_DATA_TABLE'].resultSet[0].data[0][0];
	},
	isDB2Atleast97FP1: function() {
		if(getActiveDatabaseConnectionObject() == null) return false;
		return parseFloat(getActiveDatabaseConnectionObject()['dataServerInfo']['dataServerVersion']) > 9.7 
			|| (parseFloat(getActiveDatabaseConnectionObject()['dataServerInfo']['dataServerVersion']) == 9.7 
					&& parseFloat(getActiveDatabaseConnectionObject()['dataServerInfo']['dataServerFixpack']) >= 1);
	},
	buildParameters: function(baseTableObject, dynamicColumn) {
		var parameters = $H();

		parameters.set("dynamic_ID", dynamicColumn.value.ID);
		parameters.set("column_name", dynamicColumn.value.column);
		parameters.set("column_name_2", dynamicColumn.value.columnSecondary);
		parameters.set("dynamic_name", "DYNAMIC_COLUMN_" + dynamicColumn.value.name);
		parameters.set("dynamic_interval", dynamicColumn.value.interval);
		parameters.set("TYPE", dynamicColumn.value.dataType);
		parameters.set("time_diff", "TIMESTAMPDIFF( 2, char(CURRENT TIMESTAMP " + ( this.isDB2Atleast97FP1() ? "" : "- CURRENT TIMEZONE" ) + " - DYNAMIC_COLUMN_TIMESTAMP))");
		parameters.set("column_SQL", baseTableObject.components.column[dynamicColumn.value.column] == null
		                            ? "NULL"
		                            : baseTableObject.components.column[dynamicColumn.value.column].sql_name
				);
		parameters.set("column_SQL_2", "NULL");
		if(dynamicColumn.value.columnSecondary != "")
			if(baseTableObject.components.column[dynamicColumn.value.columnSecondary] != null)
				parameters.set("column_SQL_2", baseTableObject.components.column[dynamicColumn.value.columnSecondary].sql_name);
		
		return parameters;
	}
});