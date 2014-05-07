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

@session_start();

$CLIENT_BALANCE_HISTORY = @$_SESSION['CLIENT_BALANCE_HISTORY'];

session_write_close();
$CLIENT_BALANCE_HISTORY = $CLIENT_BALANCE_HISTORY == null ? array() : $CLIENT_BALANCE_HISTORY;
$CLIENT_BALANCE_HISTORY_CURRENT = array();

$SQLToRun = "SELECT A.AGENT_ID, APPL_NAME,  APPL_STATUS, COORD_NODE_NUM, CLIENT_PID, COMMIT_SQL_STMTS  FROM SYSIBMADM.SNAPAPPL_INFO as A left join SYSIBMADM.SNAPAPPL as B on A.AGENT_ID = B.AGENT_ID where COMMIT_SQL_STMTS != 0 and APPL_NAME = 'sdtw'";

$statment = new Statement($SQLToRun, false, false, false);

$CLIENT_BALANCE_RETURN = array();

while($resultRow = $statment->fetchIndexedRow())
{
	$CLIENT_BALANCE_HISTORY_CURRENT[$resultRow[0]] = array(
								$resultRow[0],
								$resultRow[1],
								$resultRow[2],
								$resultRow[3],
								$resultRow[4],
								$resultRow[4]
						);
	if(key_exists($resultRow[0], $CLIENT_BALANCE_HISTORY))
	{
		$CLIENT_BALANCE_HISTORY_CURRENT[$resultRow[0]][5] = $CLIENT_BALANCE_HISTORY_CURRENT[$resultRow[0]][4] - $CLIENT_BALANCE_HISTORY[$resultRow[0]][4];
	}
	if($CLIENT_BALANCE_HISTORY_CURRENT[$resultRow[0]][5] > 0)
	{
		if(key_exists($resultRow[3], $CLIENT_BALANCE_RETURN))
		{
			$CLIENT_BALANCE_RETURN[$resultRow[3]]++;
		}
		else
		{
			$CLIENT_BALANCE_RETURN[$resultRow[3]] = 1;
		}
	}
}

@session_start();

$_SESSION['CLIENT_BALANCE_HISTORY'] = $CLIENT_BALANCE_HISTORY_CURRENT;

session_write_close();
	
$returnObject = array();

$returnObject['returnCode'] = 'true';

$returnObject['returnValue'] = array();

$returnObject['returnValue']['columnsInfo'] = array( 
			"num" => 3, 
			"name" => array("NAME","DISCRIPTION","SYSNAME"), 
			"precision" => array(128, 128, 128), 
			"scale" => array(0,0,0), 
			"type" => array("string","string","string"), 
			"width" => array(128, 128, 128), 
			"displaySize" => array(128, 128, 128)
		);


$returnObject['returnValue']['data'] = array();

$returnObject['returnValue']['rowsReturned'] = count($CLIENT_BALANCE_RETURN);
$returnObject['returnValue']["rowsInSet"] = array(
                    "rowsFound" => count($CLIENT_BALANCE_RETURN),
                    "endFound" => true
                );
$returnObject['returnValue']['isRowCountComplete'] = true;

 foreach($CLIENT_BALANCE_RETURN as $key => $value) if($maxPartNum < $value) $maxPartNum = $value;
 foreach($CLIENT_BALANCE_RETURN as $key => $value)
 {
 	$row = array();
 	$row[] = 'DB2 Member ' . $key;
 	$row[] = ($value/$maxPartNum)*100;
 	$row[] = $value;
 	$returnObject['returnValue']['data'][] = $row;
}

 echo json_encode($returnObject);


?>
