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

QUERY_BUILDER.set('MYSQL', {
	buildSelect: function(queryBase, fetchFirst) {
		var columns = this.buildColumnList(queryBase);
		if(columns == "" || columns == null) return null;
		return this.buildWithList(queryBase) + " SELECT " + columns + " FROM " + this.buildFrom(queryBase) + " " + this.buildWhereClause(queryBase) + " " + queryBase.grouping + " " + this.buildOrderByClause(queryBase) + this.fetchFirst(fetchFirst);
	},
	
	buildDistinctColumnSelect :function(queryBase, columnObject) {
		return this.buildWithList(queryBase) + "SELECT DISTINCT " + (columnObject.isPrefiled.column == null ? columnObject.sql_name : (queryBase.components.column[columnObject.isPrefiled.column] != null ? queryBase.components.column[columnObject.isPrefiled.column].sql_name : columnObject.isPrefiled.column)) + " FROM " + this.buildFrom(queryBase);
	},
	
	fetchFirst: function(fetchFirst) {
		if(fetchFirst == false || fetchFirst == null || fetchFirst == "") return "";
		if(Object.isNumber(fetchFirst))
			return " LIMIT " + fetchFirst;
		if(Object.isString(fetchFirst))
			return fetchFirst;
		return " LIMIT 1";
	},
	
	buildFrom: function(queryBase) {
		var baseTableQuery = "";
		var otherTables = "";
	
		if(queryBase.queryType == null)
			return queryBase.getBaseQuery();
	
		var tableName = "";
		if(queryBase.tableName != "" && queryBase.tableName != null)
			tableName =" as " + queryBase.tableName;
		switch(queryBase.queryType.toLowerCase()) {
			case 'table':
				baseTableQuery = queryBase.getBaseQuery() + " " + tableName;
				break;
			case 'inlinequery':
				baseTableQuery = "(" + this.insertParameters(encodeMessage(queryBase.getBaseQuery(), $H(queryBase.tableCallParameters)), queryBase) + ") AS A";
				break;
			case 'function':
				var functionInside = "";
				var parmPresent = false;
				if(queryBase.parameters != null) {
					var parmLength = queryBase.parameters.each(function (parm) {
						if(parmPresent) functionInside += ",";
						parmPresent = true;
						var value = parm.value;
						value = value != null ? value : "''";
						if(!Object.isNumber(value)) {
							value = value.replace(/[\\]/g, "\\\\").replace(/[']/g, "\\'").replace(/[\n]/g, "\\n");
							if (parm.type == "s") {
								functionInside += "'" + value + "'";
							} else {
								functionInside += value;
							}
						} else{
							functionInside += value;
						}
						
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
			if(tableColumnRenderingModule != null) {
				if(tableColumnRenderingModule.containsTablesForQuery == true) {
					returnedTable = tableColumnRenderingModule.tablesForQueryPortion(queryBase);
					returnedTable = returnedTable.replace(/(^\s*)|(\s*$)/g, '');
					if(returnedTable.length > 0) 
						otherTables += ", " + returnedTable;
				}
				if(tableColumnRenderingModule.containsTableForJoinInQuery == true)
					baseTableQuery = tableColumnRenderingModule.tableForJoinInQuery(queryBase, baseTableQuery);
			}
		}
		return baseTableQuery + otherTables;
	},
	
	insertParameters: function(SQLquery, queryBase) {
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
			} else 
				parsedFunction += achar;
		});
	
		return parsedFunction;
	},
	
	buildWithList: function(queryBase) {
		if(queryBase.commonTableExpressions == null) return "";
	
		var returnString = "";
		if(queryBase.commonTableExpressions.length > 0) {
			var firstQuery = true;
			queryBase.commonTableExpressions.each(function(commonTableExpressions) { 
				if(!firstQuery) returnString += ", ";
				firstQuery = false;
				returnString += commonTableExpressions; 
			} );
		}
		var returnedWithList = "";
		var keys = $H(queryBase.components).keys();
		var keyLength = keys.length;
		var tableColumnRenderingModule = null;
		
		for(var i=0; i<keyLength; i++) {
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule != null) {
				if(tableColumnRenderingModule.containsCommonTableExpressionsForQuery == true) {
					returnedWithList = "";
					returnedWithList = tableColumnRenderingModule.commonTableExpressionsQueryPortion(queryBase);
					returnedWithList = returnedWithList.replace(/(^\s*)|(\s*$)/g, '');
					if(returnedWithList.length > 0 && returnString.length > 0)
						returnString += ", " + returnedWithList;
					else if(returnedWithList.length > 0 && returnString.length == 0)
						returnString = returnedWithList;
				}
			}
		}
		return returnString != "" ? "WITH " + returnString + " " : "";
	},
	
	buildOrderByClause: function(queryBase) {
		var orderBy = "";
		var parmPresent = false;
		var index = "";
		if(queryBase.orderBy != null) {
			queryBase.orderBy.each(function(sortElement) {
				var orderByValue = sortElement.direction;
				if(orderByValue != null) {
					if(parmPresent) orderBy += ",";
					parmPresent = true;
					orderByValue = orderByValue.substr(0,1).toUpperCase() == "A" ? "ASC" : "DESC";
					index = queryBase.components.column[sortElement.column];
					if(index != null)
						index = index.sql_name;
					else
						index = sortElement.column;
					orderBy += sortElement.column + " " + orderByValue;
				}
			});
		}
		
		if(orderBy == "") 
			return "";
		return "ORDER BY " + orderBy;
	},
	
	buildColumnList: function(queryBase) {
		var columnList = "";
		var returnedColumnList = "";
		var keys = $H(queryBase.components).keys();
		var keyLength = keys.length;
		var tableColumnRenderingModule = null;
		
		for(var i=0; i<keyLength; i++) {
			tableColumnRenderingModule = TABLE_COLUMN_RENDERING_MODULES.get(keys[i]);
			if(tableColumnRenderingModule != null) {
				if(tableColumnRenderingModule.containsColumnForQuery == true) {
					returnedColumnList = "";
					returnedColumnList = tableColumnRenderingModule.columnQueryPortion(queryBase);
					returnedColumnList = returnedColumnList.replace(/(^\s*)|(\s*$)/g, '');
					if(returnedColumnList.length > 0 && columnList.length > 0)
						columnList += ", " + returnedColumnList;
					else if(returnedColumnList.length > 0 && columnList.length == 0)
						columnList = returnedColumnList;
				}
			}
		}
		
		if(columnList.length == 0)
			columnList = "*";	
	
		return columnList;
	},
	
	buildWhereClause: function(queryBase) {
		var whereClause = "";
		var writenItems = 0;
		var rootNode = queryBase.where;
		var nodeStack = [];
		var indexStack = [];
		var whereStack = [];
		var writenItemStack = [];
		var i = 0;
		
		var Operand = "";
		
		if(rootNode != null) {
			whereClause = "";
			if(rootNode.type.toLowerCase() == "group") {
				Operand = rootNode.Operand;
				for(i = 0; i < rootNode.groupNodes.length || nodeStack.length != 0; i++) {
					if(i > rootNode.groupNodes.length) {
						rootNode = nodeStack.pop();
						i = indexStack.pop();
						Operand = rootNode.Operand;
						var oldWhere = whereStack.pop();
						var oldWritenItems = writenItemStack.pop();
						if(writenItems != 0) {
							if(writenItems > 1)
								whereClause = "(" + whereClause + ")";

							if(oldWritenItems > 1)
								whereClause = oldWhere + " " + Operand + " " + whereClause;

							oldWritenItems++;
						} else
							whereClause = oldWhere;
						writenItems = oldWritenItems;
						continue;
					}
					
					if(rootNode.groupNodes[i].type.toLowerCase() == "group") {
						whereStack.push(whereClause);
						nodeStack.push(rootNode);
						indexStack.push(i);
						writenItemStack.push(writenItems);
						writenItems = 0;
						i = 0;
						whereClause = "";
						rootNode = rootNode.groupNodes[i];
						Operand = rootNode.Operand;
						continue;
					}
					if(rootNode.groupNodes[i].column != "" && rootNode.groupNodes[i].compareType != "" && (rootNode.groupNodes[i].value != "" || Object.isNumber(rootNode.groupNodes[i].value)) ) {
						if(writenItems != 0) whereClause += " " + Operand;
						whereClause += this.buildCompareType(queryBase.components.column[rootNode.groupNodes[i].column],rootNode.groupNodes[i].compareType,rootNode.groupNodes[i].value);
						writenItems++;
					}
				}
			} else {
				if(rootNode.column != "" && rootNode.compareType != "" && (rootNode.value != "" || Object.isNumber(rootNode.value)) ) {
					if(writenItems != 0) whereClause += " " + Operand;
					whereClause += this.buildCompareType(queryBase.components.column[rootNode.column],rootNode.compareType,rootNode.value);
					writenItems++;
				}
			}
		}
		
		whereClause = whereClause.replace(/(^\s*)|(\s*$)/g, '');
	
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
		return "WHERE " + whereClause;
	},
	
	buildCompareType: function(column,op,value) {
		switch (op.toLowerCase()) {
			case 'is' :			return column.sql_name + " is null";
			case 'locate' :			return " LOCATE("+value+","+ column.sql_name+") > 0";
			case 'locateanycase' :	return " (LOCATE(upper("+value+"),"+ column.sql_name+",1, CODEUNITS16) > 0"
											+ " or LOCATE(lower("+value+"),"+ column.sql_name+",1, CODEUNITS16) > 0)";
			default: 				return " " + column.sql_name + " " + op + " " + columnTypeValueInsertion(column.fieldType,value);
		}
	}
});
