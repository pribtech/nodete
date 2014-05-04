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
TABLE_COLUMN_RENDERING_MODULES.set("Put here the group name, should be the same as what is used in the component name when parsing the XML", {
	
	//The following two item are requiered to dispaly and render a given column
	groupTitle: "Put here the group title to be displayed",
	render: function(tableObject, rowToRender, referenceObject, maskingColumn) {
		var HTMLString = "An HTML string which will be placed in the cell and be displayed on row render";
		return HTMLString;
	},
	
	//This function is called when first loading the table to determin if a given column has any errors which may cause problems
	// inclution of this function is optional
	columnCheck: function(baseTableObject, columnName) {
		
		
	},
	
	/***************************************************
	 *	 Important note about string returns
	 * Do not add a trailing or leading comma to you 
	 * return string, the query builder will take care 
	 * of it. Doing so will probably break something 
	 * somewhere sometime.
	 **************************************************/
	
	//Indicates if this column type requiers common table Expressions to be included in the general query
	containsCommonTableExpressionsForQuery : false,
	//returns a list of common table expressions which will be inclued in the general query
	commonTableExpressionsQueryPortion : function(baseTableObject) { return "";},
	
	//Indicates if this column type requiers column data to be returned in the general query
	containsColumnForQuery : false, // boolean
	//return a list of columns to be retrived which will be appended to the column section of the select statment
	columnQueryPortion : function(baseTableObject) { return "";},
	
	//Indicates if this column type requiers tables to be included in the general query
	containsTablesForQuery : false, // boolean
	//return a table to be added to the from section of the query
	tablesForQueryPortion : function(baseTableObject) { return "";},
	
	// will alow you to start you query with a join clause which will be attatched to the current table set
	containsTableForJoinInQuery : false, // boolean
	//return a table to be joined to the main table
	tableForJoinInQuery : function(baseTableObject, rootTable) { return rootTable;},
	
	//Indicates if this column type requiers where clauses to be included in the general query
	containsWhereClauseForQuery : false, // boolean
	//return a where clause portion to be added with other where clauses
	whereClauseQueryPortion : function(baseTableObject) { return "";},
	
	
	
	//Indicates if this column type requiers a secondary query to be run outside of the primary query
	ContainsSecondaryQueries : false, // boolean
	//return an array of secondary query to be executed
	secondaryQueries : function(baseTableObject) { return null;},
	processSecondaryQueriesReturn : function(baseTableObject, STMTReturnArray) { return null;}

});