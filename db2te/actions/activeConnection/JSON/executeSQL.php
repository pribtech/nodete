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

$SQLToRun 				= getParameter("SQL");
$DoNotReturnSQL			= strtolower(getParameter("doNotReturnSQL","false")) == "true" ? true : false;
$bindParameters 		= getParameter("bindParameters");
$exitSQL				= getParameter("exitSQL");
$conditions		 		= getParameter("conditions");
$queryOpt		 		= getParameter("queryOpt");
$SQLParameters 			= getParameter("parameter");
$SQLMaxRowReturn 		= getParameter("maxRowReturn", 100);
$SQLReturnFromRow 		= getParameter("returnFromRow", 0);
$SQLQueryOpt 			= getParameter("queryOpt");
$MaxExecutionTime		= getParameter("maxExecutionTime");
$SQLAdHoc_delimiter 	= getParameter("STMTermChar", ";");
$SQLgetRowCount			= getParameter("getRowCount", ";");
$SaveInHistory 			= strtolower(getParameter("saveInHistory", "false")) == "true" ? true : false;
$SQLAdHoc_AutoCommit	= strtolower(getParameter("commitPerSTMT", "false")) == "true" ? true : false;
$SQLAdHoc_AbortOnFailure= strtolower(getParameter("abortOnFailure", $SQLAdHoc_AutoCommit ? "false" : "true"
													)) == "true" ? true : false;
$SQLAdHoc_AbortOnWarning= strtolower(getParameter("abortOnWarning", "false")) == "true" ? true : false;
$commitOnCondition	= false;

$displayXML    			= strtolower(getParameter("displayXML",			"false")) == "true" ? true : false;
$displayCLOB   			= strtolower(getParameter("displayCLOB",		"false")) == "true" ? true : false;
$displayXMLinline		= strtolower(getParameter("displayXMLinline",	"false")) == "true" ? true : false;
$displayCLOBinline		= strtolower(getParameter("displayCLOBinline",	"false")) == "true" ? true : false;
$displayBLOB			= strtolower(getParameter("displayBLOB",		"false")) == "true" ? true : false;
$displayDBCLOB			= strtolower(getParameter("displayDBCLOB",		"false")) == "true" ? true : false;
if($MaxExecutionTime !== null)
	connectionManager::getConnection()->setMaxExecutionTime($MaxExecutionTime);
try{
	connectionManager::getConnection()->setAutoCommit($SQLAdHoc_AutoCommit);

	if(is_string($bindParameters) && strtolower(getParameter("bindParametersEncoded", "false")) == "true")
		$bindParameters = json_decode($bindParameters, true);

	if(is_string($conditions) && strtolower(getParameter("conditionsEncoded", "false")) == "true")
		$conditions = json_decode($conditions, true);

	$returndata = array();
	$returndata['returnCode'] = "true";
	$returndata['returnValue'] = "";
	$returndata['returnMessage'] = "";

	if($queryOpt !== null) {
		$statment = connectionManager::getNewStatement("SET CURRENT QUERY OPTIMIZATION = ".$queryOpt);
		if(!$statment->statementSucceed) 
			throw new Exception("Set current query optimization failed, error".$statment->sqlerror);
	}
	if($SQLToRun == null) 
		throw new Exception("No SQL received");
	if(is_array($SQLToRun)) {
		ksort($SQLToRun);
		if($SaveInHistory) {
			$tempData = "";
			foreach($SQLToRun as $value)
				$tempData .= $value . $SQLAdHoc_delimiter . "\n";
			saveSQLToFile($tempData);
		}
		$returndata['returnValue'] = array();
		$returndata['returnValue']['RunTime'] = date('H:i:s l, M j');
		$returndata['returnValue']['TotalRunDuration'] = microtime(true);
		$returndata['returnValue']['AutoCommit'] = $SQLAdHoc_AutoCommit ? "true" : "false";
		$returndata['returnValue']['STMTReceived'] = count($SQLToRun);
		$returndata['returnValue']['STMTRun'] = 0;
		$returndata['returnValue']['STMTErrorCount'] = 0;
		$returndata['returnValue']['STMTWarningCount'] = 0;
		$returndata['returnValue']['STMTReturn'] = array();
		$i = 1;
		foreach ($SQLToRun as $key=>$localSQLToRun) {
			$localParameters = isset($SQLParameters[$key]) ? $SQLParameters[$key] : $SQLParameters;
			$localSQLMaxRowReturn = isset($SQLMaxRowReturn[$key]) && is_array($SQLMaxRowReturn) ? $SQLMaxRowReturn[$key] : $SQLMaxRowReturn;
			$localSQLReturnFromRow = isset($SQLReturnFromRow[$key]) && is_array($SQLReturnFromRow) ? $SQLReturnFromRow[$key] : $SQLReturnFromRow;
			$localbindParameters = isset($bindParameters[$key]) ? $bindParameters[$key] : null;
			$localSQLToRun = trim($localSQLToRun);
			$STMTReturn = extractResults($localSQLToRun, false, $localParameters, $localbindParameters, $localSQLMaxRowReturn, $localSQLReturnFromRow, $displayXML, $displayXMLinline, $displayCLOB, $displayCLOBinline, $displayBLOB, $displayDBCLOB, $DoNotReturnSQL,$returndata['returnValue']['STMTReturn'], $SQLgetRowCount);
			$returndata['returnValue']['STMTRun']++;
			$returndata['returnValue']['STMTReturn'][$key] = $STMTReturn;
			if(!$SQLAdHoc_AbortOnWarning) {
				if(substr($STMTReturn["STMTError"],0,2)=='01') {
					$STMTReturn["statementSucceed"] = true;
					$returndata['returnValue']['STMTWarningCount']++;
				}
			}		
			if($STMTReturn["statementSucceed"] == false) {
				$returndata['returnValue']['STMTErrorCount']++;
				$returndata['returnCode'] = "false";
				if($SQLAdHoc_AbortOnFailure) {
					$returndata['returnValue']['STMT'] = $STMTReturn["STMT"];
					$returndata['returnValue']['STMTMSG'] = $STMTReturn["STMTMSG"];
					break;
				}
			}
			if (isset($conditions[$i])) {
				$checkedReturnData = checkConditions($conditions[$i], $STMTReturn);
				if (isset($checkedReturnData['returnValue']))
					if ($checkedReturnData['returnValue'] == false) {
						$returndata['returnCode'] = $checkedReturnData['returnCode'];
						$returndata['returnMessage'] = $checkedReturnData['returnMessage'];
						$commitOnCondition = $checkedReturnData['commit'];
						break;
					} elseif ($checkedReturnData['commit'] && !$SQLAdHoc_AutoCommit)
						connectionManager::getConnection()->commit();
			}
			$i++;
		}
		$returndata['returnValue']['TotalRunDuration'] = microtime(true) - $returndata['returnValue']['TotalRunDuration'];
	} else {
		if($SaveInHistory)
			saveSQLToFile($SQLToRun);
	
		$SQLToRun = trim($SQLToRun);
		$nullArray = array();
		$returndata['returnValue'] = extractResults($SQLToRun, false, $SQLParameters, $bindParameters, $SQLMaxRowReturn, $SQLReturnFromRow, $displayXML, $displayXMLinline, $displayCLOB, $displayCLOBinline, $displayBLOB, $displayDBCLOB, $DoNotReturnSQL, $nullArray, $SQLgetRowCount);

		if($returndata['returnValue']["statementSucceed"] == false) {
			$returndata['returnCode'] = "false";
			$returndata['returnMessage']=$returndata['returnValue']['STMTMSG'];
		}
	
		$i=0;
		if (isset($conditions[$i])) {
			$checkedReturnData = checkConditions($conditions[$i], $returndata);
			if (isset($checkedReturnData['returnValue'])) {
				if ($checkedReturnData['returnValue'] == false) {
					$returndata['returnCode'] = $checkedReturnData['returnCode'];
					$returndata['returnMessage'] = $checkedReturnData['returnMessage'];
					$commitOnCondition = $checkedReturnData['commit'];
					break;
				} elseif ($checkedReturnData['commit'] && !$SQLAdHoc_AutoCommit)
						connectionManager::getConnection()->commit();
			}
		}
		$returndata['returnValue']['TotalRunDuration'] = microtime(true) - $returndata['returnValue']['TotalRunDuration'];
	}
	if(!$SQLAdHoc_AutoCommit && $returndata['returnCode'] == "false") {
		if ($commitOnCondition)
			connectionManager::getConnection()->commit();
		else 
			connectionManager::getConnection()->rollback();
	} elseif(!$SQLAdHoc_AutoCommit)
		connectionManager::getConnection()->commit();
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	$returndata['success'] = false;
	$returndata['returnValue'] = "Failed: ".$e->getmessage();
	$returndata['message'] = $returndata['returnValue'];
}
if (isset($exitSQL))
	if ($exitSQL!=null)
		if ($exitSQL!='') {
			$statement = connectionManager::getNewStatement($exitSQL);
			if(!$statement->statementSucceed) {
				$returndata['returnCode'] = "false";
				$returndata['success'] = false;
				$returndata['returnValue'] = "Exit SQL Failed, Statement: ".$exitSQL ;
				$returndata['message'] = $returnInformation['returnValue'];
			}
		}

array_walk_recursive($returndata, "array_iconv");
echo json_encode($returndata);

function array_iconv(&$val, $key){
   	$val =iconv("UTF-8", "ISO-8859-1//IGNORE", $val);
   }



function saveSQLToFile($SQLData) {
	if(ADHOC_SAVE_HISTORY) {
		file_put_contents(QUERY_FILES_DIRECTORY . "adhocHistory/" . time() . "-" . date('l-dS-\of-F-Y--h-i-s--A') . ".sql", $SQLData, FILE_USE_INCLUDE_PATH);
		$fileInDir = scandir(QUERY_FILES_DIRECTORY . "adhocHistory/", 0);
		$tempFiles = array();
		foreach($fileInDir as $afile)
			if(strpos($afile, ".") != 0 && strpos($afile, ".sql") == (strlen($afile) - 6))
				$tempFiles[] = $afile;
		if(ADHOC_HISTORY_MAX_FILES != false) 
			if(sizeof($tempFiles) > ADHOC_HISTORY_MAX_FILES) {
				$len = sizeof($tempFiles);
				rsort($tempFiles);
				for($i = 10; $i < $len; $i++)
					unlink(QUERY_FILES_DIRECTORY . "adhocHistory/" . $tempFiles[$i]);
			}
	}
}

function extractResults($SQLToRun, $NotUsedWasCursorIndicator, $SQLParameters, $bindParameters, $SQLMaxRowReturn, $SQLReturnFromRow, $displayXML, $displayXMLinline, $displayCLOB, $displayCLOBinline, $displayBLOB, $displayDBCLOB, $DoNotReturnSQL, &$dataPassBack, $SQLgetRowCount) {
	if($SQLParameters != null)
		foreach ($SQLParameters as $key=>$value)
			$SQLToRun = str_replace("?$key?", $value, $SQLToRun);

	if($bindParameters == null) {
		$matches = array();
		$numFound = preg_match_all("/\?\!(?:[\w]+\=[^?\&]*[\&]?)*\?/", $SQLToRun, $matches);
		if($numFound > 0) {
			$i = 1;
			$bindParameters = array();
			foreach($matches[0] as $match) {
				$parameteOptions = array();
				$matchTrimmed = trim($match, "?!");
				if($matchTrimmed != "")
					parse_str($matchTrimmed, $parameteOptions);
				
				$bindParameters[$i]['name'] = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$i}") : "p{$i}";
				if(isset($parameteOptions['value']))
					$bindParameters[$i]['value'] = $parameteOptions['value'];
				else
					$bindParameters[$i]['value'] = getParameter($bindParameters[$i]['name']);
				if(isset($parameteOptions['dataType']))
					$bindParameters[$i]['dataType'] = $parameteOptions['dataType'];
				if(isset($parameteOptions['type']))
					$bindParameters[$i]['type'] = $parameteOptions['type'];
				if(isset($parameteOptions['DB2dataType']))
					$bindParameters[$i]['DB2dataType'] = $parameteOptions['DB2dataType'];
				if(isset($parameteOptions['precision']))
					$bindParameters[$i]['precision'] = $parameteOptions['precision'];
				if(isset($parameteOptions['scale']))
					$bindParameters[$i]['scale'] = $parameteOptions['scale'];
				if(isset($parameteOptions['settype']))
					$bindParameters[$i]['settype'] = $parameteOptions['settype'];
				if(isset($parameteOptions['conversion']))
					$bindParameters[$i]['conversion'] = $parameteOptions['conversion'];

				switch (connectionManager::getConnection()->getDBMS()) { 
					case 'ORACLE' :
						$SQLToRun = str_replace($match, ":".$bindParameters[$i]['name']." ", $SQLToRun);
						break;
					case 'ssh' :
						$SQLToRun = str_replace($match, "$"."{".$bindParameters[$i]['name']."}", $SQLToRun);
						break;
					case 'MQ' :
						$SQLToRun = str_replace($match, " ", $SQLToRun);
						break;
					default:
						$SQLToRun = str_replace($match, "?", $SQLToRun);
				}
				$i++;
			}
		}
	}
	
	if($bindParameters != null && $dataPassBack != null)
		foreach($bindParameters as $key=>&$value) {
			if(isset($value['type']))
				if(strtoupper($value['type']) == 'TE_INLINE_BIND') {
					$value['type'] = 'DB2_PARAM_IN';
					$dataLocation = explode('.', $value['value']);
					$isValueSet = false;
					if($dataLocation !== false)
						if(count($dataLocation) == 4)
							if(isset($dataPassBack[$dataLocation[0]]["resultSet"][$dataLocation[1]]['data'][$dataLocation[2]][$dataLocation[3]])) {
								$isValueSet = true;
								$value['value'] = $dataPassBack[$dataLocation[0]]["resultSet"][$dataLocation[1]]['data'][$dataLocation[2]][$dataLocation[3]];
							}
					if(!$isValueSet)
						$value['value'] = null;
				}
		}
	
	$STMTReturn = array();
	if(!$DoNotReturnSQL)
		$STMTReturn["STMT"] = $SQLToRun;
	else 
		$STMTReturn["STMT"] = "";
	$STMTReturn["TotalRunDuration"] = microtime(true);
	$STMTReturn["runDuration"] = 0;
	$STMTReturn["parameters"] = "false";
	$STMTReturn["resultSet"] = array();
	$STMTReturn["numOfResultSet"] = 0;
	$STMTReturn["STMTError"] = "";
	$STMTReturn["STMTMSG"] = "";
	
	$statment = null;
	if($bindParameters == null) {
		$statment = connectionManager::getNewStatement($SQLToRun, false, false, false, $SQLgetRowCount);
		if($statment->state() == '07001') {
			$statment = connectionManager::getNewStatement($SQLToRun, true, false, false, $SQLgetRowCount);
			if($statment->statementSucceed)
				$statment->executeStmtWithParameters(null);
		}
	} else {
		$statment = connectionManager::getNewStatement($SQLToRun, true, false, false, $SQLgetRowCount);
		if($statment->statementSucceed)
			$statment->executeStmtWithParameters($bindParameters);
	}

	$STMTReturn["runDuration"] = $statment->elapsedTime;

	if($statment->statementSucceed) {
		$i = 0;
		do {
			$i++;
			$rowCounter = 0;
			$result = array();
			$result['rowsReturned'] = 0;
				
			$result['data'] = array();
			
			$result['columnsInfo'] = $statment->getColumnInfo();
			if($result['columnsInfo']['num'] == 0)	{
				$STMTReturn["numOfResultSet"]++;
				$STMTReturn["resultSet"][] = $result;
				continue;
			}

			$resultRow = $statment->fetchIndexedRow();

			for(;$statment->statementSucceed && $SQLReturnFromRow > 0 && $resultRow; $SQLReturnFromRow--) {
				$rowCounter++;
				$resultRow = $statment->fetchIndexedRow();
			}
			
			while($statment->statementSucceed && $resultRow && $result['rowsReturned'] < $SQLMaxRowReturn) {
				$rowCounter++;
				$result['rowsReturned']++;
				$row = array();
				
				for($j=0; $j<$result['columnsInfo']['num']; $j++) {
					switch($result['columnsInfo']['type'][$j]) {
						case "xml" :
							$value =   $resultRow[$j] ;
							$row[] .= $displayXML ? ($displayXMLinline ? $value : base64_encode($value)) : "";
							break;
						case "clob":
							$value =  connectionManager::getConnection()->getDBMS()=='ORACLE' ? $resultRow[$j]->load() : $resultRow[$j] ;
							$row[] .= $displayCLOB ? ( $displayCLOBinline ? $value : base64_encode($value) ) : "";
							break;
						case "blob":
							$row[] .= $displayBLOB ? base64_encode($resultRow[$j]) : "";
							break;
						case "dbclob":
							$row[] .= $displayDBCLOB ? base64_encode($resultRow[$j]) : "";
							break;
						default:
							$row[] =  $resultRow[$j];
					}
				}
				$result['data'][] = $row;
				$resultRow = $statment->fetchIndexedRow();
			}
			$result["rowsInSet"] = $statment->getRowsInResultSet();
			$STMTReturn["numOfResultSet"]++;
			$STMTReturn["resultSet"][] = $result;
		} while ( $statment->nextResultSet() );
	}
	$STMTReturn["statementSucceed"] = $statment->statementSucceed;
	$STMTReturn["STMTMSG"] = $statment->sqlerror;
	$STMTReturn["STMTError"] = $statment->sqlstate;
	$STMTReturn["parameters"] = $statment->parameters;
	$STMTReturn["TotalRunDuration"] = microtime(true) - $STMTReturn["TotalRunDuration"];
	
	return $STMTReturn;
}

function checkConditions($localConditions, $STMTReturn) {
	$index = 0;
	$checkedReturnData = array();
	$checkedReturnData['returnValue'] = true;
	$checkedReturnData['returnCode'] = "true";
	$checkedReturnData['returnMessage'] = "";
	$checkedReturnData['commit'] = false;
	
	if (is_array($localConditions)) {	
		$checkedReturnData['returnValue'] = false;
		foreach($localConditions as $key=>$matchType) {
			switch(strtolower($key)) {
				case "rowsreturned" :
					if (!isset($STMTReturn['resultSet'][$index]['rowsReturned'])) {
						$checkedReturnData['returnValue'] = false;
						$checkedReturnData['returnCode'] = "false";
						$checkedReturnData['returnMessage'] = "No data returned from previous SQL.";
						$checkedReturnData['commit'] = false;
						return $checkedReturnData;
					}	
					$index = isset($matchType['index']) ? $matchType['index'] : 0;
					$conditionMatched = null;
					switch($matchType['operator']) {
						case "=":					
							$conditionMatched = ($STMTReturn['resultSet'][$index]['rowsReturned'] == $matchType['condition']);
							break;
						case ">":
							$conditionMatched = ($STMTReturn['resultSet'][$index]['rowsReturned'] > $matchType['condition']);
							break;
						case "<":
							$conditionMatched = ($STMTReturn['resultSet'][$index]['rowsReturned'] < $matchType['condition']);
							break;
						case ">=":
							$conditionMatched = ($STMTReturn['resultSet'][$index]['rowsReturned'] >= $matchType['condition']);
							break;
						case "<=":
							$conditionMatched = ($STMTReturn['resultSet'][$index]['rowsReturned'] <= $matchType['condition']);
							break;
						case "!=":
							$conditionMatched = ($STMTReturn['resultSet'][$index]['rowsReturned'] <> $matchType['condition']);
							break;
					}
					if ($conditionMatched == true) {
						if (isset($matchType['onTrue'])) 
							$checkedReturnData = setReturnAction($matchType['onTrue'], $conditionMatched);
						else 
							$checkedReturnData['returnValue'] = true;
					} else if ($conditionMatched == false) {
						if (isset($matchType['onFalse']))
							$checkedReturnData = setReturnAction($matchType['onFalse'], $conditionMatched);
						else 
							$checkedReturnData['returnValue'] = true;
					} else {
						$checkedReturnData['returnCode'] = "false";
						$checkedReturnData['returnMessage'] = "Could not evaluate expression : ".$matchType['operator'].$matchType['condition'];
					}
					break;
				case "values" :
				default:
					$checkedReturnData['returnCode'] = "false";
					$checkedReturnData['returnMessage'] = "Could not evaluate condition type : " + $key;
			}
		}
	}
	return $checkedReturnData;
}
		
function setReturnAction($onCondition, $conditionMatche) {
	$checkedReturnData = array();
	$checkedReturnData['commit'] = false;
	$checkedReturnData['returnCode'] = "true";
	$checkedReturnData['returnMessage'] = "";
	$checkedReturnData['returnValue'] = false;
	
	if (isset($onCondition['nextAction'])) {
		switch(strtolower($onCondition['nextAction'])) {
			case "commit" :
				$checkedReturnData['commit'] = true;
				return $checkedReturnData;
			case "rollback" :
				break;
			case "endrun" :
				$checkedReturnData['commit'] = true;
				break;
			default:
				$checkedReturnData['returnCode'] = "false";
				$checkedReturnData['returnMessage'] = "Could not evaluate next action : ".$onCondition['nextAction'];
				return $checkedReturnData;		
		}
		$checkedReturnData['returnCode'] = isset($onCondition['setrunreturn']) ? $onCondition['setrunreturn'] : "false";
		$checkedReturnData['returnMessage'] = isset($onCondition['setrunmessage']) ? $onCondition['setrunmessage'] : "No return message specified.";
	} else {
		$checkedReturnData['returnCode'] = "false";
		$checkedReturnData['returnMessage'] = "Error evaluating next action";
	}	
	return $checkedReturnData;
}			
?>
