<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved..
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
$databaseDriver = getParameter("databaseDriver","");
$database = getParameter("database",null);
$username = getParameter("user",null);
$password = getParameter("password",null);
$hostname = getParameter("host","localhost");
$port = getParameter("port",1527);
$options = getParameter("options",null);

$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'Can not form a connection';

try {
	require_once("jar/dbDriver.php");
	java_last_exception_clear();
	if($database==null)
		throw new Exception("Database name not specified");
	try{
		$dataSource=&$GLOBALS["derbyDataSource"];
		$dataSource->setServerName($hostname);
		$dataSource->setPortNumber((int)$port);
		$dataSource->setDatabaseName($database);
//		$dataSource->setSsl("basic");
//      $dataSource->setCreateDatabase("create");
		$dataSource->setConnectionAttributes($options); 
		if($username==null)
			$connection = $dataSource->getConnection();
		else
			$connection = $dataSource->getConnection($username,$password);
		if (!$connection)
			throw new Exception(java_last_exception_get());
		$connection->close();

	} catch (JavaException $e) {
		throw new Exception($e->getCause());
	}
	$returnInformation['returnCode'] = 'true';
} catch(Exception $e) {
	$returnInformation['returnValue'] = $e->getmessage();
}

echo json_encode($returnInformation);
		
?>