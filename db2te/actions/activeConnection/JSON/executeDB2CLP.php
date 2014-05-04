<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.
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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectSsh.php");

$commands = getParameter("command");
$maxRunTime = getParameter('maxRunTime');
$connectLevel = getParameter('connectLevel','instance');

try {
	if(FORCE_CONNECTION_WITH_DEFAULT) { 
		$shell = new DB2Shell();
	} else {
		if(!isset($connectionProfile))
			$connectionProfile = new connectManagerNodes();
		$connDetails=$connectionProfile->getConnectionDetails($connectLevel,USE_DATABASE_CONNECTION);
		if ($connDetails==null) 
			$shell = new DB2Shell(
				 $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname']
				,$_SESSION['Connections'][USE_DATABASE_CONNECTION]['username']
				,$_SESSION['Connections'][USE_DATABASE_CONNECTION]['password']
			);
		else $shell = new DB2Shell($connDetails);
	}
	if ($maxRunTime!=null)	$shell->setTimeout($maxRunTime);
	$returndata = $shell->run($commands,"STREAM");
	$returndata['returnCode'] = "true";
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	$returndata['returnValue'] = "Failed: ".$e->getmessage();
}

echo json_encode($returndata);

?>