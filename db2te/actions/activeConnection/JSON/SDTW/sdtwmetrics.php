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

$INTERVAL = intval(getParameter("INTERVAL", 1));
$INTERVAL2 = intval(getParameter("INTERVAL2", 1));
$NUMCLIENT = intval(getParameter("NUMCLIENT", 2));

$NUMBEROFPOINTS = intval(getParameter("NUMBEROFPOINTS", 25));

$METRICS = array();

$SQLToRun = "
select TPS, READS, WRITES, TIME((timestamp('1970-01-01-00.00.00.0') + TIME seconds)+CURRENT TIMEZONE) as TIMERETURN 
from 
	table( select count(TIME) as time_count, sum(TPS) as TPS, sum(AVGTPS) as AVGTPS, sum(READS) as READS, sum(WRITES) as WRITES,  TIME 
	from 
		table(select TPS,  AVGTPS, READS,  WRITES, TIME - MOD(TIME, $INTERVAL) as TIME from SDTW.METRICS), table( select max(time) as max_time from SDTW.METRICS) 
	where TIME <= max_time - $INTERVAL2
	group by TIME order by TIME DESC 
) order by TIME DESC FETCH FIRST 33 ROWS ONLY
";

$statment = connectionManager::getNewStatement($SQLToRun, false, false, false);

$CLIENT_BALANCE_RETURN = array();

while($resultRow = $statment->fetchIndexedRow())
{
	$hours = intval(substr($resultRow[3], 0, 2));
	if($hours > 12)
	{
		$hours -= 12;
		$resultRow[3] = $hours . substr($resultRow[3], 2);
	}
		
	$METRICS[] = array(
								'TPS' => intval($resultRow[0]),
								'READS' => intval($resultRow[1]),
								'WRITES' => intval($resultRow[2]),
								'TIME' => $resultRow[3]
						);
}

$METRICS_OUT = array();

$NUMBEROFPOINTS = count($METRICS);

for($i=0; $i < $NUMBEROFPOINTS-3; $i++)
{
	$METRICS_OUT[] = array(
		$METRICS[$i]['TIME'],
		$METRICS[$i]['TPS'],
		$METRICS[$i]['READS'],
		$METRICS[$i]['WRITES'],
		floor(($METRICS[$i+2]['TPS'] + $METRICS[$i+1]['TPS'] + $METRICS[$i]['TPS'])/(3))
	);
}
  
	$returnObject = array();
	
	$returnObject['returnCode'] = 'true';

	$returnObject['returnValue'] = array();
	
	$returnObject['returnValue']['columnsInfo'] = array(
				"num" => 5, 
				"name" => array("TIMESTAMP","TPS", "WRITES","READS", "AVG_TPS"), 
				"precision" => array(128, 128, 128, 128, 128), 
				"scale" => array(0,0,0,0,0), 
				"type" => array("string","int","int","int","int"), 
				"width" => array(128, 128, 128, 128, 128), 
				"displaySize" => array(128, 128, 128, 128, 128)
			);
	
	
	$returnObject['returnValue']['data'] = $METRICS_OUT;
	
	$returnObject['returnValue']['rowsReturned'] = count($METRICS_OUT);
	$returnObject['returnValue']["rowsInSet"] = array(
                            "rowsFound" => count($METRICS_OUT),
                            "endFound" => true
                        );
	$returnObject['returnValue']['isRowCountComplete'] = true;


  
  echo json_encode($returnObject);


?>

