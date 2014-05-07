<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
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

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement.php');

class Statement_ORACLE extends Statement {

	function __construct($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE, $dbconn = null) {
		
		$this->otherResult = array();
		$this->otherResult_counter = -1;
		$this->statementSucceed = false;
		if($dbconn == null)
			$this->dbconn = connectionManager::getConnection()->dbconn;
		else if(is_subclass_of($dbconn, 'Connection')) 
			$this->dbconn = $dbconn->dbconn;	
		else if(is_resource($dbconn))
			$this->dbconn = $dbconn;
		else {
			$this->dbconn = null;
			$this->sqlerror = 'No Connection as connection passed not unknown type, details: '.var_export($dbconn,true);
			$this->sqlstate = '99999';		
			return;
		}
		$this->rows = -1;
		$this->stmt = $stmt_text;
		$this->getRowCount = $getRowCount;
		$this->elapsedTime = 0;
		if ($this->dbconn === false) {
			$this->sqlerror = 'No Connection';
			$this->sqlstate = '99999';		
			return;
		}
		$startTime = microtime(true);

		$this->execResult = @oci_parse($this->dbconn, $this->stmt);

		if ($prepare_statment) 
			$this->type = "Prepare";
		else { 
			if(self::isError($this->execResult))
				return;
			$this->type = "Execute";
			@oci_execute($this->execResult);
		}

		$this->elapsedTime = microtime(true) - $startTime; // record end time
		if(self::isError($this->execResult))
			return;
		$this->totalRowsInResultSet = @oci_num_rows($this->execResult);
		if(self::isError($this->execResult))
			return;
		$this->statementSucceed = true;
	}

	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		$startTime = microtime(true);
		$this->sqlerror = 'To be done - execute';
		$this->sqlstate = '99999';		
		$this->statementSucceed = false;
		$this->elapsedTime = microtime(true) - $startTime;
		$this->statementSucceed=true;
		$execResult = false;

		$startTime = microtime(true);
		if ($parameters != null) {
			@oci_execute($this->execResult);  // to do parameters
			//  $execResult = $this->checkForError(@db2_execute($this->execResult, $parameters)); // Record execution result
		} else 
			@oci_execute($this->execResult);
		$this->elapsedTime = microtime(true) - $startTime; // record end time
		if(isError($this->execResult))
			return $this->sqlstate;

		$this->baseResult = $this->execResult;

		$this->totalRowsInResultSet = @oci_num_rows($this->execResult);
		if(self::isError($this->execResult))
			return $this->sqlstate;
		return 0;

	}
	function isError(&$resource) {
	    $e = @oci_error($resource); 
	    if($e == null) return false; 
		$this->sqlstate = $e['code'];
		$this->sqlerror = $e['message'];
		$this->statementSucceed = false;
		return true;
	}
	function prepSuccessful() { // Query if prepare was successful
		return !self::isError($this->execResult);
	}

	function execSuccessful() { // Query if execute was successful
		return !self::isError($this->execResult);
	}

	function state() { // Query the SQL State
		return $this->sqlstate;
	}
	function errorMsg() { // Query the SQL Error Message
		return $this->sqlerror;
	}

	function nextResultSet() {
		if(!$this->statementSucceed) return false;
		if($this->resultSet==0) {
			if(strtoupper(substr(trim($this->stmt),0,4)) != 'CALL') { 
				$this->resultSet++;
				return false;
			}
		} 
	
		$this->otherResult[] = $this->execResult;
		$this->execResult = $this->baseResult;
		$this->rowsRead = 0;
		$this->totalRowsInResultSet = -1;
		if(!$this->statementSucceed) return false;
		if($this->execResult !== false) {
			$this->resultSet++;
			if($this->sqlerror == "" && $this->sqlstate == "")
				$this->totalRowsInResultSet = @oci_num_rows($this->execResult);
		}
		return $this->execResult;	
	}
	
	function getColumnInfo() {
	
		if($this->execResult == false || $this->execResult == null) {
			$this->sqlerror = 'No column information';
			$this->sqlstate = '99999';
			$this->statementSucceed=false;
			return;
		}
		$columnInfo = array();
		$columnInfo['num'] = @oci_num_fields($this->execResult);
		if(self::isError($this->execResult))
			return;
		$columnInfo['name'] = array();
		$columnInfo['precision'] = array();
		$columnInfo['scale'] = array();
		$columnInfo['type'] = array();
		$columnInfo['width'] = array();
		$columnInfo['displaySize'] = array();

		for($i = 1; $i <= $columnInfo['num']; $i++){
			$columnInfo['name'][]		= @oci_field_name($this->execResult, $i);
			$columnInfo['precision'][] 	= @oci_field_precision($this->execResult, $i);
			$columnInfo['scale'][]		= @oci_field_scale($this->execResult, $i);
			$type						= @strtolower(@oci_field_type($this->execResult, $i));
			switch ($type) {
				case 108 :
					$columnInfo['type'][]='xml';
					break;
				default:
					$columnInfo['type'][]=$type;
			}
			$columnInfo['width'][]		= @oci_field_size($this->execResult, $i);
			$columnInfo['displaySize'][]= @oci_field_size($this->execResult, $i); //@oci_field_display_size($this->execResult, $i);
		}
		return $columnInfo;
	}	

	function fetch() {
		if(self::isError($this->execResult))
			return;
		return $this->checkForRowReturnError(@oci_fetch_array($this->execResult));
	}

	function fetchIndexedRow() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@oci_fetch_array($this->execResult));
	}

	function fetchAssocRow() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@oci_fetch_assoc($this->execResult));
	}
	
	function fetchBoth() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@oci_fetch_both($this->execResult));
	}
	
	function checkForRowReturnError($row) {
		$e = @oci_error(); 
		if($e === null) return $row;
		$this->sqlstate = $e['code'];
		if($this->sqlstate==null) return $row;
		if($this->sqlstate=='00000') return $row;
		$this->sqlerror = $e['message'];
		$this->statementSucceed = false;
		return $row;
	}
	
	function fetchNRowsScrollable($rows, $starting = 0, $verbose = FALSE) {
		$resultSet = fetchNRows($rows,$starting, $verbose);
		return $resultSet;
	}
	function fetchNRows($rows, $starting = 1, $verbose = FALSE) {
		$resultSetIndex = $starting + 1; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		$this->rowsRead = $starting;
		
		if(!$this->statementSucceed) return $resultSet;
		while ($row = $this->checkForRowReturnError(@oci_fetch_array($this->execResult, $resultSetIndex))) {
			if(!$this->statementSucceed) return $resultSet;
			$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
			$this->rowsRead++;
			$resultSetIndex++; // Increment our row pointer
			if ($resultSetIndex > $maxRow) {break;} // Stop if we have retrieved enough rows.
		}
		return $resultSet;
	}
	
	public static function getNumberOfParametersToBind($query, $db2conn) {
		$result = 0;
		$quot = 0;
		$altquery = str_replace("'", "\"", $query);
		for ($i = 0; $i <strlen($altquery); $i++){
			if (substr($altquery, $i, 1) == "\""){//Find quotations
				if ($quot == 0) $quot = 1; 	//Found one... so start looking for closing quotation
				else $quot = 0;				//Closing quotation
			}
			else if (substr($altquery, $i, 1) == "\\"){//Meant to find escaped quotations
				if (substr($altquery, $i, 2) !== false){
					if (substr($altquery, $i, 2) == "\\\""){
						$i++; //skip over the escaped quotation
					}
				}
				else break;
			} else if (substr($altquery, $i, 1) == "?"){
				if ($quot == 0){//Not captured by quotes
					if (substr($altquery, $i, 3) !== false){
						if (substr($altquery, $i, 3) == "?!?"){
							$result ++;
							$i += 2; //found a ?!?, skip over it.
						}
						else $result++;
					} else $result ++;
				}
			}
		}
		return $return;
	}
	
	public function executeStmtWithParameters($bindParameters) {
	    if(!$this->statementSucceed) return;
/*
		$startTime = microtime(true);
		$this->sqlerror = 'To be done - executeStmtWithParameters';
		$this->sqlstate = '99999';		
		$this->statementSucceed = false;
		$this->elapsedTime = microtime(true) - $startTime; 
*/		
		
		if($bindParameters == null) {
			$paramsToBind = $this->getNumberOfParametersToBind($this->stmt, $this->dbconn );
			if($paramsToBind == 0) {
				$this->statementSucceed = false;
				$this->sqlerror = "No parameters were passed to be bound";
				$this->sqlstate = "";
				return;
			}
			$bindParameters = array();
			for($i = 1; $i <= $paramsToBind; $i++)
				$bindParameters[$i]['name'] = "parameter" . $i;
		}
		$parameterNames=array();
		$setType=array();		
		$conversion=array();		
		foreach($bindParameters as $parameterNumber=>$parameteOptions) {
			$name = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$parameterNumber}") : "p{$parameterNumber}";
			$parameterNames[]=$name;
			$value = isset($parameteOptions['value']) ? $parameteOptions['value'] : null;
			$dataType = isset($parameteOptions['dataType']) ? $parameteOptions['dataType'] : "string";
//??			$type = isset($parameteOptions['type']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['type']) ? $parameteOptions['type'] : 'DB2_PARAM_OUT') : 'DB2_PARAM_OUT';
			$ORACLEdataType = isset($parameteOptions['ORACLEdataType']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['ORACLEdataType']) ? $parameteOptions['ORACLEdataType'] : null) : null;
			$precision = isset($parameteOptions['precision']) ? (preg_match('/^[0-9_]+$/' , $parameteOptions['precision']) ? $parameteOptions['precision'] : -1) : -1;
			$scale = isset($parameteOptions['scale']) ? (preg_match('/^[0-9_]+$/' , $parameteOptions['scale']) ? $parameteOptions['scale'] : null) : null;

			if(isset($parameteOptions['conversion']))
				$conversion[$name] = $parameteOptions['conversion'];
			if(isset($parameteOptions['settype'])) {
				$setType[$name] = strtolower($parameteOptions['settype']);
				switch ($setType[$name]) {
					case 'boolean':
					case 'integer':
				 	case 'float':
					case 'string':
					case 'array':
					case 'object':
					case 'null':
						settype($$name,$setType[$name]);
						break;
					default:
						$this->sqlerror = 'Invalid settype for parameter '.$parameterNumber.' name: '.$name.' settype: '.$setType[$name];
						$this->sqlstate = '99999';
						$this->statementSucceed=false;
						return;
				}
			}
/*
SQLT_BFILEE or OCI_B_BFILE - for BFILEs;
SQLT_CFILEE or OCI_B_CFILEE - for CFILEs;
SQLT_CLOB or OCI_B_CLOB - for CLOBs;
SQLT_BLOB or OCI_B_BLOB - for BLOBs;
SQLT_RDD or OCI_B_ROWID - for ROWIDs;
SQLT_NTY or OCI_B_NTY - for named datatypes;
SQLT_BIN or OCI_B_BIN - for RAW columns;
SQLT_LBI - for LONG RAW columns;
SQLT_RSET - for cursors created with oci_new_cursor(). 
*/		


			switch (strtolower($dataType)) {
				case 'smallint' :
					if($precision==-1) $precision=5;
				case 'int' :
				case 'integer' :
					if($precision==-1) $precision=10;
				    $$name = ($value==null?null:intval(str_replace(",","",$value)));
					$ORACLEdataType = SQLT_INT;
					break;
//				case 'real' :
//				case 'float' :
//				case 'double' :
//				    $$name = ($value==null?null:doubleval(str_replace(",","",$value)));
//					$ORACLEdataType = ???;
//					break;
				case 'bigint' :
				case 'long' :
					if($precision==-1) $precision=15;
					$$name = ($value==null?null:intval(str_replace(",","",$value)));
					$ORACLEdataType = SQLT_LNG;
					break;
				case "null":
					$$name = null;
					$ORACLEdataType = SQLT_CHR;
					break;
				case "string":
					$$name = ($value==null?null:rawurldecode($value));
					$ORACLEdataType = SQLT_CHR;
					break;
				default:
					$this->sqlerror = 'Invalid data type for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' DB2 data type: '.$DB2dataType.' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' conversion: '.(isset($conversion[$name])?$conversion[$name]:'');
					$this->sqlstate = '99999';
					$this->statementSucceed=false;
					return;
			}
			if (!@oci_bind_by_name($this->execResult, ':'.$name , $ORACLEdataType ,($precision==null?-1:$precision),($scale==null?0:$scale))) {
			    $e = @oci_error($resource); 
				$this->sqlerror = 'Bind failed for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' Oracle data type: '.$ORACLEdataType.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' value: '.$$name.' message: '.($e===null?"":$e['message']);
				$this->sqlstate = '99999';
				$this->statementSucceed=false;
				return;
			}
		}
				
		$startTime = microtime(true);		
		$this->result = @oci_execute($this->execResult);
		$this->executionTime = microtime(true) - $startTime;
		if(self::isError($this->result))
			return;

		foreach($parameterNames as $name) {
			if(isset($setType[$name]))
				settype($$name, $setType[$name]);
			if(isset($conversion[$name])) 
				switch ($conversion[$name]) {
					case 'bin2hex' :
						$this->parameters[$name] = bin2hex($$name);
						break;
					case 'hex2bin' :
						$this->parameters[$name] = hex2bin($$name);
						break;
					case 'hex2string' :
						$outString = '';
						for ($i=0; $i < strlen($$name)-1; $i+=2) 
							$outString .= chr(hexdec(substr($$name,$i,2)));
						$this->parameters[$name] = htmlspecialchars(@iconv('UTF-8', 'UTF-8//IGNORE', $outString),  ENT_QUOTES, "UTF-8");
						break;
					default:
						$this->sqlerror = 'Unknown conversion '.$conversion[$name];
						$this->sqlstate = '99999';
						$this->statementSucceed=false;
						return;
				}
			else 
				$this->parameters[$name] = htmlspecialchars( $$name ,  ENT_QUOTES, "UTF-8");
		}
	}
	
	public function getRowsInResultSet($OverRideGetRowCount = false) {
		if(!$this->getRowCount || $OverRideGetRowCount) return array("rowsFound" => $this->rowsRead, "endFound" =>false);
		
		if($this->totalRowsInResultSet >= $this->rowsRead) {
			return array("rowsFound" => $this->totalRowsInResultSet, true);
		} else {
			$maxRow = $this->rowsRead + SQL_MAX_ROW_LOOK_AHEAD;
			while ($this->statementSucceed && $row = $this->checkForRowReturnError(@oci_fetch_array($this->execResult))) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) {break;} // Stop if we have retrieved enough rows.
			}
			$this->rowsRead--;
			return array("rowsFound" => $this->rowsRead, "endFound" => ( $this->statementSucceed ? ($row == null ? true : false) : true ));
		}
	}
}
