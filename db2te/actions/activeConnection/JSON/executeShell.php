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

$sshMethod = getParameter('sshMethod', 'automatic');
if ($sshMethod == "phpseclib") {
	include_once(PHP_INCLUDE_BASE_DIRECTORY . "phpseclibSSH.php");
}
else {
	include_once(PHP_INCLUDE_BASE_DIRECTORY . "ssh.php");
}

$CommandsToRun 	= getParameter('SHELL', null);
$maxRunTime 	= getParameter('maxRunTime', 10);
$termCharater 	= getParameter('termCharater', '');
$returnObject = array();
$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = "Userid and/or Password not found";

if(FORCE_CONNECTION_WITH_DEFAULT) {
	$database = DEFAULT_DATABASE;
	$hostname = DEFAULT_DATABASE_HOST_NAME;
	$username = DEFAULT_DATABASE_USERNAME;
	$password = DEFAULT_DATABASE_PASSWORD;
} else {
	$username = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['username']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['username'] : "";
	$password = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['password']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['password'] : "";
	$database = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['database']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['database'] : "";
	$hostname = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname'] : "";
}

if ($username == null || $password == null)
	echo json_encode($returnObject);
else {
	if(is_string($CommandsToRun))
		$CommandsToRun = array($CommandsToRun);
	else {
		$temp = $CommandsToRun;
		$CommandsToRun = array();
		foreach ($temp as $command)
			$CommandsToRun[] = $command;	
	}
	$result = runSshScript($hostname, $username, $password, $CommandsToRun, "shell", "object", $maxRunTime, $database, $termCharater);
	echo json_encode($result);
}
