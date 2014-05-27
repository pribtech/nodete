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

$username = getParameter('TE_DATABASE_LOGIN_USERNAME', "");
$database = getParameter('TE_DATABASE_LOGIN_DATABASE', ""); 
$hostname = getParameter('TE_DATABASE_LOGIN_HOSTNAME', "");
$portnumber = getParameter('TE_DATABASE_LOGIN_PORTNUMBER', "");
$password = getParameter('TE_DATABASE_LOGIN_PASSWORD', "");
$comment = getParameter('TE_DATABASE_COMMENTS', ""); 
$group = getParameter('TE_DATABASE_LOGIN_GROUP', "");

$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'Can not save the connection: ' . $username . "@" . $database . ($hostname != "" ? "." . $hostname . ":" . $portnumber : "");

if(!FORCE_CONNECTION_WITH_DEFAULT)
{
	if($database != "" && $username != "")
	{
		connectionManager::saveConnectionInStoredConnections($database, $username, $hostname, $portnumber, $password, $comment, $group);
		$returnInformation['returnCode'] = 'true';
		$returnInformation['returnValue'] = 'true';
	}
}

echo json_encode($returnInformation);
		
?>