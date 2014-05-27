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

$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'Can not form a connection';
try {
	if(!FORCE_CONNECTION_WITH_DEFAULT) {
		$returnInformation['returnValue'] = connectionManager::newConnection();
		if($returnInformation['returnValue'] == false)
			$returnInformation['returnValue'] = connectionManager::$lastErrorState;
		else {
			$returnInformation['returnCode'] = 'true';
			@session_start();
			session_regenerate_id(true);
			session_write_close();
		}
	}
} catch (Exception $e){
	$returnInformation['returnCode'] = "false";
	$returnInformation['success'] = false;
	$returnInformation['returnValue'] = "Failed: ".$e->getmessage();
	$returnInformation['message'] = $returnInformation['returnValue'];
}

echo json_encode($returnInformation);
?>