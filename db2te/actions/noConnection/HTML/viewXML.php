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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "FunctionLoadXMLDefFromDB.php");

$XMLTable = getParameter('tableXML', false);
$forceSave = getParameter('forceSave', false);
$forceSave = is_bool($forceSave) ? $forceSave : ($forceSave == "true" ? true : false);

if($forceSave) {
	if($XMLTable !== false)
		header('Content-disposition:attachment; filename=' . $XMLTable . ".xml");
	else if($table !== null)
		header('Content-disposition:attachment; filename=' . ($schemaName == "" ? $tableName . ".xml" : $schemaName . "." . $tableName . ".xml" ));
}

if($XMLTable !== false && ALLOW_DISPLAY_OF_XML) {
	$tableFile = TABLE_DEFINITION_DIRECTORY . $XMLTable . ".xml";
	header('Content-type: text/xml');

	if(file_exists($tableFile)) {
		echo "<!-- XML table definition file location: $tableFile -->\n\n";
		echo parseXML(file_get_contents($tableFile));
	} else //If there is no explicit definition for the table or view create an implicit one.
		my_header("Message", "No table or view definition exists", "no"); // Display the page header
} elseif($tableName === NULL || !ALLOW_DISPLAY_OF_XML)
	my_header("Message", "No table or view definition exists", "no"); // Display the page header
else {
	$tableFile = TABLE_DEFINITION_DIRECTORY . ($schemaName == "" ? $tableName . ".xml" : $schemaName . "." . $tableName . ".xml" );
	header('Content-type: text/xml');
	if(file_exists($tableFile)) {
		echo "<!-- XML table definition file location: $tableFile -->\n\n";
		echo parseXML(file_get_contents($tableFile));
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
		echo "<!-- XML table definition was generated from the table: $tableName -->\n\n";
		echo parseXML($XMLString);
	}
}
?>