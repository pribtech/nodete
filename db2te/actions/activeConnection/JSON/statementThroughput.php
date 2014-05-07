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

/**
 * @name 	statementThroughput * * 
 * @param 	SQL (string)
 * 			an SQL statement, or in case of a workload of 1 statement.
 * @param	Period (integer)
 * 			The maximum time over which the statement will be run.  Default value = 25s.
 * @param 	RunPrimer (boolean)
 * 			Since we are not using db2_pconnect, the first SQL execution will take a lot longer.
 *          To get around this problem, we can run a simple statement to prime the connection.
 * 			The execution time for this statement is not counted in the return values.
 * 			Default Value = true.
 * @param 	retrieveAllData (boolean)
 * 			pulles all data from the query back from the database but does not return it to the
 *			client
 * 			Default Value = false.
 * @param	MinRunAmount (integer)
 *			The maximum time over which the statement could be run. 
 *			Default Value = 1
 * @param	AutoCommit (boolean)
 *			The maximum time over which the statement could be run.
 *			Default Value = true
 * @param	Commit (mixed)
 *			If auto commit is false this indicates if and when a commit should occur.
 *				Possible values:
 *					true – commit at the end of the run given no errors
 *					false – role back at the end of the run
 *			Default Value = true
 *
 * @return 	returnObject	:	object {
 * 				returnCode			: true | false 		//return success on true.
 * 				returnValue			: object {
 *							SQL				: string		//statment use in run. Default = null
 *							period			: integer		//The maximum time over which the statement could be run
 *							periodUsed		: integer		//The maximum time over which the statement was run
 *			 				RunCount 		: integer		//The number time the statement was run
 *		 					avgRunTime		: integer		//The average run time
 *							maxRunTime		: integer		//The shortest run time
 *							minRunTime		: integer		//The longest run time
 *							Deviation		: integer		//The standard deviation of all run times
 *							runTimes		: integer array	//a comma delimited string execution time
 *						}
 * 			}
 *  
 * Description:
 * This action will run a SQL statements (or a workload) as many or at lest a number of times and 
 * report the number of times the SQL was rum and other meteric about the run.
 * 
 * @example	Example 1: DB2 MC Tutorial Framework - tutorialscript.xml usage.
 * 			This example runs a statements as many time as it can for 10s when the tutorial enters this
 * 			page.  On succuessful completion of the action, echo the results.
 * 
 * 			<entryAction name="runTestWorkload" type="serverAction">
 * 				<parameterList>
 * 					<parameter name="action" type="fixed">
 * 						<value>statementThroughput</value>
 * 					</parameter>
 * 					<parameter name="SQL" type="fixed">
 * 						<value>SELECT * FROM EMPLOYEE</value>
 * 					</parameter>								
 *					<parameter name="Period" type="fixed">
 *						<value>10</value>
 *					</parameter>
 *				</parameterList>
 *				<followOnAction condition="true">
 * 					<task>
 * 						<assignLocalParameter name="SQL" type="returnObject">
 * 							<value>runTestWorkload.returnValue.SQL</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="period" type="returnObject">
 * 							<value>runTestWorkload.returnValue.period</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="periodUsed" type="returnObject">
 * 							<value>runTestWorkload.returnValue.periodUsed</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="RunCount" type="returnObject">
 * 							<value>runTestWorkload.returnValue.RunCount</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="avgRunTime" type="returnObject">
 * 							<value>runTestWorkload.returnValue.avgRunTime</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="maxRunTime" type="returnObject">
 * 							<value>runTestWorkload.returnValue.maxRunTime</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="minRunTime" type="returnObject">
 * 							<value>runTestWorkload.returnValue.minRunTime</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="Deviation" type="returnObject">
 * 							<value>runTestWorkload.returnValue.Deviation</value>
 * 						</assignLocalParameter>
 * 						<assignLocalParameter name="runTimes" type="returnObject">
 * 							<value>runTestWorkload.returnValue.runTimes</value>
 * 						</assignLocalParameter>
 * 						<echo><![CDATA[
 * ----------------------------------------------------------
 * SQL: ?SQL?
 * Period: ?period?
 * Period Used: ?periodUsed?
 * Run Count: ?RunCount?
 * Average Run Time: ?avgRunTime?
 * Max Run Time: ?maxRunTime?
 * Min Run Time: ?minRunTime?
 * Deviation: ?Deviation?
 * Run Times: ?runTimes?
 * -----------------------------------------------------------
 * ]]></echo>
 * 					</task>
 * 				</followOnAction>
 * 			</entryAction>						
 * 
 */

$SQLToRun = isset($_POST['SQL']) ? $_POST['SQL'] : null;
$Period = isset($_POST['Period']) ? $_POST['Period'] : 10;
$RunPrimer = isset($_POST['RunPrimer']) ? $_POST['RunPrimer'] : true;
$retrieveAllData = isset($_POST['retrieveAllData']) ? $_POST['retrieveAllData'] : false;


$minRunAmount = isset($_POST['MinRunAmount']) ? $_POST['MinRunAmount'] : 1;
$AutoCommit = isset($_POST['AutoCommit']) ? $_POST['AutoCommit'] : true;
$Commit = isset($_POST['Commit']) ? $_POST['Commit'] : true;

connectionManager::getConnection()->setAutoCommit($AutoCommit);

if($SQLToRun == null)
{
	echo  
	'{
		returnCode: "false",
		returnValue: "No SQL received"
	}';
	exit;
}


$elapsedTime = 0;
$runCount = 0;
$runPeroidUsed = 0;
$maxRunTime = 0;
$minRunTime = 0;
$runTimes = array();
$retrevialTime = array();
$totalTime = array();
$error = false;

if($RunPrimer)
	$temp = connectionManager::getNewStatement($SQLToRun);

$runPeroidUsed = microtime(true);
$EndTime = $runPeroidUsed + $Period;
while($EndTime > (microtime(true) + $minRunTime) || $runCount < $minRunAmount)
{
	$startTotalTile = microtime(true);
	$runCount++;
	$temp = connectionManager::getNewStatement($SQLToRun, false, false, false); 
	$runTimes[] = $temp->elapsedTime;
	
	$startTime = microtime(true);
	if($retrieveAllData)
	{
		while($temp->fetchIndexedRow());
	}
	$retrevialTime[] = microtime(true) - $startTime;
	
	$elapsedTime = microtime(true) - $startTotalTile;
	$totalTime[] = $elapsedTime;
	
	if($minRunTime > $elapsedTime && $elapsedTime >= 0)
		$minRunTime = $elapsedTime;
}
$runPeroidUsed = microtime(true) - $runPeroidUsed;

if(!$AutoCommit && !$Commit)
{
	connectionManager::getConnection()->rollback();
}
elseif(!$AutoCommit)
{
	connectionManager::getConnection()->commit();
}

$returnArray = array();

if($error)
	$returnArray['returnCode'] = "false";
else 
	$returnArray['returnCode'] = "true";

$returnArray['returnValue']['SQL'] = $SQLToRun;
$returnArray['returnValue']['period'] = $Period;
$returnArray['returnValue']['periodUsed'] = $runPeroidUsed;
$returnArray['returnValue']['periodUsedDisplay'] = formateTimeForDisplay($runPeroidUsed);
$returnArray['returnValue']['RunCount'] = $runCount;

$runaverage = array_sum($runTimes)/count($runTimes);
$Deviation = 0;
$runTimesString = "";
if(count($runTimes) >= 2)
{
	$i = 0;
	foreach($runTimes as $aRunTime)
	{
		$runTimesString .= '{"runIndex":' . ($i++) . ',"runLength":' . $aRunTime . "},";
		$Deviation += pow($aRunTime-$runaverage, 2);
	}
	$runTimesString = trim($runTimesString, ","); 
	$Deviation += sqrt($Deviation/(count($runTimes)-1));
}
else
{
	$Deviation = $runTimes[0];
	$runTimesString = $runTimes[0];	
}

$returnArray['returnValue']['avgRunTime'] = $runaverage;
$returnArray['returnValue']['maxRunTime'] = max($runTimes);
$returnArray['returnValue']['minRunTime'] =  min($runTimes);
$returnArray['returnValue']['Deviation'] = $Deviation;

$returnArray['returnValue']['avgRunTimeDisplay'] = formateTimeForDisplay($runaverage);
$returnArray['returnValue']['maxRunTimeDisplay'] = formateTimeForDisplay(max($runTimes));
$returnArray['returnValue']['minRunTimeDisplay'] = formateTimeForDisplay(min($runTimes));
$returnArray['returnValue']['DeviationDisplay'] = formateTimeForDisplay($Deviation);

$returnArray['returnValue']['runTimes'] = rawurldecode($runTimesString);








$runaverage = array_sum($retrevialTime)/count($runTimes);
$Deviation = 0;
$runTimesString = "";
if(count($retrevialTime) >= 2)
{
	$i = 0;
	foreach($retrevialTime as $aRunTime)
	{
		$runTimesString .= '{"runIndex":' . ($i++) . ',"runLength":' . $aRunTime . "},";
		$Deviation += pow($aRunTime-$runaverage, 2);
	}
	$runTimesString = trim($runTimesString, ","); 
	$Deviation += sqrt($Deviation/(count($retrevialTime)-1));
}
else
{
	$Deviation = $retrevialTime[0];
	$runTimesString = $retrevialTime[0];	
}

$returnArray['returnValue']['dataRetrevialTime']['avgRunTime'] = $runaverage;
$returnArray['returnValue']['dataRetrevialTime']['maxRunTime'] = max($retrevialTime);
$returnArray['returnValue']['dataRetrevialTime']['minRunTime'] =  min($retrevialTime);
$returnArray['returnValue']['dataRetrevialTime']['Deviation'] = $Deviation;

$returnArray['returnValue']['dataRetrevialTime']['avgRunTimeDisplay'] = formateTimeForDisplay($runaverage);
$returnArray['returnValue']['dataRetrevialTime']['maxRunTimeDisplay'] = formateTimeForDisplay(max($retrevialTime));
$returnArray['returnValue']['dataRetrevialTime']['minRunTimeDisplay'] = formateTimeForDisplay(min($retrevialTime));
$returnArray['returnValue']['dataRetrevialTime']['DeviationDisplay'] = formateTimeForDisplay($Deviation);

$returnArray['returnValue']['dataRetrevialTime']['runTimes'] = rawurldecode($runTimesString);




$runaverage = array_sum($totalTime)/count($runTimes);
$Deviation = 0;
$runTimesString = "";
if(count($totalTime) >= 2)
{
	$i = 0;
	foreach($totalTime as $aRunTime)
	{
		$runTimesString .= '{"runIndex":' . ($i++) . ',"runLength":' . $aRunTime . "},";
		$Deviation += pow($aRunTime-$runaverage, 2);
	}
	$runTimesString = trim($runTimesString, ","); 
	$Deviation += sqrt($Deviation/(count($totalTime)-1));
}
else
{
	$Deviation = $totalTime[0];
	$runTimesString = $totalTime[0];	
}

$returnArray['returnValue']['totalTime']['avgRunTime'] = $runaverage;
$returnArray['returnValue']['totalTime']['maxRunTime'] = max($totalTime);
$returnArray['returnValue']['totalTime']['minRunTime'] =  min($totalTime);
$returnArray['returnValue']['totalTime']['Deviation'] = $Deviation;

$returnArray['returnValue']['totalTime']['avgRunTimeDisplay'] = formateTimeForDisplay($runaverage);
$returnArray['returnValue']['totalTime']['maxRunTimeDisplay'] = formateTimeForDisplay(max($totalTime));
$returnArray['returnValue']['totalTime']['minRunTimeDisplay'] = formateTimeForDisplay(min($totalTime));
$returnArray['returnValue']['totalTime']['DeviationDisplay'] = formateTimeForDisplay($Deviation);

$returnArray['returnValue']['dataRetrevial']['runTimes'] = rawurldecode($runTimesString);




echo json_encode($returnArray);

?>
