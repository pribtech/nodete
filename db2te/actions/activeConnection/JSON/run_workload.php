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
/**
 * @name 	run_workload * * 
 * @param 	SQL
 * 			an array of SQL statements, or in case of a workload of 1 statement, a string.
 * @param	Repetition
 * 			The number of times to run this workload.  Default value = 1.
 * @param 	SampleRate
 * 			How often should performance number be gathered.  Default value = 1.
 * 			As an example, if "Repetition" is set to 100 and "SampleRate" to 5.  Execution
 * 			Time will be returned after the 5th, 10th, 15th repetition and so on...
 * @param	Accumulative
 * 			Workload execution time can either be gather for each run or as a sum of all
 * 			execution.  Default value = true.
 * @param 	RunPrimer
 * 			Since we are not using db2_pconnect, the first SQL execution will take a lot longer.
 *          To get around this problem, we can run a simple statement to prime the connection.
 * 			The execution time for this statement is not counted in the return values.
 * 			Default Value = true.
 * @return 	returnObject{
 * 				statementCount 	: integer			//number of statement submitted
 * 				returnCode		: true | false 		//return success on true.
 * 				returnValue		: 
 * 					xValue		: string 			//a comma delimited string for repetition number.
 * 					scriptTime 	: string			//a comma delimited string execution time
 * 													//required for the full script.
 * 					SQL []		: array of string	//array of execution times with each element
 * 													//corresponding to each SQL statement in the workload.
 * 			}
 *  
 * Description:
 * This action will run a set of SQL statements (or a workload) a number of times and 
 * report the amount of time needed to execute this workload.  Statistics is gathered
 * for the full workload as well as on individual statements.
 * 
 * @example	Example 1: DB2 MC Tutorial Framework - tutorialscript.xml usage.
 * 			This example runs three different statements when the tutorial enters this
 * 			page.  On succuessful completion of the action, it assigns 3 different
 * 			execution time to 3 variables to be used later in the tutorial.
 * 
 * 			<entryAction name="runTestWorkload" type="serverAction">
 * 				<parameterList>
 * 					<parameter name="action" type="fixed">
 * 						<value>run_workload</value>
 * 					</parameter>
 * 					<parameter name="SQL[0]" type="fixed">
 * 						<value>SELECT * FROM EMPLOYEE</value>
 * 					</parameter>
 *					<parameter name="SQL[1]" type="fixed">
 *						<value>SELECT * FROM CHEUNGK.DEPARTMENT</value>
 *					</parameter>									
 *					<parameter name="Repetition" type="fixed">
 *						<value>100</value>
 *					</parameter>
 *					<parameter name="SampleRate" type="fixed">
 *						<value>5</value>
 *					</parameter>
 *				</parameterList>
 *				<followOnAction condition="true">
 * 					<task>
 *						<action name="loadGraph" type="blank">
 *							<parameterList>
 *								<parameter name="X_DATA" type="returnObject">
 *									<value>runTestWorkload.returnValue.xValue</value>
 *								</parameter>
 *								<parameter name="Y_DATA" type="returnObject">
 *									<value>runTestWorkload.returnValue.SQL.0</value>
 *								</parameter>
 *								<parameter name="Y_DATA2" type="returnObject">
 *									<value>runTestWorkload.returnValue.SQL.1</value>
 *								</parameter>
 *							</parameterList>
 *						</action>
 * 					</task>
 * 				</followOnAction>
 * 			</entryAction>						
 * 
 */

$SQLToRun 		= getParameter('SQL');
$NumRepetitions = getParameter('Repetition', 1);
$SampleRate 	= getParameter('SampleRate', 1);
$Accumulative 	= strtolower(getParameter('Accumulative', "true")) == "true" ? true : false;
$RunPrimer 		= strtolower(getParameter('RunPrimer', "true")) == "true" ? true : false;

connectionManager::getConnection()->setAutoCommit(true);
if($SQLToRun == null)
{
	echo  
	'{
		returnCode: "false",
		returnValue: "No SQL received"
	}';
	exit;
}

$xValue = "";
$yValueScript = "";
$statementCount = 0;
$scriptElapsedTime = 0;
$prepareStmtTime = 0;
$yValueSets = array();
$statementElapsedTimes = array();
$statementArray = array();
$statementSQLCode = array();
$statementErrMsg = array();


$scriptStartTime = microtime(true);
if (is_array($SQLToRun)){
	$statementCount = count($SQLToRun);
	foreach($SQLToRun as $key=>$stmt)
	{
		$statementArray[$key] =	$stmt;
	}
} else {
	$statementCount = 1;
	$statementArray[] = rawurldecode($SQLToRun);
}

$prepareStmtTime = microtime(true) - $scriptStartTime;

for ($i = 1; $i <= $NumRepetitions; $i++) {
	foreach ($statementArray as $key=>$stmt) {
		$temp = connectionManager::getNewStatement($stmt, false, false, false);
		if ($Accumulative) {
			$statementElapsedTimes[$key] = isset($statementElapsedTimes[$key]) ? $statementElapsedTimes[$key] + $temp->elapsedTime : $temp->elapsedTime;
		} else {
			$statementElapsedTimes[$key] = $temp->elapsedTime;
		}
	}
	//Need to include prepare time in first run for scriptElapsedTime.
	if ($i == 1 || $Accumulative) {
		$scriptElapsedTime = $prepareStmtTime;
	} else {
		$scriptElapsedTime = 0;
	}
	foreach ($statementElapsedTimes as $execTime) {
		$scriptElapsedTime = $scriptElapsedTime + $execTime;
	}
	if ($i % $SampleRate == 0) {
		$xValue .= "$i".",";
		foreach($statementElapsedTimes as $key=>$value){
			$yValueSets[$key] = isset($yValueSets[$key]) ? $yValueSets[$key] . "$value"."," : "$value".",";
		}
		$yValueScript .= "$scriptElapsedTime".",";
	}
}

$xValue = trim($xValue, ",");

foreach($yValueSets as $key=>$value)
{
	$yValueSets[$key] = trim($value, ",");
}
$yValueScript = trim($yValueScript, ",");

$returnArray = array();
$returnArray['statementCount'] = "$statementCount";
$returnArray['returnCode'] = "true";
$returnArray['returnValue']['xValue']= "$xValue";
$returnArray['returnValue']['scriptTime'] = "$yValueScript";
$returnArray['returnValue']['SQL'] = array();
foreach ($yValueSets as $key=>$value) {
	$returnArray['returnValue']['SQL']["$key"] = "$value";
}
echo json_encode($returnArray);

?>