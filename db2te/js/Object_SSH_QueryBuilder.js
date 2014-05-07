/*******************************************************************************
 * Author: Peter Prib
 * 
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
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

QUERY_BUILDER.set('SSH', {
	buildSelect: function(queryBase, fetchFirst) {
		return this.buildFrom(queryBase);
	},
	
	buildDistinctColumnSelect :function(queryBase, columnObject) {
		return "";
	},
	
	fetchFirst: function(fetchFirst) {
		return " | head -".fetchFirst;
	},
	
	buildFrom: function(queryBase) {
		if(queryBase.queryType == null)
			return queryBase.getBaseQuery();
	
		var baseTableQuery = "";

		switch(queryBase.queryType.toLowerCase()) {
			case 'table':
				baseTableQuery = queryBase.getBaseQuery() ;
				break;
			case 'inlinequery':
				baseTableQuery = this.insertParameters(encodeMessage(queryBase.getBaseQuery(), $H(queryBase.tableCallParameters)), queryBase) ;
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
				baseTableQuery = queryBase.getBaseQuery() + (functionInside != "" ? " (" + functionInside + ")" : " ") ;
				break;
			default:
				baseTableQuery = queryBase.getBaseQuery();
		}
	
		
		return baseTableQuery ;
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
	
					parsedFunction += "?!name="+name+"&value="+pname+(parm.type==null?"":"&type="+parm.type)+"?";
				}
				parmCount++;
			} else {
				parsedFunction += achar;
			}
		});
	
		return parsedFunction;
	},
	
	buildWithList: function(queryBase) {
		return "";
	},
	
	buildOrderByClause: function(queryBase) {
		return "";
	},
	
	buildColumnList: function(queryBase) {
		return "";
	},
	
	buildWhereClause: function(queryBase) {
		return "";
	},
	
	buildWhereGroup: function(queryBase, rootNode){
		return "";
	},
	
	buildCompareType: function(column,op,value) {
		return "";
	},

	primaryKeyQuery: function(schema, tableName) {
		return "";
	}
});