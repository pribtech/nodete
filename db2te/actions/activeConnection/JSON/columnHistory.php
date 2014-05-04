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

$INTERVAL = intval(getParameter("interval", 1));

$historyLength = intval(getParameter("historyLength", 30)) + 3;

$columnDiffMethod = getParameter("columnDiffMethod", "delta");

$SQLToRun = getParameter("SQL");

$returnObject = array();

$returnObject['returnCode'] = 'true';

$returnObject['returnValue'] = "";

if($SQLToRun == null)
{
	$returnObject['returnCode'] = 'false';

	$returnObject['returnValue'] = "No query specified";
	
	echo json_encode($returnObject);
	
	exit;	
}

function buildBaseData($historyLength, $INTERVAL) {
	$i = 0;
	$ctime = microtime(true);
	$ctime -= ($INTERVAL);
	$baseData = array();
	for($i = 1; $i >= $historyLength; $i--)
		array_push($baseData, array('time' => $ctime-($i), 0));
	return $baseData;
}

$METRICS = array();

TE_session_start();

if(array_key_exists('columnHistory', $_SESSION))
{
	if(array_key_exists(USE_DATABASE_CONNECTION, $_SESSION['columnHistory']))
	{
		if(array_key_exists($SQLToRun, $_SESSION['columnHistory'][USE_DATABASE_CONNECTION]))
		{
			if(!array_key_exists($INTERVAL, $_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun]))
			{
				$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun][$INTERVAL] = buildBaseData($historyLength, $INTERVAL);
			}
		}
		else 
		{
			$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun] = array();
			$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun][$INTERVAL] = buildBaseData($historyLength, $INTERVAL);
		}
	}
	else 
	{
		$_SESSION['columnHistory'][USE_DATABASE_CONNECTION] = array();
		$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun] = array();
		$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun][$INTERVAL] = buildBaseData($historyLength, $INTERVAL);
	}
}
else 
{
		$_SESSION['columnHistory'] = array();
		$_SESSION['columnHistory'][USE_DATABASE_CONNECTION] = array();
		$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun] = array();
		$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun][$INTERVAL] = buildBaseData($historyLength, $INTERVAL);
}
$METRICS = $_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun][$INTERVAL];

$lastMesure = array_pop($METRICS);
array_push($METRICS, $lastMesure);

if($lastMesure['time'] < (microtime(true)) - ($INTERVAL-0.25))
{
	$statment = connectionManager::getNewStatement($SQLToRun, false, false, false);

	$CLIENT_BALANCE_RETURN = array();
	
	$currentResult = array();
	$currentResult['time'] = microtime(true);
	$resultRow = $statment->fetchAssocRow();
	if($resultRow != null)
	{
		$currentResult['raw'] = $resultRow;
	}
	else 
	{
		$returnObject['returnCode'] = 'false';
	
		$returnObject['returnValue'] = "No data returned from query specified";
		
		echo json_encode($returnObject);
		
		exit;
		//error
	}
	
	$currentResult['return'] = array();
	if(@array_key_exists('raw', $lastMesure))
	{
		switch(strtolower($columnDiffMethod))
		{
			case 'deltanorm':
				$timeNorm = ($currentResult['time'] - $lastMesure['time'])/$INTERVAL;
				foreach($lastMesure['raw'] as $key=>$value)
				{
					$currentResult['return'][$key] = ($currentResult['raw'][$key] - $value) / $timeNorm;
				}
				break;
			case 'delta':
				foreach($lastMesure['raw'] as $key=>$value)
				{
					$currentResult['return'][$key] = ($currentResult['raw'][$key] - $value);
				}
				break;
			case 'none':
				$currentResult['return'] = $currentResult['raw'];
				break;
		}
		if($currentResult['return'][$key] < 0) $currentResult['return'][$key] = 0;
	}
	array_push($METRICS, $currentResult);
	
	while(count($METRICS) > $historyLength) array_shift($METRICS);
	
	$_SESSION['columnHistory'][USE_DATABASE_CONNECTION][$SQLToRun][$INTERVAL] = $METRICS;
	
}
TE_absolute_session_write_close();

	$returnObject = array();
	
	$returnObject['returnCode'] = 'true';

	$returnObject['returnValue'] = array();
	
	$returnObject['returnValue']['columnsInfo'] = array(
				"num" => 0, 
				"name" => array(), 
				"precision" => array(), 
				"scale" => array(), 
				"type" => array(), 
				"width" => array(), 
				"displaySize" => array()
			);
	$returnObject['returnValue']['columnsInfo']["num"]++;			
	array_push($returnObject['returnValue']['columnsInfo']["name"], 'timestamp');
	array_push($returnObject['returnValue']['columnsInfo']["precision"], 128);
	array_push($returnObject['returnValue']['columnsInfo']["scale"], 0);
	array_push($returnObject['returnValue']['columnsInfo']["type"], "string");
	array_push($returnObject['returnValue']['columnsInfo']["width"], 128);
	array_push($returnObject['returnValue']['columnsInfo']["displaySize"], 128);
	$blankRow = array();
	array_push($blankRow, 0);
	if(isset($currentResult)) $lastMesure = $currentResult;
	foreach($lastMesure['raw'] as $key=>$value)
	{
		array_push($blankRow, 0);
		$returnObject['returnValue']['columnsInfo']["num"]++;
		array_push($returnObject['returnValue']['columnsInfo']["name"], $key);
		array_push($returnObject['returnValue']['columnsInfo']["precision"], 128);
		array_push($returnObject['returnValue']['columnsInfo']["scale"], 0);
		array_push($returnObject['returnValue']['columnsInfo']["type"], "int");
		array_push($returnObject['returnValue']['columnsInfo']["width"], 128);
		array_push($returnObject['returnValue']['columnsInfo']["displaySize"], 128);
	}
	$METRICS_OUT = array();
	foreach($METRICS as $point)
	{
		if(@array_key_exists('return',$point))
		{
			$temp = array();
			$temp[0] = date('h:i:s', $point['time']);
			$i = 1;
			foreach($point['return'] as $value)
				$temp[$i++] = $value;
			array_push($METRICS_OUT,$temp);
		}
		else
		{
			$temp = $blankRow;
			$temp[0] = date('h:i:s', $point['time']);
			array_push($METRICS_OUT,$temp);
		}

	}
	$METRICS = $METRICS_OUT;
	$METRICS_OUT = array();
	$pointNodes = count($METRICS)-3;
	for($i = 0; $i < $pointNodes; $i++)
	{
		$point = array();
	 	for($k = 0; $k < $returnObject['returnValue']['columnsInfo']["num"]; $k++)
		{
			if($k != 0)
				$point[] = @($METRICS[$i+1][$k] + $METRICS[$i][$k])/2;
			else
				$point[] = $METRICS[$i][$k];
		}
		$METRICS_OUT[] = $point;

	}
	
	$returnObject['returnValue']['data'] = array_reverse($METRICS_OUT);
	
	$returnObject['returnValue']['rowsReturned'] = count($METRICS_OUT);
	$returnObject['returnValue']["rowsInSet"] = array(
                            "rowsFound" => count($METRICS_OUT),
                            "endFound" => true
                        );
	$returnObject['returnValue']['isRowCountComplete'] = true;


  
  echo json_encode($returnObject);


?>

