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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ArrayEncodeTableDefinition.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "FunctionLoadXMLDefFromDB.php");

$tableName   = getParameter("table");
$schemaName  = getParameter("schema", "");
$baseFolder  = getParameter("baseFolder", "");

$TableDef = null;

$returnObject = array();
$returnObject['returnCode'] = "false";
$returnObject['returnValue'] = "Table definition not found, schema: \"".$schemaName."\" table: \"".$tableName."\" base folder: \"".$baseFolder."\"";

try{
	if($tableName != ""){
		$schname = "";
		$tableFile =  $tableName . ".xml";

		if(is_readable($baseFolder . $tableFile)) {
			$returnObject['returnValue'] = "Table definition in error, file: \"".$tableFile."\"";
			$TableDef  = ArrayEncodeTableDefinition::fromFile($baseFolder, $tableFile);
		} else if(is_readable(TABLE_DEFINITION_DIRECTORY . $tableFile)) {
			$returnObject['returnValue'] = "Table definition in error, file: \"".$tableFile."\"";
			$TableDef  = ArrayEncodeTableDefinition::fromFile(TABLE_DEFINITION_DIRECTORY, $tableFile);
		} else if(!connectionManager::isConnected()) {
			$returnObject['returnCode'] = "false";
			$returnObject['flagGeneralError'] = true;
			$returnObject['connectionError'] = false;
			$returnObject['returnValue'] = NOT_CONNECTED_MESSAGE;
		} else { //If there is no explicit definition for the table or view create an implicit one.
			if ($schemaName != "") {
				$schname = trim($schemaName);
				$tabname = trim($tableName);
			} else {
				$schname = "";
				$tabname = "";
				$dotIndex = strpos($tableName,".");
				if ($dotIndex !== false) {
					$len = strlen($tableName);
					$schname = substr($tableName,0,$dotIndex);
					$tabname = substr($tableName,$dotIndex+1,$len);
				} else {
					if(connectionManager::getConnection()->schema != "")
						$schname = connectionManager::getConnection()->schema;
					else
						$schname = trim(connectionManager::getConnection()->username);
					$tabname = trim($tableName);
				}
			}
			if(strpos(trim($schname), " ") !== false)
				$schname = '"' . $schname . '"';
			if(strpos(trim($tabname), " ") !== false)
				$tabname = '"' . $tabname . '"';
			if(trim($schname) == "")
				$tableName = $tabname;
			else
				$tableName = $schname . "." . $tabname;

			$XMLString = RetrieveXMLDefinitionfromDB($tabname, $schname);
			//Add Flag before storing
			//file_put_contents($tableFile, $XMLString);
			$TableDef = ArrayEncodeTableDefinition::fromString($XMLString);
		}
	}
	if($TableDef != null) {
		$returnObject['returnCode'] = "true";
		$returnObject['returnValue'] = $TableDef;
	}
} catch (Exception $e) {
	$returnObject['returnValue'] = $e->getMessage();
}

echo json_encode($returnObject);