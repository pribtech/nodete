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

$schema = getParameter('schema');
$name 	= getParameter('name');
$column = getParameter('column');
$minrow = getParameter('minrow');
$returnObject = array();

$returnObject['returnCode'] = "false";
$returnObject['returnObject'] = 0;

$query = false;

if($schema != null && $name != null && is_array($column))
{
	$query = "select count(*) from $schema.$name WHERE ";
	foreach ($column as $key=>$value)
	{
		if(is_numeric($value))
		{
			$query .= "$key = $value AND ";
		}
		else 
		{
			$query .= "$key = '$value' AND ";
		}
	}
	$query = trim($query, "AND ");
}
else if($name != null && is_array($column))
{
	$query = "select count(*) from $name WHERE ";
	foreach ($column as $key=>$value)
	{
		if(is_numeric($value))
		{
			$query .= "$key = $value AND ";
		}
		else 
		{
			$query .= "$key = '$value' AND ";
		}
	}
	$query = trim($query, "AND ");
}
else if($name != null && $column == null){
	if ($schema != null) {
		if ($minrow != null){
			$query = "select count(*) from $schema.$name";
		}
		else 
		{
			$query = "select 1 from $schema.$name fetch first row only";
		}
	}
	else
	{
		if ($minrow != null){
			$query = "select count(*) from $schema.$name";
		}
		else 
		{
			$query = "select 1 from $schema.$name fetch first row only";
		}
	}
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
		if($resultRow[0] != null || $resultRow[0] > 0)
		{
			if ($minrow != null){
				if ($resultRow[0] == $minrow){
					$returnObject['returnCode'] = "true";
					$returnObject['returnObject'] = 1;
				}
			}
			else 
			{
					$returnObject['returnCode'] = "true";
					$returnObject['returnObject'] = 1;
			}
		}
	}
	else 
	{
		$returnObject['returnCode'] = "Error";
		$returnObject['returnObject'] = "No result returned";
	}
}
else 
{
	$returnObject['returnCode'] = $statment->sqlstate;
	$returnObject['returnObject'] = $statment->sqlerror;
}

echo json_encode($returnObject);