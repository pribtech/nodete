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
				<value>checkForObjectWithCase</value>
			</parameter>
			<parameter name="objectType" type="raw">
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

function testObject($object,$member) {
	if(isset($object[$member])) return;
	throw new Exception("No object member ".$member." specifed, object array: ".var_export($object,true));
}

function processObject($objectType,$object,$returnObject) {
	if($objectType == null || !is_array($object)) 
		throw new Exception("No objectType specifed or object not an array");

	$objectType = strtolower($objectType);
	if(connectionManager::getDBMS()=="ssh") 
		switch($objectType) {
			case "file":
				testObject($object,"file");
				$query = "if [ -f ".$object["file"]." ] ; then echo 1; fi";
				break;
			case "directory":
				testObject($object,"directory");
				$query = "if [ -d ".$object["directory"]." ] ; then echo 1; fi";
				break;
			case "sshpassphraseless":	
				testObject($object,"host");
				$query = 'ssh '.$object["host"].' -o "StrictHostKeyChecking no" -o "BatchMode yes" echo 1';
				break;
			case "writeaccess":
				testObject($object,"file");
				$query = "if [ -w ".$object["file"]." ] ; then echo 1; fi";
				break;
			case "readaccess":
				testObject($object,"file");
				$query = "if [ -r ".$object["file"]." ] ; then echo 1; fi";
				break;
			case "executable":
				testObject($object,"file");
				$query = "if [ -e ".$object["file"]." ] ; then echo 1; fi";
				break;
			case "newer":
				testObject($object,"file1");
				testObject($object,"file2");
				$query = "if [  ".$object["file1"]." -nt ".$object["file2"]." ] ; then echo 1; fi";
				break;	
			case "older":
				testObject($object,"file1");
				testObject($object,"file2");
				$query = "if [  ".$object["file1"]." -ot ".$object["file2"]." ] ; then echo 1; fi";
				break;
			case "insecuritygroup":
				testObject($object,"group");
				$query = "id | grep -c \"\(".$object["group"]."\)\"";
				break;
			default:
				throw new Exception("Unknown object type ".$objectType);
		}
	else {
		$query = "SELECT count(*) FROM SYSCAT.";
		switch($objectType) {
			case "schema":
				testObject($object,"schema");
				$query .= "SCHEMATA WHERE SCHEMANAME = '".$object["schema"]."'";
				break;
			case "table":
				testObject($object,"schema");
				testObject($object,"table");
				$query .= "TABLES WHERE TABSCHEMA = '".$object["schema"]."' AND TABNAME = '".$object["table"]."'";
				break;
			case "column":
				testObject($object,"schema");
				testObject($object,"table");
				testObject($object,"column");
				if (isset($object["datatype"]) && isset($object["length"])) 
					$query .= " AND TYPENAME = '".$object["datatype"]."' AND LENGTH = ".$object["length"];
				else
					$query .= "COLUMNS WHERE TABSCHEMA = '".$object["schema"]."' AND TABNAME = '".$object["table"]."' AND COLNAME = '".$object["column"]."'";
				break;
			case "storedprocedure":
				testObject($object,"schema");
				testObject($object,"storedprocedure");
				$query .= "PROCEDURES WHERE  PROCNAME = '".$object["storedprocedure"]."' AND PROCSCHEMA = '".$object["schema"]."'";
				break;
			case "index":	
				testObject($object,"schema");
				testObject($object,"index");
				$query .= "INDEXES WHERE INDSCHEMA = '".$object["schema"]."' AND INDNAME = '".$object["index"]."'";
				break;
			case "trigger":	
				testObject($object,"schema");
				testObject($object,"trigger");
				$query .= "TRIGGERS WHERE TRIGSCHEMA = '".$object["schema"]."' AND TRIGNAME = '".$object["trigger"]."'";
				break;
			case "view":	
				testObject($object,"schema");
				testObject($object,"view");
				$query .= "VIEWS WHERE VIEWSCHEMA = '".$object["schema"]."' AND VIEWNAME = '".$object["view"]."'";
				break;
			case "sequence":	
				testObject($object,"schema");
				testObject($object,"sequence");
				$query .= "SEQUENCES WHERE SEQSCHEMA = '".$object["schema"]."' AND SEQNAME = '".$object["sequence"]."'";
				break;
			case "function":	
				testObject($object,"schema");
				testObject($object,"function");
				$query .= "FUNCTIONS WHERE FUNCSCHEMA = '".$object["schema"]."' AND FUNCNAME = '".$object["function"]."'";
				break;	
			case "datatype":	
				testObject($object,"schema");
				testObject($object,"datatype");
				$query .= "DATATYPES WHERE TYPESCHEMA = '".$object["schema"]."' AND TYPENAME = '".$object["datatype"]."'";
				break;
			case "transform":	
				testObject($object,"schema");
				testObject($object,"datatype");
				testObject($object,"function");
				$query .= "TRANSFORMS WHERE TYPESCHEMA = '".$object["schema"]."' AND TYPENAME = '".$object["datatype"]."' AND FUNCSCHEMA = '".$object["schema"]."' AND FUNCNAME = '".$object["function"]."'";
				break;
			case "tablespace":	
				testObject($object,"tablespace");
				$query .= "TABLESPACES WHERE TBSPACE = '".$object["tablespace"]."' ";
				break;
			default:
				throw new Exception("Unknown object type ".$objectType);
		}
	} 
	$returnObject['query']=$query;
	$statment = connectionManager::getNewStatement($query);

	if($statment->errorMsg() != "")
		throw new Exception("sqlstate: ".$statment->sqlstate." message: ".$statment->sqlerror);

	$resultRow = $statment->fetch();
	if($resultRow == false) {
		if(isset($object['messsage'])) throw new Exception(isset($object['messsage']));
		throw new Exception("Empty result set");
	}
	$returnObject['result']=$resultRow;
	if($resultRow[0] == 0) {
		if(isset($object['messsage'])) throw new Exception(isset($object['messsage']));
		throw new Exception("No result returned");
	}
}
	
try {
	if($objectType=='list') {
		$returnObject['returnCode'] = "true";
		$returnObject['returnObject'] = 1;
		$objectList = new XMLNode();
		if($objectList->loadXML($object) == false)
			throw new Exception("Invalid object source");
		if(utf8_decode($objectList->nodeName)!=='objects') 
			throw new Exception("Expected objects node not found, found: ".$objectList->nodeName);
		if($objectList->hasChildNodes()) {
			foreach ($objectList->childNodes as $childNode) {
				$object=array();
				$attrs = $childNode->attributes;
				foreach($attrs as $attr => $value)
					$object[$attr]=$value;
				try{
					processObject(utf8_decode($childNode->nodeName),$object);
				} catch (Exception $e) {
					$returnObject['returnCode'] = 'false';
					$returnObject['returnObject'] = 0;
					$returnObject['returnValue'] = ($returnObject['returnValue']==null?"":$returnObject['returnValue']."\n").$e->getMessage();
				}
			}
		}
	} else { 
		processObject($objectType,$object,$returnObject);
		$returnObject['returnCode'] = "true";
		$returnObject['returnObject'] = 1;
	}
} catch (Exception $e) {
	$returnObject['returnCode'] = 'false';
	$returnObject['returnValue'] = $e->getMessage();
	$returnObject['returnObject'] = 0;
}


echo json_encode($returnObject);