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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ssh.php");

$returnObject['returnCode'] = true;
$returnObject['returnValue'] = 'Unknown error';

$command = getParameter('command'); // posible commands are - start, stop, update

$system = getParameter('system'); // posible commands are - local, remote

$db = getParameter('USE_CONNECTION'); // posible commands are - local, remote

$username = null;

$password = null;

@session_start();
if($_SESSION['Connections'][$db] != null)
{
	$host = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname'];
	$username = $_SESSION['Connections'][$db]['username'];
	$password = $_SESSION['Connections'][$db]['password'];
}
session_write_close();

if(stripos($host, ".") !== false)
{
	$system = $system . substr($host, stripos($host, "."));
}
if($command != null && $system != null)
{
	echo json_encode(runSshScript($system, $username, $password, array($command)));
}
else
{
	echo json_encode($returnObject);
}

