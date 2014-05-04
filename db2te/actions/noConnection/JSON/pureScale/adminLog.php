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
session_write_close();


$sshReturnData = runSshScript($host, $user, $password, array('tail -n 100 $HOME/sqllib/db2dump/$DB2INSTANCE.nfy'), 'SHELL');

  $toReturn = array();
  if($sshReturnData['returnCode'] == true)
  {
  	
  	$maxPartNum = 0;
  	
  	$returnText = $sshReturnData['returnValue']['outputs'][0];
  	
  	$returnText = explode(chr(30), $returnText );
	$returnTableData = array();	

	$returnData = array();

	$MemberNumber = 0;

	foreach($returnText as $row)
	{
		$row = trim($row);
		$matches = array(); //\h+Appid:(\w+)\s*(.*)\h*Probe:(\w+)\s*(ADM\w*)\s*([.\n]*)
		preg_match('/[0-9]+-[0-9]+-[0-9]+-([0-9]+\.[0-9]+\.[0-9]+)\.[0-9]+\h+Instance:(\w+)\h+Node:(.+)\s*PID:(.*)\h+TID:(\w+)\h+Appid:(.+)\s*(.*)\h*Probe:(\w+)\h*(Database:.+)?\s+(\w+)\h*((.+\n?)+)/m', $row, $matches); 
		if(count($matches) == 0)
			continue;
		$timeNum = $timeNum/5;
		if($matches[10] == "ADM7519W") continue;
		if($matches[3] == 996 || $matches[3] == 997 || $matches[3] == 998) continue;
		$returnData[] = array(
				str_replace(".", ":", $matches[1]),
				$matches[2],
				intval($matches[3]),
				$matches[4],
				$matches[5],
				$matches[6],
				$matches[7],
				$matches[8],
				$matches[10],
				$matches[11],
			);
	}

	$returnObject = array();
	
	$returnObject['returnCode'] = 'true';

	$returnObject['returnValue'] = array();
	
	$returnObject['returnValue']['columnsInfo'] = array(
				"num" => 10, 
				"name" => array("DATE", "INSTANCE", "NODE", "PID", "TID", "APPID", "COMPONENT", "PROBE", "ERROR", "MESSAGE"),
				"precision" => array(128,128,128,128,128,128,128,128,128,128), 
				"scale" => array(0,0,0,0,0,0,0,0,0,0), 
				"type" => array("string","string","string","string","string","string","string","string","string","string"), 
				"width" => array(128,128,128,128,128,128,128,128,128,128), 
				"displaySize" => array(128,128,128,128,128,128,128,128,128,128)
			);

	$returnObject['returnValue']['data'] = array_reverse($returnData);
	
	$returnObject['returnValue']['rowsReturned'] = count($returnData);
	$returnObject['returnValue']["rowsInSet"] = array(
                            "rowsFound" => count($returnData),
                            "endFound" => true
                        );
	$returnObject['returnValue']['isRowCountComplete'] = true;

  }
  else
  {
  	$returnObject['returnCode'] = 'false';
	$returnObject['returnValue'] = 'Could not connect';
  }
  echo json_encode($returnObject);



