/*******************************************************************************
 * Author: Peter Prib
 * 
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
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
if(Object.isUndefined(QUERY_BUILDER)) var QUERY_BUILDER = $H();

QUERY_BUILDER.set('ORACLE', {
	buildSelect: function(queryBase, fetchFirst) {
		var columns = this.buildColumnList(queryBase);
		if(columns == "" || columns == null) return null;
		return this.buildWithList(queryBase) + this.fetchFirst(fetchFirst,"SELECT " + columns + " FROM " + this.buildFrom(queryBase) + " " + this.buildWhereClause(queryBase) + " " + queryBase.grouping + " " + this.buildOrderByClause(queryBase) );
	},
	
	buildDistinctColumnSelect :function(queryBase, columnObject) {
		var column = (columnObject.isPrefiled.column == null ? columnObject.sql_name : (queryBase.components.column[columnObject.isPrefiled.column] != null ? queryBase.components.column[columnObject.isPrefiled.column].sql_name : columnObject.isPrefiled.column));
		return this.buildWithList(queryBase) + "SELECT DISTINCT " + column + " FROM " + this.buildFrom(queryBase) +" ORDER BY "	+ column;
	},
	
	fetchFirst: function(fetchFirst,sql) {
		if(fetchFirst == false || fetchFirst == null || fetchFirst == "") return sql;
		if(fetchFirst === true)
			return "SELECT * FROM ( "+sql+" ) WHERE ROWNUM <= 1 ";
		if(!isNaN(fetchFirst))
			return "SELECT * FROM ( "+sql+" ) WHERE ROWNUM <= " + fetchFirst;	
		return fetchFirst;
	},
	
	buildFrom: function(queryBase) {
		if(queryBase.queryType == null)
			return queryBase.getBaseQuery();
	
		var baseTableQuery = "";
		var otherTables = "";
		var tableName = "";

		if(queryBase.tableName != "" && queryBase.tableName != null)
			tableName =" " + queryBase.tableName;
		switch(queryBase.queryType.toLowerCase()) {
			case 'table':
				baseTableQuery = queryBase.getBaseQuery() + " " + tableName;
				break;
			case 'inlinequery':
				baseTableQuery = "(" + this.insertParameters(encodeMessage(queryBase.getBaseQuery(), $H(queryBase.tableCallParameters)), queryBase) + ")" + tableName;
				break;
			case 'function':
				var functionInside = "";
				var value="";
				if(queryBase.parameters != null) {
					var parmLength = queryBase.parameters.each(function (parm) {
						if(functionInside.length>0) functionInside += ",";
						functionInside +=columnTypeValueInsertion(parm.type,parm.value)
					});
				}
				baseTableQuery = "TABLE(" + queryBase.getBaseQuery() + (functionInside != "" ? "(" + functionInside + ")" : "") + ")" + tableName;
				break;
			default:
				baseTableQuery = queryBase.getBaseQuery();
		}
	
		if(queryBase.otherTablesToInclude != null) 
			if(queryBase.otherTablesToInclude.length > 0) 
				queryBase.otherTablesToInclude.each(function(tableName) { otherTables += ", " + tableName; } );
		
		var returnedTable = "";
		var keys = $H(queryBase.components).keys();
		var keyLength = keys.length;
		var tableColumnRenderingModule = null;
		
		for(var i=0; i<keyLength; i++) {
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule == null) continue;

			if(tableColumnRenderingModule.containsTablesForQuery == true) {
				returnedTable = tableColumnRenderingModule.tablesForQueryPortion(queryBase).replace(/(^\s*)|(\s*$)/g, '');
				if(returnedTable.length > 0)
					otherTables += ", " + returnedTable;
			}
			if(tableColumnRenderingModule.containsTableForJoinInQuery == true)
				baseTableQuery = tableColumnRenderingModule.tableForJoinInQuery(queryBase, baseTableQuery);
		}
		
		return baseTableQuery + otherTables;
	},
	
	insertParameters: function(SQLquery, queryBase)	{
		if(queryBase.parameters == null)
			return SQLquery;
	
		var parmCount = 0;
		var parsedFunction = "";
		var SQLqueryAsCharArray = SQLquery.split("");
		var ESCfound = false;
		
		SQLqueryAsCharArray.each(function(achar) {
			if(ESCfound) {
				ESCfound = false;
				parsedFunction += achar;
			} else if(achar == '\\') {
				ESCfound = true;
			} else if(achar == '?') {
				if(queryBase.parameters[parmCount] != null) {
					var parm= queryBase.parameters[parmCount];
					var name= parm.name;
					var pname = null;
					
					if(name != null)
						if(queryBase.tableCallParameters[name] != null)
							pname = queryBase.tableCallParameters[name];
	
					if(pname == null)
						pname = parm.value == null ? "" : parm.value;
	
					if (parm.type.toLowerCase() == "s") 
						parsedFunction += "'" + pname + "'";
					else 
						parsedFunction += pname;
				}
				parmCount++;
			} else {
				parsedFunction += achar;
			}
		});
	
		return parsedFunction;
	},
	
	buildWithList: function(queryBase)	{
		if(queryBase.commonTableExpressions == null) return "";
	
		var returnString = "";
		if(queryBase.commonTableExpressions.length > 0) {
			queryBase.commonTableExpressions.each(function(commonTableExpressions) { 
				if(returnString.length > 0) returnString += ", ";
				returnString += commonTableExpressions; 
			} );
		}

		var keys = $H(queryBase.components).keys();
		var keyLength = keys.length;
		var tableColumnRenderingModule = null;
		
		for(var i=0; i<keyLength; i++) {
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule == null) continue;
			if(tableColumnRenderingModule.containsCommonTableExpressionsForQuery != true) continue;

			returnedWithList = tableColumnRenderingModule.commonTableExpressionsQueryPortion(queryBase).replace(/(^\s*)|(\s*$)/g, '');
			if(returnedWithList.length == 0) continue;
			if( returnString.length > 0) returnString += ", ";
			returnString += returnedWithList;
		}
		
		return returnString != "" ? "WITH " + returnString + " " : "";
	},
	
	buildOrderByClause: function(queryBase) {
		if(queryBase.orderBy == null) return "";
		var orderBy = "";
		queryBase.orderBy.each(function(sortElement) {
			if(sortElement.direction == null) return; 
			if(orderBy != "" ) orderBy += ' , ';
			orderBy += sortElement.column + " " + (sortElement.direction.substr(0,1).toUpperCase() == "A" ? "ASC" : "DESC");
		});
		if(orderBy == "") return "";
		return "ORDER BY " + orderBy;
	},
	
	buildColumnList: function(queryBase) {
		var columnList = "";
		var returnedColumnList = "";
		var tableColumnRenderingModule = null;
		var keys = $H(queryBase.components).keys();
		var keyLength = keys.length;
		
		for(var i=0; i<keyLength; i++) {
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule == null) continue;
			if(tableColumnRenderingModule.containsColumnForQuery != true) continue;
			returnedColumnList = tableColumnRenderingModule.columnQueryPortion(queryBase).replace(/(^\s*)|(\s*$)/g, '');
			if(returnedColumnList.length == 0 ) continue;
			columnList += (columnList.length > 0 ? ", ":"") + returnedColumnList;
		}
		return (columnList.length == 0 ? "*" : columnList);
	},
	
	buildWhereClause: function(queryBase) {
		var rootNode = queryBase.where;
		var whereClause = this.buildWhereGroup(queryBase, rootNode).replace(/(^\s*)|(\s*$)/g, '');
		var returnedWhereList = "";
		var keys = $H(queryBase.components).keys();
		var keyLength = keys.length;
		var tableColumnRenderingModule = null;
		
		for(var i=0; i<keyLength; i++) {
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule == null) continue;
			if(tableColumnRenderingModule.containsWhereClauseForQuery != true) continue;
			returnedWhereList = tableColumnRenderingModule.whereClauseQueryPortion(queryBase).replace(/(^\s*)|(\s*$)/g, '');

			if(returnedWhereList.length == 0 ) continue;
			if( whereClause.length > 0) whereClause += " AND "; 
			whereClause +=  "(" + returnedWhereList + ")";
		}
		if(whereClause.length == 0) return "";
		return "WHERE " + whereClause ;
	},
	
	buildWhereGroup: function(queryBase, rootNode){
		if(rootNode == null) return "";
		switch (rootNode.type.toLowerCase()) {
			case "value":
				if(rootNode.column != "" && (rootNode.compareType.toLowerCase() === "is null" 
				      || rootNode.compareType.toLowerCase() === "is not null") )
					return " " + queryBase.components.column[rootNode.column].sql_name + " " + rootNode.compareType;
			
				if(rootNode.column != "" && rootNode.compareType != "" && (rootNode.value != "" || Object.isNumber(rootNode.value)) )
					return this.buildCompareType(queryBase.components.column[rootNode.column],rootNode.compareType,rootNode.value);
				break;
			case "group": 
				var whereClause = "";
				var newWhereClause = "";
				var Operand = rootNode.Operand;
				for(var i = 0; i < rootNode.groupNodes.length; i++) {
					if(rootNode.groupNodes[i] == null) continue;
					newWhereClause = this.buildWhereGroup(queryBase,rootNode.groupNodes[i]);
					if(newWhereClause == "") continue;
					if(whereClause !== "") whereClause += " " + Operand;
					whereClause += " ( " + newWhereClause + " ) ";
				}
				return whereClause;
		}
		return "";
	},
	
	buildCompareType: function(column,op,value) {
		switch (op.toLowerCase()) {
			case 'exists' :
			case 'not exists' :
									return " " + op + "(" + value + ")"; 
			case 'is' :				return column.sql_name + " is null";
			case 'locate' :			return " LOCATE("+columnTypeValueInsertion(column.fieldType,value)+","+ column.sql_name +") > 0";
			case 'locateanycase' :	return " (LOCATE(upper("+columnTypeValueInsertion(column.fieldType,value)+"),"+ column.sql_name +",1, CODEUNITS16) > 0"
											+ " or LOCATE(lower("+columnTypeValueInsertion(column.fieldType,value)+"),"+ column.sql_name +",1, CODEUNITS16) > 0)";
			default: 				return " " + column.sql_name + " " + op + " " + columnTypeValueInsertion(column.fieldType,value);
		}
	},
	
	primaryKeyQuery: function(schema, tableName) {
		return  "SELECT cols.column_name  " 
				+ " FROM all_constraints cons, all_cons_columns cols"
				+ " WHERE col.owner = '" + schema + "'"
				+   " AND cols.table_name = '" + tableName + "'"
				+   " AND cons.constraint_type = 'P'"
				+   " AND cons.constraint_name = cols.constraint_name"
				+   " AND cons.owner = cols.owner";
	}

});