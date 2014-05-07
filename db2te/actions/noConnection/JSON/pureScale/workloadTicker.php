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


$sshReturnData = runSshScript($host, $user, $password, array('db2_all db2 get snapshot for db on dtw | egrep "Select SQL|Update|   Node number|Snapshot timestamp"'), 'SHELL');
$toReturn = array();
if($sshReturnData['returnCode'] == true)
{
	$maxPartNum = 1;
	
	$returnText = $sshReturnData['returnValue']['outputs'][0];
	
	$returnText = explode("\n", $returnText );
	
	$returnTableData = array();	
	
	$returnData = array();
	
	$MemberNumber = 0;
	$dateTime = 0;
	foreach($returnText as $row)
	{
		$row = trim($row);
		$matches = array();
		preg_match("/([\w\h]+)\h*=\h*(.+)/", $row, $matches); 
		
		if(count($matches) == 0)
			continue;
		if(stristr($matches[1],"Node number") !== false)
		{
			$MemberNumber = $matches[2];
			if(!array_key_exists($matches[2], $returnData))
			{
				$returnData[$MemberNumber] = array("member"=>$MemberNumber,"value"=>0, "time"=>$dateTime);
			}
		}
		else if(stristr($matches[1],"Snapshot timestamp") != false)
		{
			$dateTime = strtotime($matches[2]);
		}
		else
		{
			$returnData[$MemberNumber]['value'] += intval($matches[2]);
		}
	}

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



