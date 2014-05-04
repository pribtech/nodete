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

$commands = getParameter('SHELL', getParameter("command",null));
$outputType = getParameter('outputType');
$format = getParameter('format','yes');
$maxRunTime = getParameter('maxRunTime');
$connectLevel = getParameter('connectLevel','instance');
$returndata['RunTime'] = date('H:i:s l, M j');
$startTime = microtime(true);
$returndata['STMT'] = $commands;
try {
	if(FORCE_CONNECTION_WITH_DEFAULT) { 
		$shell = new SshShell();
	} else {
		if (USE_DATABASE_CONNECTION=="" || USE_DATABASE_CONNECTION==null) 
			throw new Exception('No connection/session');
		if(!isset($connectionProfile))
			$connectionProfile = new connectManagerNodes();
		$connDetails=$connectionProfile->getConnectionDetails($connectLevel,USE_DATABASE_CONNECTION);
		if ($connDetails==null) 
			$shell = new SshShell(
				 $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname']
				,22
				,$_SESSION['Connections'][USE_DATABASE_CONNECTION]['username']
				,$_SESSION['Connections'][USE_DATABASE_CONNECTION]['password']
			);
		else $shell = new SshShell($connDetails);
	}
	if ($maxRunTime!=null)	$shell->setTimeout($maxRunTime);
	if (is_array($commands)) {
		if (isset($outputType)) {
			if ($outputType='stream') {
				$returndata = implode(PHP_EOL, $shell->run($commands));
			}
		}
	}
	if (!isset($returndata['returnValue']))	$returndata = $shell->run($commands,$outputType,$format);
	$returndata['success'] = true;
	$returndata['message'] = "Commands executed.";
	$returndata['returnCode'] = "true";
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	$returndata['success'] = false;
	$returndata['returnValue'] = "Failed: ".$e->getmessage();
	$returndata['message'] = $returndata['returnValue'];
}

$returndata['TotalRunDuration'] = microtime(true) - $startTime;

echo json_encode($returndata);

?>