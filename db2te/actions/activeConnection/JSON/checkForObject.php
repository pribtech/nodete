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
TE_check_session_timeout();

/**
 * Use case: How to use this as an exitAction on a page
 	<exitAction name="checkForPostaltxsTable" type="serverAction">
 		<parameterList>
  		<parameter name="action" type="fixed">
				<value>checkForObject</value>
			</parameter>
			<parameter name="objectType" type="fixed">
				<value>table</value>
			</parameter>
			<parameter name="object[schema]" type="raw">
				<value>CHEUNGK</value>
			</parameter>
			<parameter name="object[table]" type="raw">
				<value>EMPLOYEE</value>
			</parameter>
		</parameterList>
  </exitAction>
 *
 */
$objectType = getParameter('objectType');
$object = getParameter('object');

$returnObject = array();

$returnObject['returnCode'] = "false";
$returnObject['returnObject'] = 0;

if($objectType == null || !is_array($object) || connectionManager::getDBMS()=="ssh") {
	echo json_encode($returnObject);
	exit;
}

$objectType = strtolower($objectType);
$query = "SELECT count(*) FROM SYSCAT.";
switch ($objectType) {
	case "schema":
		if(isset($object["schema"])) {
			$schema = strtoupper($object["schema"]);
			$query .= "SCHEMATA WHERE SCHEMANAME = '$schema'";
		}
		break;
	case "table":
		if(isset($object["schema"]) && isset($object["table"])) {
			$schema = strtoupper($object["schema"]);
			$table = strtoupper($object["table"]);
			$query .= "TABLES WHERE TABSCHEMA = '$schema' AND TABNAME = '$table'";
		}
		break;
	case "column":
		if(isset($object["schema"]) && isset($object["table"]) && isset($object["column"])) {
			$schema = strtoupper($object["schema"]);
			$table = strtoupper($object["table"]);
			$column = strtoupper($object["column"]);
			if (isset($object["datatype"]) && isset($object["length"])) {
				$datatype = strtoupper($object["datatype"]);
				$length = strtoupper($object["length"]);
				$query .= "COLUMNS WHERE TABSCHEMA = '$schema' AND TABNAME = '$table' AND COLNAME = '$column' AND TYPENAME = '$datatype' AND LENGTH = $length";
			} else
				$query .= "COLUMNS WHERE TABSCHEMA = '$schema' AND TABNAME = '$table' AND COLNAME = '$column'";
		}
		break;
	case "storedprocedure":
		if(isset($object["schema"]) && isset($object["storedprocedure"])) {
			$schema = strtoupper($object["schema"]);
			$storedprocedure = strtoupper($object["storedprocedure"]);
			$query .= "PROCEDURES WHERE  PROCNAME = '$storedprocedure' AND PROCSCHEMA = '$schema'";		}
		break;
	case "index":	
		if(isset($object["schema"]) && isset($object["index"])) {	
			$schema = strtoupper($object["schema"]);
			$index = strtoupper($object["index"]);
			$query .= "INDEXES WHERE INDSCHEMA = '$schema' AND INDNAME = '$index'";
		}
		break;
	case "trigger":	
		if(isset($object["schema"]) && isset($object["trigger"])) {	
			$schema = strtoupper($object["schema"]);
			$trigger = strtoupper($object["trigger"]);
			$query .= "TRIGGERS WHERE TRIGSCHEMA = '$schema' AND TRIGNAME = '$trigger'";
		}
		break;
	case "view":	
		if(isset($object["schema"]) && isset($object["view"]))	{	
			$schema = strtoupper($object["schema"]);
			$view = strtoupper($object["view"]);
			$query .= "VIEWS WHERE VIEWSCHEMA = '$schema' AND VIEWNAME = '$view'";
		}
		break;
	case "sequence":	
		if(isset($object["schema"]) && isset($object["sequence"]))  {	
			$schema = strtoupper($object["schema"]);
			$sequence = strtoupper($object["sequence"]);
			$query .= "SEQUENCES WHERE SEQSCHEMA = '$schema' AND SEQNAME = '$sequence'";
		}
		break;
	case "function":	
		if(isset($object["schema"]) && isset($object["function"])) {	
			$schema = strtoupper($object["schema"]);
			$function = strtoupper($object["function"]);
			$query .= "FUNCTIONS WHERE FUNCSCHEMA = '$schema' AND FUNCNAME = '$function'";
		}
		break;	
	case "datatype":	
		if(isset($object["schema"]) && isset($object["datatype"])) {	
			$schema = strtoupper($object["schema"]);
			$datatype = strtoupper($object["datatype"]);
			$query .= "DATATYPES WHERE TYPESCHEMA = '$schema' AND TYPENAME = '$datatype'";
		}
		break;
	case "transform":	
		if(isset($object["schema"]) && isset($object["datatype"]) && isset($object["function"])) {	
			$schema = strtoupper($object["schema"]);
			$datatype = strtoupper($object["datatype"]);
			$function = strtoupper($object["function"]);
			$query .= "TRANSFORMS WHERE TYPESCHEMA = '$schema' AND TYPENAME = '$datatype' AND FUNCSCHEMA = '$schema' AND FUNCNAME = '$function'";
		}
		break;
	case "tablespace":	
		if(isset($object["tablespace"])) {	
			$tablespace = strtoupper($object["tablespace"]);
			$query .= "TABLESPACES WHERE TBSPACE = '$tablespace' ";
		}
		break;
	default:
		echo <<<JSON
	{
		returnCode: "false",
		returnValue: 0
	}
JSON;
		exit;
}

$statment = connectionManager::getNewStatement($query);

if($statment->errorMsg() == "") {
	$resultRow = $statment->fetch();
	
	if($resultRow != false) {
		if($resultRow[0] > 0) {
			$returnObject['returnCode'] = "true";
			$returnObject['returnObject'] = 1;
		}
	} else 
		$returnObject['returnObject'] = "No result returned";
} else {
	$returnObject['returnCode'] = $statment->sqlstate;
	$returnObject['returnObject'] = $statment->sqlerror;
	$returnObject['statement'] = $query;
}

echo json_encode($returnObject);