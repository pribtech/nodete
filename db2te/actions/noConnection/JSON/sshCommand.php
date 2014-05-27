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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ssh.php");

$returnObject = array();

$returnObject['returnCode'] = true;
$returnObject['returnValue'] = 'Unknown error';

$command = getParameter('command');
$mode = getParameter('mode', "SHELL");
$host = getParameter('sshHost', "");
$user = getParameter('sshUser', ""); 
$password = getParameter("sshPassword", "");
$definedConnection = getParameter('definedConnection');
@session_start();
if($_SESSION['Connections'][USE_DATABASE_CONNECTION] != null && $definedConnection == null)
{
	$host = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname'];
	$user = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['username'];
	$password = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['password'];
}

session_write_close();

if(!is_array($command)) $command = array($command);

echo json_encode(runSshScript($host, $user, $password, $command, $mode));

