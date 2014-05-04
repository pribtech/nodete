<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
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

function RetrieveXMLDefinitionfromDB($table, $schema) {

	switch ( connectionManager::getDBMS() ) {
		case "postgreSQL":
		   	$getXMLDefType = connectionManager::getConnection()->getXMLDefType();
    		$getXMLDefSqlName = connectionManager::getConnection()->getXMLDefSqlName();
    		$getXMLDefColumnsTable = connectionManager::getConnection()->getXMLDefColumnsTable();
    		$getXMLserializeDocument = connectionManager::getConnection()->getXMLserializeDocument();
    		$getXMLDefSerializeReturnType = connectionManager::getConnection()->getXMLDefSerializeReturnType();
		
			$xquery1 = <<<END
SELECT 
	XMLSERIALIZE( $getXMLserializeDocument
 		XMLELEMENT ( NAME "table"
 		    ,XMLATTRIBUTES(translate(initcap(translate('$table','_',' ')),' ','')  as "name")
	 		,XMLELEMENT ( NAME "sqlName",'$schema.$table')
	 		,XMLELEMENT ( NAME "singularName",initcap(translate('$table','_',' ')))
 			,XMLELEMENT ( NAME "pluralName",initcap(translate('$table','_',' ')))
 			,XMLELEMENT ( NAME "description",'')
 			,XMLELEMENT ( NAME "displayColumns"
 				,XMLAGG(
 					XMLELEMENT ( NAME "col", XMLATTRIBUTES('column' as "type" , t.COLNAME as "name") )
 					)
 				)
	 		,XMLAGG(
 				XMLELEMENT ( NAME "column"
 					,XMLATTRIBUTES(t.COLNAME as "name") 
 					,XMLELEMENT ( NAME "sqlName",t.COLNAME)
 					,XMLELEMENT ( NAME "title",initcap(translate(t.COLNAME,'_',' ')))
 					,XMLELEMENT ( NAME "type",(select lower(typcategory) from pg_type ty join pg_namespace n on n.oid=ty.typnamespace where n.nspname=t.udt_SCHEMA and ty.typname=t.udt_name ))
 					) 
 				)
			,(	select  
					XMLAGG(
						XMLELEMENT ( NAME "reference"
							,XMLATTRIBUTES(r.constraint_name as "name")
							,XMLELEMENT ( NAME "title",r.constraint_name)
							,XMLELEMENT ( NAME "reftype",'table')
							,XMLELEMENT ( NAME "refvalue",'')
							,XMLELEMENT ( NAME "frame",'main')
							,XMLELEMENT ( NAME "window",'_blank')
							,XMLELEMENT ( NAME "icon",'images/icon-link-calendar.gif')
							,XMLELEMENT ( NAME "ref"
								,XMLATTRIBUTES('schema' as "foreignColumnName")
								,XMLELEMENT ( NAME "value",ct.table_schema)
								)
							,XMLELEMENT ( NAME "ref"
								,XMLATTRIBUTES('table' as "foreignColumnName")
								,XMLELEMENT ( NAME "value",ct.table_name )
								)
							,(	select 
									XMLAGG(
										XMLELEMENT ( NAME "ref"
											,XMLATTRIBUTES(p.column_name as "foreignColumnName")
											,XMLELEMENT ( NAME "localColumnName", c.column_name)
											)
										)
								from information_schema.key_column_usage p
								where p.ordinal_position = c.position_in_unique_constraint
								  and p.constraint_name = r.unique_constraint_name
								)
							)
						)	
				from information_schema.key_column_usage c
				join information_schema.referential_constraints r
				  on r.constraint_name = c.constraint_name
				join information_schema.constraint_column_usage AS ct
				  on ct.constraint_name = c.constraint_name
				where c.table_schema = '$schema'
				  and c.table_name =  '$table'
				)
 			) AS $getXMLDefSerializeReturnType 
 		) as out
FROM $getXMLDefColumnsTable t 
WHERE TABSCHEMA = '$schema'
  AND TABNAME = '$table'
END;
			break;
		case "ORACLE":
		   	$getXMLDefType = connectionManager::getConnection()->getXMLDefType();
    		$getXMLDefSqlName = connectionManager::getConnection()->getXMLDefSqlName();
    		$getXMLDefColumnsTable = connectionManager::getConnection()->getXMLDefColumnsTable();
    		$getXMLserializeDocument = connectionManager::getConnection()->getXMLserializeDocument();
    		$getXMLDefSerializeReturnType = connectionManager::getConnection()->getXMLDefSerializeReturnType();
		
			$xquery1 = <<<END
SELECT 
XMLSERIALIZE( $getXMLserializeDocument
XMLQUERY(' 
	 let \$cols := \$i/cols/*
	 let \$table := "$table"
	 let \$a := """$schema"".""$table"""
	 let \$n := "$schema.$table"
     return if(\$n = ".") then ""
     		else if(\$a = ".") then ""
            else
	     <table name="{\$n}">
	      <sqlName>{\$a}</sqlName>
              <singularName>{\$a}</singularName>
              <pluralName>{\$a}</pluralName>
              <description></description>
              <disableEdit/>
              <displayColumns>
               {
		  for \$c in \$cols
		  return <col type="column" name="{lower-case(\$c/column/text())}"/>
              }
              </displayColumns>
              {
		  for \$c in \$cols
		  return <column name="{lower-case(\$c/column/text())}"  dbType="{\$c/type/text()}">
			   <sqlName>{
				let \$type := \$c/type/text()
				let \$columnName := fn:concat(''"'', \$c/column/text(), ''"'')
				return $getXMLDefSqlName
			   }</sqlName>
			   <title>{
			   	for \$w in lower-case(translate(\$c/column/text(),''_'','' ''))
			   	return concat( upper-case(substring(\$w,1,1)) , substring(\$w,2) ) 
			   }</title>
			   <type dbType="{\$c/type/text()}">

			   {
				let \$type := \$c/type/text()
				return $getXMLDefType
			   }
				</type>
			   {
				let \$type := \$c/type/text()
				return if(\$type = "CHARACTER" or \$type = "VARCHAR") then <drillEnable/> else ''''
			   }
			 </column>
              }
	    </table>'
passing indata as "i" 
RETURNING SEQUENCE) $getXMLDefSerializeReturnType
) as out

from ( SELECT XMLELEMENT ( NAME "cols",
		xmlagg(
			XMLELEMENT ( NAME "info", XMLELEMENT ( NAME "schema", t.TABSCHEMA ), XMLELEMENT ( NAME "table", t.TABNAME ), XMLELEMENT ( NAME "column", t.COLNAME ), XMLELEMENT ( NAME "type", t.TYPENAME ) ) 
			order by colno
      ))  as indata
FROM $getXMLDefColumnsTable t 
WHERE TABSCHEMA = '$schema'
  AND TABNAME = '$table'
) b
			
END;
			break;
		default:
			$xquery1 = <<<END
VALUES(
XMLSERIALIZE(  
XMLQUERY('
     let \$cols := db2-fn:sqlquery(''
                    SELECT
				      XMLELEMENT (
				          NAME "info",
					  	  XMLELEMENT (
					  		NAME "schema",
							t.TABSCHEMA
					  	  ),
					  	  XMLELEMENT (
					  		NAME "table",
							t.TABNAME
					  	  ),
					  	  XMLELEMENT (
							NAME "column",
							t.COLNAME
					  ),
					  XMLELEMENT (
						NAME "type",
						t.TYPENAME
					  )
				       )
				FROM SYSCAT.COLUMNS t
				WHERE TABSCHEMA = ''''$schema''''
				AND TABNAME = ''''$table''''
				AND TYPENAME != ''''BLOB''''
        ORDER BY t.COLNO asc
     '')
     let \$references := db2-fn:sqlquery(''select  
					XMLAGG(
						XMLELEMENT ( NAME "reference"
							,XMLATTRIBUTES(p.RELNAME as "name")
							,XMLELEMENT ( NAME "title",p.RELNAME)
							,XMLELEMENT ( NAME "reftype",''''table'''')
							,XMLELEMENT ( NAME "refvalue",'''''''')
							,XMLELEMENT ( NAME "frame",''''main'''')
							,XMLELEMENT ( NAME "window",''''_blank'''')
							,XMLELEMENT ( NAME "icon",''''images/icon-link-calendar.gif'''')
							,XMLELEMENT ( NAME "ref"
								,XMLATTRIBUTES(''''schema'''' as "foreignColumnName")
								,XMLELEMENT ( NAME "value",p.REFTBCREATOR)
								)
							,XMLELEMENT ( NAME "ref"
								,XMLATTRIBUTES(''''table'''' as "foreignColumnName")
								,XMLELEMENT ( NAME "value",p.REFTBNAME)
								)
							,(	select 
									XMLAGG(
										XMLELEMENT ( NAME "ref"
											,XMLATTRIBUTES(c.FKCOLUMN_NAME as "foreignColumnName")
											,XMLELEMENT ( NAME "localColumnName", c.PKCOLUMN_NAME)
											)
										)
								from SYSIBM.SQLFOREIGNKEYS c
								where (c.PKTABLE_SCHEM,c.PKTABLE_NAME,c.PK_NAME)
								  	=(p.CREATOR,p.TBNAME,p.RELNAME)
								)
							)
						)	
				from SYSIBM.SYSRELS p
				where (p.CREATOR, p.TBNAME)=(''''$schema'''', ''''$table'''')
		    '')
	 let \$n := string-join(("""", normalize-space(\$cols[1]/schema/text()), """.""", normalize-space(\$cols[1]/table/text()), """"), "")
     let \$a := string-join((normalize-space(\$cols[1]/schema/text()), normalize-space(\$cols[1]/table/text())), ".")
     return if(\$n = ".") then ""
     		else if(\$a = ".") then ""
            else
	     <table name="{\$a}">
	      <sqlName>{\$n}</sqlName>
              <singularName>{\$a}</singularName>
              <pluralName>{\$a}</pluralName>
              <description></description>
              <disableEdit/>
              <displayColumns>
               {
		  for \$c in \$cols
		  return <col type="column" name="{lower-case(\$c/column/text())}"/>
              }
              </displayColumns>
              {
		  for \$c in \$cols
		  return <column name="{lower-case(\$c/column/text())}">
			   <sqlName>"{
				let \$type := \$c/type/text()
				return if(\$type = "LONG VARGRAPHIC" or \$type = "GRAPHIC" or \$type = "VARGRAPHIC") then fn:concat(''cast('', \$c/column/text(), '' as clob)'')
			               else \$c/column/text()
			   }"</sqlName>
			   <title>{
			   	for \$w in tokenize(lower-case(translate(\$c/column/text(),''_'','' '')), ''\\s+'')
			   	return concat( upper-case(substring(\$w,1,1)) , substring(\$w,2) ) 
			   }</title>
			   <type dbType="{\$c/type/text()}">

			   {
				let \$type := \$c/type/text()
				return if(\$type = "LONG VARCHAR" or \$type = "CLOB") then ''l''
			      	       else if(\$type = "CHARACTER" or \$type = "VARCHAR" or \$type = "VARCHAR2") then ''s''
			               else if(\$type = "BLOB" or \$type = "XML" ) then ''l''
			               else ''n''
			   }
				</type>
			   {
				let \$type := \$c/type/text()
				return if(\$type = "CHARACTER" or \$type = "VARCHAR") then <drillEnable/> else ''''
			   }
			 </column>
              }
			 {\$references}
						</table>'
	    RETURNING SEQUENCE) AS CLOB(2M))
)
END;

	}
	$result = connectionManager::getNewStatement($xquery1, FALSE, FALSE);
	if(!$result->execSuccessful()) throw new Exception($result->sqlerror." statement: ".$xquery1);
	
	$xml_string = "";

	if($row = $result->fetch())
		$xml_string .= connectionManager::getConnection()->getDBMS()=='ORACLE' ? $row[0]->load() :  $row[0] ;
	//Obtain XML String
	$temp = explode('\n', $xml_string);
	if($temp === false) 
		$xml_string = null;
	else if('<table name=".">' == $temp[0]) 
		$xml_string = null;

	//Close the Connection
	return $xml_string == null? RetrieveXMLDefinitionUsingSelectfromDB($table, $schema) : $xml_string;
}

function RetrieveXMLDefinitionUsingSelectfromDB($table, $schema) {

	$xml_string = "";
	if($schema != "")
		$schema .= '.';
		
	$query = "SELECT * FROM {$schema}{$table}";
	$statment = connectionManager::getNewStatement($query);

	if($statment->errorMsg() == "") {
		$columns = "";
		$displayColumns = "";
		
		$columnInfo = $statment->getColumnInfo();
		$i = 0;
		for($i = 0; $i < $columnInfo['num']; $i++) {
			$columns .= '<col type="column" name="' . $columnInfo['name'][$i] . "\"/>\n";
			
			$displayColumns .= '<column name="' . $columnInfo['name'][$i] . "\">\n";
			$displayColumns .= '		<sqlName>"' . $columnInfo['name'][$i] . '"</sqlName>\n';
			$displayColumns .= '		<title>' . ucwords(strtolower(str_replace('_',' ',$columnInfo['name'][$i]))) . "</title>\n";
			$displayColumns .= '		<type>';
			
			if(preg_match('/long varchar|clob|blob|xml/', $columnInfo['type'][$i]))
				$displayColumns .= 'y';
			else if(preg_match('/char|string|/', $columnInfo['type'][$i]))
				$displayColumns .= '';
			else
				$displayColumns .= 'n';
			$displayColumns .= '</type>\n';
			if(preg_match('/char|string|date/', $columnInfo['type'][$i] != null))
				$displayColumns .= '<drillEnable/>';
			$displayColumns .= "	</column>\n";	
	    }
	  	
		$xml_string .= "<table name='{$schema}{$table}'>\n";
		$xml_string .= "	<sqlName>{$schema}{$table}</sqlName>\n";
	    $xml_string .= "	<singularName>{$schema}{$table}</singularName>\n";
	    $xml_string .= "	<pluralName>{$schema}{$table}</pluralName>\n";
	    $xml_string .= "	<description></description>\n";
	    $xml_string .= '	<!-- <orderBy name="acolumn" direction="A"/> -->\n';
	    $xml_string .= "	<displayColumns>\n";
	    $xml_string .= $columns;
	    $xml_string .= "	</displayColumns>\n";
	    $xml_string .= $displayColumns;
		$xml_string .= "</table>";
	}
	
	return $xml_string;
}

function RetrieveProcXMLDefinitionfromDB($proc, $schema) {

	$xquery1 = <<<END
VALUES(
XMLSERIALIZE(
XMLQUERY('
     let \$cols := db2-fn:sqlquery(''
		SELECT
			XMLELEMENT
			(
				NAME "info",
				XMLELEMENT
				(
					NAME "schema",
					t.PROCSCHEMA
				),
				XMLELEMENT
				(
					NAME "table",
					t.PROCNAME
				),
				XMLELEMENT
				(
					NAME "column",
					t.PARMNAME
				),
				XMLELEMENT
				(
					NAME "type",
					t.TYPENAME
				),
				XMLELEMENT
				(
					NAME "ordinal",
					t.ORDINAL
				),
				XMLELEMENT
				(
					NAME "mode",
					t.PARM_MODE
				)
			)
				FROM SYSCAT.PROCPARMS AS t
				WHERE PROCSCHEMA = ''''$schema''''
				AND PROCNAME = ''''$proc''''
        ORDER BY t.ORDINAL asc
     '')
     let \$n := string-join("""", (normalize-space(\$cols[1]/schema/text()), """.""", normalize-space(\$cols[1]/table/text())), """","")
     return if(\$n = ".") then ""
            else
		<table name="{\$n}">
			<sqlName>{\$n}</sqlName>
			<singularName>{\$n}</singularName>
			<pluralName>{\$n}</pluralName>
			<function>{\$n}</function>
			<description></description>
			<parameters>

              {
		  for \$c in \$cols
		  return <parm name="{\$c/column/text()}" ordinal="{\$c/ordinal/text()}" mode="{\$c/mode/text()}">
			   <title>
			   {
			   	for \$w in tokenize(lower-case(translate(\$c/column/text(),''_'','' '')), ''\\s+'')
			   	return concat( upper-case(substring(\$w,1,1)) , substring(\$w,2) ) 
			   }
			   </title>
			   <type>{\$c/type/text()}</type>
			</parm>
              }
			</parameters>
		</table>'
	    RETURNING SEQUENCE) AS CLOB(2M)))
END;


	$result = connectionManager::getNewStatement($xquery1, FALSE, FALSE);

	$xml_string = "";

	if($row = $result->fetch())
	{
		$xml_string .= $row[0];
	}//Obtain XML String

	//Close the Connection
	return $xml_string;

}
