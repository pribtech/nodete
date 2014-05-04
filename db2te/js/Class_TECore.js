/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 * 
 * Update: Peter Prib 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009)  2013 All rights reserved.
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
var GLOBAL_OBJECT_HOLDER = {};
var GLOBAL_TYPE_LIBRARY = {};

var GLOBAL_CONTEXT = {
	 context: null
	,setContext: function (context) {
		contextNew=( context==null||context=="" ? null : context.toLowerCase() );
		if(this.context==contextNew) return;
		this.context=contextNew;
		ALL_GLOBAL_OBJECT('nodeFilter',null,'CONTEXTBASE');
	}
	,setContextMenu: function (contextMenuDirectory) {
		var contextExtracted = /\w*(?=Switch$)/g.exec(contextMenuDirectory);
		this.setContext( contextExtracted.length==1 ? contextExtracted[0] : contextMenuDirectory );
	}
	,notInList: function (contextList) {return !this.inList(contextList);}
	,inList: function (contextList) {
		if(this.context==null) return true;
		if(contextList==null) return true;
		if(contextList=="") return true;
		searchList=","+contextList+",";
		return ( searchList.search(","+this.context+",")>-1 );
	}
};

var GET_GLOBAL_OBJECT = function(TYPE, ID) {
		if(!Object.isString(TYPE)) return null;
		if(GLOBAL_TYPE_LIBRARY[TYPE.toUpperCase()] == null) return null;
		return GLOBAL_OBJECT_HOLDER[GLOBAL_TYPE_LIBRARY[TYPE.toUpperCase()]].get(ID);
};
var GET_GLOBAL_OBJECT_CLASS = function(TYPE) {
		if(!Object.isString(TYPE)) return null;
		return GLOBAL_OBJECT_HOLDER[GLOBAL_TYPE_LIBRARY[TYPE.toUpperCase()]];
};

var ALL_GLOBAL_OBJECT = function(aFunction, args , elementType) {
	var results =[];
	if (elementType==undefined) return results;
	if (elementType==null) return results;
	var objects = GET_GLOBAL_OBJECT_CLASS(elementType);
	if (objects == null) return results;
	for (var i in objects._object) {
		var aObject=objects._object[i];
		results.push(aObject[aFunction].apply(aObject,args)); 
	}
	return results;
};

var basePageElement = Class.create({
	initialize: function(myID, myType, enableAccessByName) {
		//As the object is not always uniquely identified we create and internal Global unique identifier for the object 
		this.theObjectIsDead = false;
		this.GUID = getGUID();
		this.enableAccessByName = enableAccessByName != null ? enableAccessByName : false;
		
		this.elementParent = null;
		
		/*********************************************
		 * All object within the TE should have a Unique ID.
		 * The id is usually constructed in the following manner:
		 * <Stage Name>_<Window Name>_<Panel Name>_<Action Name>_<Component Description>
         * Note that the Component description may appear at the beginning or end of the ID
         * for legacy reasons all new code should have the component Description on the end a
         ********************************************/
		this.elementName = myID;
		this.elementType = this.elementType == null ? myType : this.elementType;
		this.elementType = this.elementType.toUpperCase();
		
		this.elementUniqueID = myID;
		
		this.parentStageID = "";
		this.parentWindowID = "";
		this.width = 0;
		this.height = 0;
		this.minWidth= this.minWidth == null ? 200 : this.minWidth;
		this.minHeight= this.minHeight == null ? 10 : this.minHeight;
		
		if(GLOBAL_TYPE_LIBRARY[this.elementType] == null) GLOBAL_TYPE_LIBRARY[this.elementType] = getGUID();

		this.elementTypeID = GLOBAL_TYPE_LIBRARY[this.elementType];

		if(GLOBAL_OBJECT_HOLDER[this.elementTypeID] == null) GLOBAL_OBJECT_HOLDER[this.elementTypeID] = $H();
		
		GLOBAL_OBJECT_HOLDER[this.elementTypeID].set(this.GUID, this);
		if(this.enableAccessByName) {
			if(GLOBAL_OBJECT_HOLDER[this.elementTypeID].get(this.elementUniqueID) != null)
				alert(encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.OBJECT_EXISTS, {OBJECT_TYPE:this.elementTypeID, OBJECT_ID:this.elementUniqueID}));	
			GLOBAL_OBJECT_HOLDER[this.elementTypeID].set(this.elementUniqueID, this);
		}
		this.callBackText = "GLOBAL_OBJECT_HOLDER[" + this.elementTypeID + "].get(" + this.GUID + ")";
	},
	
	getAllObjectsInGroup : function() {
		return GLOBAL_OBJECT_HOLDER[this.elementType];
	},
	
	autoReloadUpdate: function() {
		//Treat as abstract function
	},
	reloadPage: function() {
		//Treat as abstract function
	},
	resizeStart: function() {
		//Treat as abstract function
	},
	resizeEnd: function() {
		//Treat as abstract function
	},
	sizeWidth: function(Amount) {
		//Treat as abstract function
	},
	sizeHeight: function(Amount) {
		//Treat as abstract function
	},
	setSize: function(width, height) {
		this.setWidth(width == null ? this.width : width);
		this.setHeight(height == null ? this.height : height);
	},
	setWidth: function(Amount) {
		//Treat as abstract function
	},
	setHeight: function(Amount) {
		//Treat as abstract function
	},
	moveLeft: function(Amount) {
		//Treat as abstract function
	},
	moveTop: function(Amount) {
		//Treat as abstract function
	},
	destroy: function() {
		this.theObjectIsDead = true;
		if(this.enableAccessByName) {
			var object = GLOBAL_OBJECT_HOLDER[this.elementTypeID].get(this.elementUniqueID);
			if(object != null) {
				if(object.GUID == this.GUID)
					 GLOBAL_OBJECT_HOLDER[this.elementTypeID].unset(this.elementUniqueID);
			}
		}
		GLOBAL_OBJECT_HOLDER[this.elementTypeID].unset(this.GUID);
		this.myParent = null;
	},
	draw: function() {
		return "";
	},
	redraw: function() {
		this.draw();
	},
	sizeToChild: function(childsName) {
		return null;
	}
});

if(Object.isUndefined(QUERY_BUILDER_CLASS)) var QUERY_BUILDER_CLASS = $H();
if(Object.isUndefined(QUERY_BUILDER)) var QUERY_BUILDER = $H();

var baseQueryBuilder = Class.create({
	initialize: function() {
	},
	destroy: function() {
	},
	buildSelect: function(queryBase, fetchFirst) {
		var columns = this.buildColumnList(queryBase);
		if(columns == "" || columns == null) return null;
		return this.buildWithList(queryBase) + " SELECT " + columns + " FROM " + this.buildFrom(queryBase) + " " + this.buildWhereClause(queryBase) + " " + queryBase.grouping + " " + this.buildOrderByClause(queryBase) + this.fetchFirst(fetchFirst) + " FOR READ ONLY";
	},
	buildDistinctColumnSelect :function(queryBase, columnObject) {
		return this.buildWithList(queryBase) + "SELECT DISTINCT " + (columnObject.isPrefiled.column == null ? columnObject.sql_name : (queryBase.components.column[columnObject.isPrefiled.column] != null ? queryBase.components.column[columnObject.isPrefiled.column].sql_name : columnObject.isPrefiled.column)) + " FROM " + this.buildFrom(queryBase)	;
	},
	fetchFirst: function(fetchFirst) {
		if(fetchFirst == false || fetchFirst == null || fetchFirst == "") return "";
		if(fetchFirst === true)
			return " FETCH FIRST ROW ONLY";	
		if(!isNaN(fetchFirst))
			return " FETCH FIRST " + fetchFirst + " ROWS ONLY";	
		return fetchFirst;
	},
	
	buildFrom: function(queryBase) {
		if(queryBase.queryType == null)
			return queryBase.getBaseQuery();
		var  baseTableQuery = ""
			,otherTables = ""
			,tableName = "";

		if(queryBase.tableName != "" && queryBase.tableName != null)
			tableName =" as " + queryBase.tableName;
		switch(queryBase.queryType.toLowerCase()) {
			case 'table':
				baseTableQuery = queryBase.getBaseQuery() + " " + tableName;
				break;
			case 'inlinequery':
				baseTableQuery = "table(" + this.insertParameters(encodeMessage(queryBase.getBaseQuery(), $H(queryBase.tableCallParameters)), queryBase) + ")" + tableName;
				break;
			case 'function':
				var functionInside = "";
				var value="";
				if(queryBase.parameters != null) {
					var parmLength = queryBase.parameters.each(function (parm) {
						functionInside +=','+ ( parm.value.startsWith('(') ? parm.value : columnTypeValueInsertion(parm.type,'?!value='+parm.value+'?'));
					});
				}
				baseTableQuery = "TABLE(" + queryBase.getBaseQuery() + (functionInside != "" ? "(" + functionInside.substr(1) + ")" : "") + ")" + tableName;
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
	insertParameters: function(SQLquery, queryBase) {
		if(queryBase.parameters == null) return SQLquery;
	
		var parmCount = 0
			,parsedFunction = ""
			,SQLqueryAsCharArray = SQLquery.split("")
			,ESCfound = false;
		
		SQLqueryAsCharArray.each(function(achar) {
			if(ESCfound) {
				ESCfound = false;
				parsedFunction += achar;
			} else if(achar == '\\') {
				ESCfound = true;
			} else if(achar == '?') {
				if(queryBase.parameters[parmCount] != null) {
					var parm= queryBase.parameters[parmCount]
						,name= parm.name
						,pname = null;
					
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
		if(queryBase.commonTableExpressions.length > 0)
			queryBase.commonTableExpressions.each(function(commonTableExpressions) { 
				if(returnString.length > 0) returnString += ", ";
				returnString += commonTableExpressions; 
			} );

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
			columnDetail=queryBase.components.column[sortElement.column];
		    if(columnDetail!=null) 
			    if(columnDetail.generated!=null) {
			    	generateAction=columnDetail.generated.split(',');
					switch (generateAction[0]) {
						case 'normalize':
							orderBy += (orderBy.length==0 ? "ORDER BY " : " , ") 
									+	generateAction[1]
					    			+	" / nullif(" + generateAction[2]+",0)"
					    			+ (sortElement.direction.substr(0,1).toUpperCase() == "A" ? " ASC" : " DESC");
						    return;
						default:
							return;
		    		}
		    	}
			orderBy += (orderBy.length==0 ? "ORDER BY ":' , ') + sortElement.column + (sortElement.direction.substr(0,1).toUpperCase() == "A" ? " ASC" : " DESC");
		});
		return orderBy;
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
		var additionalWhere = queryBase.callTableManipulationModules('add2Where').join(' and ');
		if(additionalWhere.length > 0) whereClause+=(whereClause.length == 0?"":" and ")+additionalWhere;
		if(whereClause.length == 0) return "";
		return "WHERE " + whereClause;
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
	operator: {
		 "exists"			: function(column,op,value) {return "exists(" + value + ")";}
	 	,"not exists"		: function(column,op,value) {return "not exists(" + value + ")";}
	 	,"is"				: function(column,op,value) {return column.sql_name + " is null";}
	 	,"locate"			: function(column,op,value) {return " LOCATE("+columnTypeValueInsertion(column.fieldType,value)+","+ column.sql_name +") > 0";}
		,"locateanycase"	: function(column,op,value) {
			 	return " (LOCATE(upper("+columnTypeValueInsertion(column.fieldType,value)+"),"+ column.sql_name +",1) > 0"
			 			+ " or LOCATE(lower("+columnTypeValueInsertion(column.fieldType,value)+"),"+ column.sql_name +",1) > 0)";
			 }
	},
	buildCompareType: function(column,op,value) {
		if(this.operator[op.toLowerCase()]==null)
			return " " + column.sql_name + " " + op + " " + columnTypeValueInsertion(column.fieldType,value);
		return this.operator[op.toLowerCase()](column,op,value);
	},
	primaryKeyQuery: function(schema, tableName) {
		throw "primaryKeyQuery not declared in query builder";
	}
});
