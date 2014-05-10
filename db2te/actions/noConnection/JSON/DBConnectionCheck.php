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
/** DB2 Monitoring Console default variables */

include_once(PHP_INCLUDE_BASE_DIRECTORY . "UtilGeneric.php");

try {
	connectionManager::UpdateConnectionStatusesAllConnection();
	$returnInformation = array();
	$returnInformation['connectionStatus'] = connectionManager::isConnected() ? "true" : "false";
	$returnInformation['connectionText'] = connectionManager::titleString();
	$returnInformation['activeConnection'] = array();

	$basedata = connectionManager::retrieveStoredConnections();
	foreach($basedata as $value)
		$returnInformation['activeConnection'][] = $value;
		
} catch (Exception $e){
	$returnInformation['connectionStatus'] = "false";
	$returnInformation['connectionText'] =  "Failed: ".$e->getmessage();
	$returnInformation['activeConnection'] = array();
}

echo json_encode($returnInformation);
