/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009-2011 All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *********************************************************************************/

CORE_CLIENT_ACTIONS.set("chartNodalExplain",  Class.create(CORE_CLIENT_ACTIONS.get("chartNodal"), {
	initialize: function($super, callParameters) {
		if(callParameters.$chartTitle==undefined) callParameters.chartTitle="DB2 Visual Explain";
		callParameters.$report='XSL/chartNodalDefaultReport.xsl';
		callParameters.$transform='XSL/chartNodalExplain.xsl';
    	callParameters.$nodeControl=JS_BASE_DIRECTORY+"clientActions/chartNodalExplainNodeControl.xml";
    	callParameters.$greatestCostAttribute='TOTAL_COST';
    	callParameters.$settings='<messages>'
    							+'<SQL0440N>DB2TE Component not installed. Please install "DB2TE added Functions" in Tools -&gt; Installed Components</SQL0440N>'
    							+'<SQL0104N >Statement not explainable</SQL0104N >'
    							+'</messages>'
    							;
		this.tabSchema=callParameters.tabSchema;
		this.EXPLAIN_REQUESTER=callParameters.EXPLAIN_REQUESTER;
    	this.EXPLAIN_TIME=callParameters.EXPLAIN_TIME;
    	this.SOURCE_NAME=callParameters.SOURCE_NAME;
    	this.SOURCE_SCHEMA=callParameters.SOURCE_SCHEMA;
    	this.SOURCE_VERSION=callParameters.SOURCE_VERSION;
    	this.STMTNO=callParameters.STMTNO;
    	this.SECTNO=callParameters.SECTNO;
    	callParameters.$sourceType='db2Explain';
		$super(callParameters);
    	this.getParameter('explainMode');
    	if(this.explainMode!=null) 
			this.exitSQL="SET CURRENT EXPLAIN MODE NO";
    	this.getParameter('schema');
 		if(this.schema=='') this.schema=null;
	},
	
	getExplainStmtPredicate: function() {
		if(this.source == null)
			return " d.EXPLAIN_REQUESTER = '"+this.EXPLAIN_REQUESTER+"'"
							+   " AND d.EXPLAIN_TIME = timestamp('"+this.EXPLAIN_TIME+"')"
							+   " AND d.SOURCE_NAME = '"+this.SOURCE_NAME+"'" 
							+   " AND d.SOURCE_SCHEMA = '"+this.SOURCE_SCHEMA+"'"
							+   " AND d.SOURCE_VERSION = '"+this.SOURCE_VERSION+"'"
							+   " AND d.EXPLAIN_LEVEL='O'"
							+   " AND d.STMTNO = " + this.STMTNO     
							+   " AND d.SECTNO = " + this.SECTNO
							;
		return 'exists (select 1 from "'+this.tabSchema+'".explain_statement as o'
    						+ 		" where o.EXPLAIN_LEVEL='O' and o.queryno = 1 "
    						+ 	 	  " and o.querytag= '"+ this.explainTag + "'"
							+		  " and d.EXPLAIN_REQUESTER=o.EXPLAIN_REQUESTER"
							+		  " and d.EXPLAIN_TIME=o.EXPLAIN_TIME"
	    					+		  " and d.SOURCE_NAME=o.SOURCE_NAME"
	    					+		  " and d.SOURCE_SCHEMA=o.SOURCE_SCHEMA"
	    					+		  " and d.SOURCE_VERSION=o.SOURCE_VERSION"
	    					+		  " and d.EXPLAIN_LEVEL= o.EXPLAIN_LEVEL"
	    					+		  " and d.STMTNO=o.STMTNO"
	    					+		  " and d.SECTNO=o.SECTNO"
    						+		  " and o.EXPLAIN_TIME=(select max(EXPLAIN_TIME)"
    						+ 					' from "'+this.tabSchema+'".explain_statement as m '
	    					+					" where m.EXPLAIN_REQUESTER=o.EXPLAIN_REQUESTER"
	    					+					  " and m.SOURCE_NAME=o.SOURCE_NAME"
	    					+					  " and m.SOURCE_SCHEMA=o.SOURCE_SCHEMA"
	    					+					  " and m.SOURCE_VERSION=o.SOURCE_VERSION"
	    					+					  " and m.EXPLAIN_LEVEL='O'"
	    					+					  " and m.STMTNO=o.STMTNO"
	    					+					  " and m.SECTNO=o.SECTNO"
	    					+					")"	
	    					+	")"
	    					;
	
	},

	getExplainDiagXML: function(where) {
		return 'select  XML2CLOB('
			+ 	'XMLELEMENT(NAME "table"'
			+ 		',XMLELEMENT(NAME "td",d.DIAGNOSTIC_ID)'
			+ 		',XMLELEMENT(NAME "td",d.code)'
			+		',XMLELEMENT(NAME "td"'
			+			',XMLELEMENT(NAME "table"'
			+				',(select XMLAGG('
			+					'XMLELEMENT(NAME "tr"'
			+						',XMLELEMENT(NAME "tr"'
			+							',XMLELEMENT(NAME "td",ORDINAL)' 
			+							',XMLELEMENT(NAME "td",TOKEN)' 
			+							',XMLELEMENT(NAME "td",TOKEN_LONG)' 
			+							')'
			+						')'
			+					')'
			+				' from "'+ this.tabSchema + '".EXPLAIN_DIAGNOSTIC_DATA dd'
			+				' where dd.EXPLAIN_TIME=d.EXPLAIN_TIME'
			+		  		' and dd.EXPLAIN_REQUESTER=d.EXPLAIN_REQUESTER'
			+		 	 	' and dd.SOURCE_NAME=d.SOURCE_NAME'
			+		  		' and dd.SOURCE_SCHEMA=d.SOURCE_SCHEMA'
			+		  		' and dd.SOURCE_VERSION=d.SOURCE_VERSION'
			+		  		' and dd.EXPLAIN_LEVEL=d.EXPLAIN_LEVEL'
			+		  		' and dd.STMTNO=d.STMTNO'
			+		  		' and dd.SECTNO=d.SECTNO'
			+		  		' and dd.DIAGNOSTIC_ID=d.DIAGNOSTIC_ID'
			+				')'
			+			')'
			+		')'
			+	'))'
			+' FROM "'+ this.tabSchema + '".EXPLAIN_DIAGNOSTIC d' 
			+' WHERE ' + where
		;
	},
	
	getData: function() {
		this.setLoading();
		var sql=[];
		if(this.tabSchema==null) {
			this.setError('Explain tables schema (tabSchema) not specified');
			return;
		} 
		if(this.schema!=null)
			sql.push("SET CURRENT SCHEMA = '" + this.schema	+ "'");
		if(this.source !=null) {
			this.explainTag = 'db2mc#'+ this.elementUniqueID+this.parentStageID+this.parentWindowID+this.parentPanelID;
			this.explainTag = this.explainTag.substr(0,20);
			var deleteWhere	= " where ( EXPLAIN_REQUESTER,EXPLAIN_TIME,SOURCE_NAME,SOURCE_SCHEMA,SOURCE_VERSION)"
							+	  " = ( row.EXPLAIN_REQUESTER,row.EXPLAIN_TIME,row.SOURCE_NAME,row.SOURCE_SCHEMA,row.SOURCE_VERSION);";
			sql.push("BEGIN ATOMIC"
					+	" FOR ROW AS"
					+		" SELECT EXPLAIN_REQUESTER,EXPLAIN_TIME,SOURCE_NAME,SOURCE_SCHEMA,SOURCE_VERSION"
					+		' from "'+this.tabSchema+'".explain_statement'
					+  		" where querytag= '"+ this.explainTag + "'"
					+	" DO"
					+		' delete from "'+this.tabSchema+'".EXPLAIN_ARGUMENT'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_DIAGNOSTIC_DATA'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_DIAGNOSTIC'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_INSTANCE'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_OBJECT'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_OPERATOR'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_PREDICATE'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_STATEMENT'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".EXPLAIN_STREAM'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".ADVISE_INDEX'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".ADVISE_PARTITION'  + deleteWhere
					+		' delete from "'+this.tabSchema+'".ADVISE_MQT'  + deleteWhere
					+	" END FOR;"
					+ " END"
					);
	        if(this.explainMode!=null) 
	        	if(this.explainMode!='NO') 
	        		sql.push("SET CURRENT EXPLAIN MODE "+ this.explainMode);
			sql.push("EXPLAIN PLAN SELECTION SET QUERYNO = 1 SET QUERYTAG = '" + this.explainTag
					+ "' FOR " + (this.source.substr(0,1)=="[" ? this.source.split("]")[1] : this.source ));
	        if(this.explainMode!=null) 
	        		sql.push("SET CURRENT EXPLAIN MODE NO");
			sql.push('select "s#db2mc".explainExpandNode('
					+	 "cast('"+this.tabSchema+"' as VARCHAR(128))"
					+	",EXPLAIN_REQUESTER"
					+ 	",EXPLAIN_TIME"
					+ 	",SOURCE_NAME" 
					+ 	",SOURCE_SCHEMA"
					+	",SOURCE_VERSION"
					+ 	",cast('P' as CHAR(1) )"
					+ 	",STMTNO"
					+ 	",SECTNO"
					+ 	",cast('O' as CHAR(1) )"
					+ 	",cast(1 as INTEGER)"
					+ 	",cast(null as VARCHAR(128)),cast(null as VARCHAR(128))"
					+ 	")"
					+ ' from "'+this.tabSchema+'".explain_statement as o '
					+ "where o.EXPLAIN_LEVEL='O' and o.queryno = 1 "
					+  " and o.querytag= '"+ this.explainTag + "'"
					+  " and EXPLAIN_TIME=(select max(EXPLAIN_TIME)"
					+ 					' from "'+this.tabSchema+'".explain_statement as m '
  					+					" where m.EXPLAIN_REQUESTER=o.EXPLAIN_REQUESTER"
   					+					  " and m.SOURCE_NAME=o.SOURCE_NAME"
   					+					  " and m.SOURCE_SCHEMA=o.SOURCE_SCHEMA"
   					+					  " and m.SOURCE_VERSION=o.SOURCE_VERSION"
   					+					  " and m.EXPLAIN_LEVEL='O'"
   					+					  " and m.STMTNO=o.STMTNO"
   					+					  " and m.SECTNO=o.SECTNO"
   					+					")"
					);
		} else 
			sql.push('values ("s#db2mc".explainExpandNode('
					+ "cast('"+this.tabSchema+"' as VARCHAR(128))"
					+ ",cast('"+this.EXPLAIN_REQUESTER+"' as VARCHAR(128))"
    				+ ",timestamp('"+this.EXPLAIN_TIME+"')"
    				+ ",cast('"+this.SOURCE_NAME+"' as VARCHAR(128))" 
    				+ ",cast('"+this.SOURCE_SCHEMA+"' as VARCHAR(128))"
    				+ ",cast('"+this.SOURCE_VERSION+"' as VARCHAR(64))"
    				+ ",cast('P' as CHAR(1) )"
    				+ ",cast("+this.STMTNO+" as INTEGER)"
    				+ ",cast("+this.SECTNO+" as INTEGER)"
    				+ ",cast('O' as CHAR(1) )"
    				+ ",cast(1 as INTEGER)"
    				+ ",cast(null as VARCHAR(128)),cast(null as VARCHAR(128))"
    				+ "))"
    				);
		this.postGetXMLDataAJAXRequest('getSQLValue',sql);
	},

	getSetNodeRefresh: function (attrName,node) {
		var cost=0;
		for (var i=0;i<node.childNodes.length;i++) {
			nodeCost=this.getSetNodeRefresh(attrName,node.childNodes[i]);	
			if (nodeCost>cost) 
				cost=nodeCost;
		}
		if (node.attributes!=null) {
			var nodeCost=node.attributes.getNamedItem(attrName);
			if (nodeCost!=null) var cost=nodeCost.value;
		} 
		nodeCtl=this.getNodeControl(node.nodeName.toLowerCase());
		if (nodeCtl==undefined) return cost;
		attr = document.createAttribute('node__refreshInterval');
		attr.nodeValue=1000 - Math.round(500*(cost/this.totalCost));
		if(node.attributes==null) return 0;
		node.attributes.setNamedItem(attr);
		return cost;
	},

	menuOptions: function($super,menuArray) {
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_evaluateIndexes_button',
			elementValue : "Evaluate Indexes",
			elementAction : 'onClick="chartNodalActive.get(\'' + this.elementUniqueID +'\').setExplainMode(\'EVALUATE INDEXES\');"'
		});
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_recommendIndexes_button',
			elementValue : "Recommend Indexes",
			elementAction : 'onClick="chartNodalActive.get(\'' + this.elementUniqueID +'\').setExplainMode(\'RECOMMEND INDEXES\');"'
		});
		if(this.viewStmtRevised==null) {
			this.viewStmtRevised = new floatingPanel(this.elementUniqueID + '_viewStmtRevised', 'RAW', "", this.elementUniqueID + '_viewStmtRevised_button', false, false);
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).registerNestedObject(this.elementUniqueID + '_viewStmtRevised', this.viewStmtRevised);
			this.viewStmtRevised.setWidth('300px');
			this.viewStmtRevised.draw();
			this.viewStmtRevised.setContent("<img style='float:none;' src='images/loadingpage.gif'/>"
				, 'Revised Statement', null, null, null);
		}
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_viewStmtRevised_button',
			elementValue : "Revised Statement",
			elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_viewStmtRevised\').show_and_size(\'' + this.elementUniqueID + '_viewStmtRevised_button\');"'
		});
		if(this.viewDiagnostics==null) {
			this.viewDiagnostics = new floatingPanel(this.elementUniqueID + '_viewDiagnostics', 'RAW', "", this.elementUniqueID + '_viewDiagnostics_button', false, false);
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).registerNestedObject(this.elementUniqueID + '_viewDiagnostics', this.viewDiagnostics);
			this.viewDiagnostics.draw();
			this.viewDiagnostics.setContent("<img style='float:none;' src='images/loadingpage.gif'/>"
				, 'Diagnostics', null, null, null);
		}
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_viewDiagnostics_button',
			elementValue : "Diagnostics",
			elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_viewDiagnostics\').show_and_size(\'' + this.elementUniqueID + '_viewDiagnostics_button\');"'
		});
		if(this.viewStmt==null) {
			this.viewStmt = new floatingPanel(this.elementUniqueID + '_viewStmt', 'RAW', "", this.elementUniqueID + '_viewStmt_button', false, false);
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).registerNestedObject(this.elementUniqueID + '_viewStmt', this.viewStmt);
			this.viewStmt.draw();
			this.viewStmt.setContent(
					'<textarea class="text" cols="80" rows="20" wrap="false" />'
					+ this.source 
					+ '</textarea>'
				, 'Statement', null, null, null);
		}
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_viewStmt_button',
			elementValue : "Statement",
			elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_viewStmt\').show_and_size(\'' + this.elementUniqueID + '_viewStmt_button\');"'
		});
		if(this.source==null) 
			this.postGetContentAJAXRequest(this.viewStmt,'Statement'
				, "select '<textarea class=''text'' cols=''80'' rows=''20'' wrap=''false'' />'||d.STATEMENT_TEXT||'</textarea>' "
				+ ' from "'+this.tabSchema+'".explain_statement as d '
				+ ' where ' + this.getExplainStmtPredicate()
				);
		if(this.menuCost==null) {
			this.menuCost = new floatingPanel(this.elementUniqueID + '_menuCost', 'RAW', "", this.elementUniqueID + '_menuCost_button', false, false);
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).registerNestedObject(this.elementUniqueID + '_menuCost', this.menuCost);
			this.menuCost.draw();
			this.menuCost.setContent(
						'<table>'
					+	'<tr><td><input type="radio" name="'+this.elementUniqueID + '_menuCostInput'+'" onchange="chartNodalActive.get('+"'" + this.elementUniqueID +"'" + ').setGreatestCost(this.value)" value="TOTAL_COST" checked="checked" /></td><td>Total Cost</td></tr>'
  					+	'<tr><td><input type="radio" name="'+this.elementUniqueID + '_menuCostInput'+'" onchange="chartNodalActive.get('+"'" + this.elementUniqueID +"'" + ').setGreatestCost(this.value)" value="IO_Cost" /></td><td>IO</td></tr>'
  					+	'<tr><td><input type="radio" name="'+this.elementUniqueID + '_menuCostInput'+'" onchange="chartNodalActive.get('+"'" + this.elementUniqueID +"'" + ').setGreatestCost(this.value)" value="CPU_Cost" /></td><td>CPU</td></tr>'
					+	'</table>'
				, 'Great Cost Path', null, null, null);
		}
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_menuCost_button',
			elementValue : "Cost Path",
			elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_menuCost\').show_and_size(\'' + this.elementUniqueID + '_menuCost_button\');"'
		});
		if(this.menuSetSchema==null) {
			this.menuSetSchema = new floatingPanel(this.elementUniqueID + '_menuSetSchema', 'RAW', "", this.elementUniqueID + '_menuSetSchema_button', false, false);
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).registerNestedObject(this.elementUniqueID + '_menuSetSchema', this.menuSetSchema);
			this.menuSetSchema.draw();
			this.menuSetSchema.setContent(
						'<table>'
					+	'<tr><td>Schema:</td><td><input type="text" name="'+this.elementUniqueID + '_menuSetSchemaInput'+'" onchange="chartNodalActive.get('+"'" + this.elementUniqueID +"'" + ').setSchema(this.value)" value="'+(this.schema==null?'':this.schema)+'"/></td></tr>'
					+	'</table>'
				, 'Set Default Schema', null, null, null);
		}
		menuArray.push({
			nodeType : "leaf",
			elementID : this.elementUniqueID + '_menuSetSchema_button',
			elementValue : "Schema",
			elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_menuSetSchema\').show_and_size(\'' + this.elementUniqueID + '_menuSetSchema_button\');"'
		});
		return $super(menuArray);
	},

	setExplainMode: function(mode) {
		this.explainMode=mode;
		this.getData();
	},
	
	setGreatestCost: function($super,value) {
		this.totalCost=this.xmlData.childNodes[0].getAttribute(value);
		this.getSetNodeRefresh(value,this.xmlData.childNodes[0]);
		$super(value);
	},

	setSchema: function(schema) {
		if (schema=='') this.schema=null;
		else this.schema=schema;
		this.draw();
	},

	showArguments: function(operatorID) {
		var arguments = document.getElementById(this.elementUniqueID +'_arguments');
		this.postGetContentAJAXRequest(arguments,null
				, 'select coalesce(XML2CLOB(XMLAGG(XMLELEMENT(NAME "tr"'
					+ 			',XMLELEMENT(NAME "td",p.ARGUMENT_TYPE)'
					+ 			',XMLELEMENT(NAME "td",p.ARGUMENT_VALUE)'
					+ 			',XMLELEMENT(NAME "td",p.LONG_ARGUMENT_VALUE)'
					+	"))),'nil')"
					+ ' from "'+this.tabSchema+'".explain_statement as d'
					+ ' join "'+this.tabSchema+'".explain_argument P'
					+ '   on p.EXPLAIN_TIME=d.EXPLAIN_TIME'
					+ '  and p.EXPLAIN_REQUESTER=d.EXPLAIN_REQUESTER'
					+ '  and p.SOURCE_NAME=d.SOURCE_NAME'
					+ '  and p.SOURCE_SCHEMA=d.SOURCE_SCHEMA'
					+ '  and p.SOURCE_VERSION=d.SOURCE_VERSION'
					+ "  and p.EXPLAIN_LEVEL='P'"
					+ '  and p.STMTNO=d.STMTNO'
					+ '  and p.SECTNO=d.SECTNO'
					+ ' where p.operator_id = '+operatorID+' and ' + this.getExplainStmtPredicate()
					);
	},

	showNodeDetails: function ($super,callingEvent) {
		$super(callingEvent);
		if(this.currentNode==null) return;
		if(this.currentNode.nodeName=='operator') {
			var operatorId = this.currentNode.attributes.getNamedItem('__ID');
			if (operatorId!=null) {
				var aTable = document.createElement('table');
				aRow=aTable.insertRow(-1);
				aRow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="Get Predicates" onclick="chartNodalActive.get('+"'" + this.elementUniqueID +"'" + ').showPredicates('+operatorId.value+')"/>';
				aCell=aRow.insertCell(-1);
				var dTable = document.createElement('table');
				dTable.id=this.elementUniqueID +'_predicates';
				aCell.appendChild(dTable);
				aRow=aTable.insertRow(-1);
				aRow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="Get Arguments" onclick="chartNodalActive.get('+"'" + this.elementUniqueID +"'" + ').showArguments('+operatorId.value+')"/>';
				aCell=aRow.insertCell(-1);
				var dTable = document.createElement('table');
				dTable.id=this.elementUniqueID +'_arguments';
				aCell.appendChild(dTable);

				this.detailNode.insertRow(1).insertCell(-1).appendChild(aTable);
			}
		}
	},
	 
	showPredicates: function(operatorID) {
		var arguments = document.getElementById(this.elementUniqueID +'_predicates');
		this.postGetContentAJAXRequest(arguments,null
				, "select coalesce('<tr><th>How</th><th>When</th><th>Relop Type</th><th>SubQuery</th><th>Filter Factor</th><th>Predicate</th><th>Range</th></tr>'||"
					+		'XML2CLOB(XMLAGG(XMLELEMENT(NAME "tr"'
					+ 			',XMLELEMENT(NAME "td",p.HOW_APPLIED)'
					+ 			',XMLELEMENT(NAME "td",p.WHEN_EVALUATED)'
					+ 			',XMLELEMENT(NAME "td",p.RELOP_TYPE)'
					+ 			',XMLELEMENT(NAME "td",p.SUBQUERY)'
					+ 			',XMLELEMENT(NAME "td",p.FILTER_FACTOR)'
					+ 			',XMLELEMENT(NAME "td",p.PREDICATE_TEXT)'
					+ 			',XMLELEMENT(NAME "td",p.RANGE_NUM)'
					+	"))),'nil')"
					+ ' from "'+this.tabSchema+'".explain_statement as d'
					+ ' join "'+this.tabSchema+'".explain_predicate P'
					+ '   on p.EXPLAIN_TIME=d.EXPLAIN_TIME'
					+ '  and p.EXPLAIN_REQUESTER=d.EXPLAIN_REQUESTER'
					+ '  and p.SOURCE_NAME=d.SOURCE_NAME'
					+ '  and p.SOURCE_SCHEMA=d.SOURCE_SCHEMA'
					+ '  and p.SOURCE_VERSION=d.SOURCE_VERSION'
					+ "  and p.EXPLAIN_LEVEL='P'"
					+ '  and p.STMTNO=d.STMTNO'
					+ '  and p.SECTNO=d.SECTNO'
					+ ' where p.operator_id = '+operatorID+' and ' + this.getExplainStmtPredicate()
					);

	},   

	updateData: function ($super,data) {
		this.postGetContentAJAXRequest(this.viewDiagnostics,'Diagnostics',this.getExplainDiagXML(this.getExplainStmtPredicate())	);
		this.postGetContentAJAXRequest(this.viewStmtRevised,'Statement Revised'
			, "select '<textarea class=''text'' cols=''80'' rows=''20'' wrap=''false'' />'||coalesce(e.STATEMENT_TEXT,p.STATEMENT_TEXT,d.STATEMENT_TEXT)||'</textarea>' "
			+ ' from "'+this.tabSchema+'".explain_statement as d '
			+ ' left join "'+this.tabSchema+'".explain_statement P'
			+ '   on p.EXPLAIN_TIME=d.EXPLAIN_TIME'
			+ '  and p.EXPLAIN_REQUESTER=d.EXPLAIN_REQUESTER'
			+ '  and p.SOURCE_NAME=d.SOURCE_NAME'
			+ '  and p.SOURCE_SCHEMA=d.SOURCE_SCHEMA'
			+ '  and p.SOURCE_VERSION=d.SOURCE_VERSION'
			+ "  and p.EXPLAIN_LEVEL='P'"
			+ '  and p.STMTNO=d.STMTNO'
			+ '  and p.SECTNO=d.SECTNO'
			+ ' left join "'+this.tabSchema+'".explain_statement e'
			+ '   on e.EXPLAIN_TIME=d.EXPLAIN_TIME'
			+ '  and e.EXPLAIN_REQUESTER=d.EXPLAIN_REQUESTER'
			+ '  and e.SOURCE_NAME=d.SOURCE_NAME'
			+ '  and e.SOURCE_SCHEMA=d.SOURCE_SCHEMA'
			+ '  and e.SOURCE_VERSION=d.SOURCE_VERSION'
			+ "  and e.EXPLAIN_LEVEL='E'"
			+ '  and e.STMTNO=d.STMTNO'
			+ '  and e.SECTNO=d.SECTNO'
			+ ' where ' + this.getExplainStmtPredicate()
			);
		$super(data);
	}
}));