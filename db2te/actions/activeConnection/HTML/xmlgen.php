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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "FunctionLoadXMLDefFromDB.php");

//Schema and Table to get defintion for
$schema = $_GET['schemanameparm'];
$table = $_GET['tablenameparm'];

$XMLString = RetrieveXMLDefinitionfromDB($table, $schema);

	if(empty($XMLString)) {
		echo 'No XML Table or View Available';
	}//Table or Schema does not exist (or no columns found)
	else {
		header('Content-Type: text/xml');
		echo parseXML($XMLString);
	}//Output XML


?>