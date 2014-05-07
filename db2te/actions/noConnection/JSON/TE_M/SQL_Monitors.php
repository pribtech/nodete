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

require_once(PHP_INCLUDE_BASE_DIRECTORY . './TE_M_config.php');

require_once(PHP_INCLUDE_BASE_DIRECTORY . MONITOR_FOLDER . "/te_sql_monitor.php");

$CLIENT_BALANCE_HISTORY = @$_SESSION['CLIENT_BALANCE_HISTORY'];

$TableDefinitionObjectsDirectory = dir(PHP_INCLUDE_BASE_DIRECTORY . MONITOR_FOLDER . TE_SQL_MONITORS); 
$includeFile = "";
while(($includeFile = $TableDefinitionObjectsDirectory->read()) !== false) 
{ 	
	if (substr($includeFile, -4) == '.php') 
		include_once(PHP_INCLUDE_BASE_DIRECTORY . MONITOR_FOLDER . TE_SQL_MONITORS . $includeFile);
}

$returnData = array();

foreach($TE_SQL_MONITOR_ACTIONS as $SQL_Monitor)
{
	$returnData[] = eval("return array(" . $SQL_Monitor . '::$name, ' . $SQL_Monitor . '::$description, ' . $SQL_Monitor . '::$accessName);');
	
}

$returnObject = array();

$returnObject['returnCode'] = 'true';

$returnObject['returnValue'] = array();

$returnObject['returnValue']['columnsInfo'] = array( 
			"num" => 3, 
			"name" => array("NAME","DESCRIPTION", "SYSNAME"), 
			"precision" => array(128, 128, 128), 
			"scale" => array(0,0,0), 
			"type" => array("string","string","string"), 
			"width" => array(128, 128, 128), 
			"displaySize" => array(128, 128, 128)
		);


$returnObject['returnValue']['data'] = array();

$returnObject['returnValue']['rowsReturned'] = count($returnData);
$returnObject['returnValue']["rowsInSet"] = array(
                    "rowsFound" => count($returnData),
                    "endFound" => true
                );
$returnObject['returnValue']['isRowCountComplete'] = true;

$returnObject['returnValue']['data'] = $returnData;


echo json_encode($returnObject);


?>
