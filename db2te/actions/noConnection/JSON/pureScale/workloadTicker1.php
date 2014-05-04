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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "FunctionInlineBarGraph.php");

$GUID = getParameter('GUID', 0);
$host = "";
$user = "";
$password = "";

@session_start();
if($_SESSION['Connections'][USE_DATABASE_CONNECTION] != null)
{
	$host = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname'];
	$user = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['username'];
	$password = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['password'];
}
$CLIENT_BALANCE_HISTORY = @$_SESSION['SDTW_CLIENT_BALANCE_HISTORY'][$GUID];
session_write_close();


$CLIENT_BALANCE_HISTORY = $CLIENT_BALANCE_HISTORY == null ? array() : $CLIENT_BALANCE_HISTORY;


$sshReturnData = connectionManager::getNewStatement("WITH
	members (ID) as (
		VALUES(0),(1),(2)
	),
	SYSTEM_TPS (ID, TPS) as (SELECT 
		ID,
		TPS
	FROM
		TABLE(
			SELECT 
					ID
				FROM
					members
		) a, 
		TABLE(
			SELECT 
					UID_SQL_STMTS + SELECT_SQL_STMTS as TPS
				FROM 
					TABLE(
						SNAP_GET_DB_V97('', a.id)
					)
		)
)
SELECT 
MIN(CASE WHEN ID = 0 THEN TPS END) TPS_MEM0,
MIN(CASE WHEN ID = 1 THEN TPS END) TPS_MEM1,
MIN(CASE WHEN ID = 2 THEN TPS END) TPS_MEM2
 FROM SYSTEM_TPS");
$toReturn = array();
if($sshReturnData['returnCode'] == true)
{
	$data = $sshReturnData->fetchIndexedRow();
	$MemberNumber = 0;
	$dateTime = microtime(true);

	$returnData[0] = array("member"=>0,"value"=>$data[0], "time"=>$dateTime);
	$returnData[1] = array("member"=>1,"value"=>$data[1], "time"=>$dateTime);
	$returnData[2] = array("member"=>2,"value"=>$data[2], "time"=>$dateTime);


	foreach($returnData as $key => $value)
	{
		if(array_key_exists($key, $CLIENT_BALANCE_HISTORY))
		{
			if($value["time"] == 0)
			{
				$returnTableData[$key] = -1;
			}
			else 
			{
				$returnTableData[$key] = floor(($value['value'] - $CLIENT_BALANCE_HISTORY[$key]['value'])/($value['time'] - $CLIENT_BALANCE_HISTORY[$key]['time']));
			}
		}
		else
		{
			$returnTableData[$key] = -1;
		}
	}
	
	foreach($CLIENT_BALANCE_HISTORY as $key => $value)
	{
		if(!array_key_exists($key, $returnData) && is_array($value))
		{
			$returnData[$key] = $value;
			$returnData[$key]["time"] = 0;
			$returnTableData[$key] = -1;
		}
	}
	
	ksort($returnTableData);
	
	@session_start();
	$_SESSION['SDTW_CLIENT_BALANCE_HISTORY'][$GUID] = $returnData;
	session_write_close();
	
	$returnObject = array();
	
	$returnObject['returnCode'] = 'true';

	$returnObject['returnValue'] = array();
	
	$returnObject['returnValue']['columnsInfo'] = array(
				"num" => 5, 
				"name" => array("SYSTEM", "APP_COUNT", "APP_COUNT_INLINE_HISTOGRAM", "AVG_APP_COUNT", "TOTAL_APP_COUNT"),
				"precision" => array(128, 128, 128, 128, 128), 
				"scale" => array(0,0,0, 0, 0),
				"type" => array("string","integer","integer","integer","integer"), 
				"width" => array(128, 128, 128, 128, 128), 
				"displaySize" => array(128, 128, 128, 128, 128)
			);
	
	
	$returnObject['returnValue']['data'] = array();
	
	$returnObject['returnValue']['rowsReturned'] = count($returnTableData);
	$returnObject['returnValue']["rowsInSet"] = array(
                            "rowsFound" => count($returnTableData),
                            "endFound" => true
                        );
	$returnObject['returnValue']['isRowCountComplete'] = true;

	$sum = 0;
	$maxval = 0;
	$avg = 0;
	$totalClients = 0;
 	foreach($returnTableData as $key => $value)
 	{
 		if($value == -1) continue;
 		$sum += $value;
 		$totalClients++;
 		if($value > $maxval) 
 			$maxval = $value;
 		
 	}
 	if($totalClients != 0)
		$avg = $sum/$totalClients;

	if($maxval == 0)
		$maxval = 1;
	
  	foreach($returnTableData as $key => $value)
  	{
  	 	$row = array();
  	 	$row[] = "Member " . $key;
  	 	$row[] = $value;
  	 	$row[] = $sum == 0 ? 0 : floor(($value/$sum)*100);  	 
  	 	$row[] = $avg;
  	 	$row[] = $sum;
  	 	$returnObject['returnValue']['data'][] = $row;
  	}
}
else
{
	$returnObject['returnCode'] = 'false';
	$returnObject['returnValue'] = 'Could not connect';
}
echo json_encode($returnObject);



