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

$schema 	= getParameter("schema");
$name		= getParameter("name");
$query 		= getParameter("query");
$minRows 	= getParameter("minRows", 0);

$returnObject = array();
$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = 0;

if($schema != null && $name != null)
{
	$query = "select count(*) from $schema.$name";
}
else if($name != null)
{
	$query = "select count(*) from $name";
}
else if($query != null)
{
	true;
}
else 
{
	echo json_encode($returnObject);
	exit;
}

$statment = connectionManager::getNewStatement($query);

if($statment->errorMsg() == "")
{
	$resultRow = $statment->fetch();
	
	if($resultRow != false)
	{
		if($resultRow[0] >= $minRows)
		{
			$returnObject['returnCode'] = 'true';
			$returnObject['returnValue'] = $resultRow[0];
		}
		else 
		{
			$returnObject['returnCode'] = 'false';
			$returnObject['returnValue'] = $resultRow[0];
		}
	}
	else 
	{
		$returnObject['returnCode'] = 'false';
		$returnObject['returnValue'] = "No result returned";
	}
}
else 
{
	$returnObject['returnCode'] = $statment->sqlstate;
	$returnObject['returnValue'] = $statment->sqlerror;
}

echo json_encode($returnObject);