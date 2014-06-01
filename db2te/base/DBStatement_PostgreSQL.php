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

 * This class is a general manager for prepare and execute SQL statements
 * as well as simple executed SQL statements.
 * An executed state runs immediately as part of the object constructor
 * A prepared statement is initialized as part of the constructor but
 * is not executed until parameters are passed in as part of an
 * explicit execute function
 *
*/

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement.php');

/** This class is a general manager for prepare and execute SQL statements
 * as well as simple executed SQL statements.
 * An executed state runs immediately as part of the object constructor
 * A prepared statement is initialized as part of the constructor but
 * is not executed until parameters are passed in as part of an
 * explicit execute function */
class Statement_PostgreSQL extends Statement {

/** Requires a SQL statement as well as a database connection.
  * You can also choose a two set prepare and execute or a simple execute
  * The default is a simple execute immediate. */
  
  function __construct($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE, $dbconn = null) {
		$this->otherResult = array();
		$this->statementSucceed=true;
		if($dbconn == null)
			$this->dbconn = connectionManager::getConnection()->dbconn;
		else if(is_subclass_of($dbconn, 'Connection')) 
			$this->dbconn = $dbconn->dbconn;	
		else if(is_resource($dbconn))
			$this->dbconn = $dbconn;
		else 
			$this->dbconn = null;
		
		$this->rows = -1;
		$this->stmt = $stmt_text;

		$this->getRowCount = $getRowCount;
		$this->elapsedTime = 0;
		$this->resultSet = 0;
		
		if ($this->dbconn === false) 
			return;

		// Check that the connection is valid
		// db2_exec returns 0 if the statement fails;
		// otherwise it returns a result set ID
		$startTime = microtime(true); // Record the start time

		if ($prepare_statment) { // If prepare was requested
			$this->type = "Prepare";
			$this->execResult = @pg_prepare($this->dbconn, $this->stmt);//,  $options);
		} else { // If execute was requested (default)
			$this->type = "Execute";
			$this->execResult = @pg_query($this->dbconn, $this->stmt);//, array('cursor' => DB2_SCROLLABLE));
			$this->baseResult = $this->execResult;
		}

		$this->elapsedTime = microtime(true) - $startTime; // record end time
		if ($this->execResult == false || $this->execResult == null) { // If result was good, display success if verbose
			$error = error_get_last($this->dbconn);
			$this->statementSucceed = false;
			$this->sqlerror = $error['message'];
			$this->sqlstate = -1;
			return;
		}	
		if($this->sqlerror == null && $this->sqlstate == 0)
			$this->totalRowsInResultSet = @pg_num_rows($this->execResult);
	}
	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		$this->statementSucceed=true;
		$execResult = false;
		$startTime = microtime(true);
		if ($parameters != null) {
			$execResult = @pg_execute($this->dbconn, $this->execResult, $parameters); // Record execution result
			$this->baseResult = $this->execResult;
		} else {
			$execResult = @pg_execute($this->dbconn, $this->execResult, $parameters); //Calling with no parameters.
			//pg_execute function requires an array of parameters
			$this->baseResult = $this->execResult;
		}
		$this->elapsedTime = microtime(true) - $startTime; // record end time

		return $this->sqlstate;
	}
	
	/** Returns whether a statement was successfully prepared
  * @return boolean */
	function prepSuccessful() { // Query if prepare was successful
		if(!$this->statementSucceed) return false;
		return ($this->execResult !== false);
	}

/** Returns whether a statement was successfully executed
  * @return boolean */
	function execSuccessful() { // Query if execute was successful
		if(!$this->statementSucceed) return false;
		return ($this->execResult !== false);
	}

/** Returns the SQLSTATE of the Statement object
  * Multiple calls to this
  * only returns the last state. Multiple calls to
  * db2_stmt_error will pull all previous states
  * for the statement in reverse order of execution
  * @return integer */
	function state() { // Query the SQL State
		return $this->sqlstate;
	}
	
	/** Returns the DB2 Error message
  * Multiple calls to this
  * only returns the last error. Multiple calls to
  * db2_stmt_errormsg will pull all previous error messages
  * for the statement in reverse order of execution
  * @return string */
	function errorMsg() { // Query the SQL Error Message
		return $this->sqlerror;
	}
	
	/** Retrieves the next result set returned
	* sets $stmt to false when there are no more result sets
	* @return array */
	function nextResultSet() {
		if (empty($this->otherResult))
			return false;
		
		$this->otherResult_counter += 1;
		if ($this->otherResult_counter >= count($this->otherResult))
			return false;

		$this->execResult = $this->otherResult[$this->otherResult_counter];
			
		$this->rowsRead = 0;
		$this->totalRowsInResultSet = -1;
		if($this->execResult !== false)
			if($this->sqlerror == null && $this->sqlstate == 0)
				$this->totalRowsInResultSet = @pg_num_rows($this->execResult);
		return $this->execResult;
	}
	
	function getColumnInfo(){
		if($this->execResult == false || $this->execResult == null) {
			$this->sqlerror = 'No column information'.pg_last_error($this->dbconn);
			$this->sqlstate = '99999';
			$this->statementSucceed=false;
			return;
		}
		$columnInfo = array();
		$columnInfo['num'] = @pg_num_fields($this->execResult);
		if(!$this->statementSucceed) return;
		$columnInfo['name'] = array();
		$columnInfo['precision'] = array();
		$columnInfo['scale'] = array();
		$columnInfo['type'] = array();
		$columnInfo['width'] = array();
		$columnInfo['displaySize'] = array();
		for($i = 0; $i < $columnInfo['num']; $i++) {
			$columnInfo['name'][] = @pg_field_name($this->execResult, $i);
			$columnInfo['precision'][] = -1;
			$columnInfo['scale'][] = -1;
			$columnInfo['type'][] = @strtolower(@pg_field_type($this->execResult, $i));
			$columnInfo['width'][] = -1;
			$columnInfo['displaySize'][] = -1;
		}
		return $columnInfo;
	}
	
	/** Retrieve a single row. Each array element will be identified
	* by the column name
	* @return array */
	function fetch() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@pg_fetch_array($this->execResult));
	}

	/** Retrieve a single row. Each array element will be identified
	* by an sequential index number starting at 0
	* @return array */
	function fetchIndexedRow() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@pg_fetch_array($this->execResult));
	}
	
	/** Retrieve a single row. Each array element will be identified
	* by the coloumn name or as given in the statment
	* @return array */
	function fetchAssocRow() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@pg_fetch_assoc($this->execResult));
	}
	
	/** Retrieve a single row. Each array element will be identified
	* by the coloumn name and by column index.
	* @return array */	
	function fetchBoth() {
		$this->rowsRead++;
		return $this->checkForRowReturnError(@pg_fetch_assoc($this->execResult));
	}
	
	function checkForRowReturnError($row) {
		return $row;
	}
	
	/** Retrieve a a specified number of rows. Each array element will be identified
	* by an sequential index number starting at 0.
	* $rows specifies the number of rows to retrieve.
	* Returns an array of rows.
	* $starting specifies the starting row, initially indexes at 0
	* @return array */
	function fetchNRowsScrollable($rows, $starting = 0, $verbose = FALSE) {
		$resultSetIndex = $starting + 1; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		$this->rowsRead = $starting;
		
		if(!$this->statementSucceed) return $resultSet;
		while ($row = $this->checkForRowReturnError(@pg_fetch_array($this->execResult, $resultSetIndex))) {
			if(!$this->statementSucceed) return $resultSet;
			$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
			$this->rowsRead++;
			$resultSetIndex++; // Increment our row pointer
			if ($resultSetIndex > $maxRow) {break;} // Stop if we have retrieved enough rows.
		}
		return $resultSet;
	}
	
	function fetchNRows($rows, $starting = 1, $verbose = FALSE) {
		$resultSet = array();
		$resultSetIndex = $starting; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		//if($this->checkForError(db2_cursor_type($this->execResult)) == DB2_SCROLLABLE ) {
		if(false) {	//SCROLLABLE unsupported
			if(!$this->statementSucceed) return null;
			$starting = $starting == 0 ? 1 : $starting;
			for($resultSetIndex=$starting; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				$row = @pg_fetch_array($this->execResult, $resultSetIndex);
				if (!$this->statementSucceed || $row === false) break;
				
				$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
				$this->rowsRead++;
			}
		} else {
			// Fast forward to the starting row
			if(!$this->statementSucceed) return null;
			for ($resultSetIndex = 1; $resultSetIndex <= $starting; $resultSetIndex++) {
				if (@pg_fetch_array($this->execResult) === false) return null;
				if(!$this->statementSucceed) return null;
				$this->rowsRead++;
			}

			// Build an array of rows for the number of rows requested$maxRow
			for ( $resultSetIndex; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				$row = @pg_fetch_array($this->execResult);
				if (!$this->statementSucceed || $row === false) break;
				$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
				$this->rowsRead++;
			}
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
				else{break;}
			}
			else if (substr($altquery, $i, 1) == "?"){
				if ($quot == 0){//Not captured by quotes
					if (substr($altquery, $i, 3) !== false){
						if (substr($altquery, $i, 3) == "?!?"){
							$result ++;
							$i += 2; //found a ?!?, skip over it.
						}
						else $result++;
					}
					else{//Smaller than ?!?, so it must be a single ? which counts.
						$result ++;
					}
				}
			}
		}
		return $return;
	}
	
	public function executeStmtWithParameters($bindParameters) {
		$storageCode = ""; 
		$uid = uniqid();
		
		$prepareCode = "function TempStatmentToRun$uid(\$ReturnObject, \$bindParameters) {\n";
		$prepareCode .= "if (@pg_prepare(\$ReturnObject->dbconn, 'a', \$ReturnObject->stmt)){\n";
		
		if($bindParameters == null) {
			$paramsToBind = $this->getNumberOfParametersToBind($this->stmt, $this->dbconn);
			if($paramsToBind <= 0) {
				$this->statementSucceed = false;
				$this->sqlerror = "No parameters were passed to be bound";
				$this->sqlstate = "";
				return;
			}
			$bindParameters = array();
			for($i = 1; $i <= $paramsToBind; $i++)
				$bindParameters[$i]['name'] = "parameter" . $i;
		}
		
		$prepareCode_datatype = "";
		$prepareCode_values = "";
		foreach($bindParameters as $parameterNumber=>$parameteOptions) {
			$name = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$parameterNumber}") : "p{$parameterNumber}";
			$value = isset($parameteOptions['value']) ? "'" . rawurlencode($parameteOptions['value']) ."'" : "''";
			$dataType = isset($parameteOptions['dataType']) ? strtolower($parameteOptions['dataType'] ): "string";
			$type = isset($parameteOptions['type']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['type']) ? $parameteOptions['type'] : 'DB2_PARAM_OUT') : 'DB2_PARAM_OUT';

			switch($dataType) {
				//case "null":
				//	$prepareCode_datatype .= "s";
				//	break;
				case "int";
				    $prepareCode_datatype .= "i";
					break;
				case "double";
				    $prepareCode_datatype .= "d";
					break;
				case 'float':
				    $prepareCode_datatype .= "d";
					break;
				case "blob";
				    $prepareCode_datatype .= "b";
					break;
				default:
					$prepareCode_datatype .= "s";
			}
			$prepareCode_values .= ", " . $value;
		}
		
		//$prepareCode .= "@mysqli_stmt_bind_param(\$tmpstmt,$prepareCode_datatype,$prepareCode_values);\n";
		$prepareCode .= "\$startTime = microtime(true);\n";		

		
		$prepareCode .= "if(@pg_execute(\$tmpstmt))\n"; 
		$prepareCode .= "{";
		$prepareCode .= "\$ReturnObject->statementSucceed = true;\n";
		$prepareCode .= "\$ReturnObject->baseResult = \$ReturnObject->execResult;\n";
		$prepareCode .= "\$ReturnObject->executionTime = microtime(true) - \$startTime;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = @pg_result_error(\$tmpstmt);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = @pg_result_errror_field(\$tmpstmt, PGSQL_DIAG_SQLSTATE);\n";
		$prepareCode .= "return;";
		$prepareCode .= "} else {";
		$prepareCode .= "\$ReturnObject->statementSucceed = false;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = @pg_result_error(\$tmpstmt);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = @pg_result_errror_field(\$tmpstmt, PGSQL_DIAG_SQLSTATE);\n";
		$prepareCode .= "return;";
		$prepareCode .= "}\n";
		$prepareCode .= "}\n";
		
		//Couldn't even prepare the code!
		$prepareCode .= "\$ReturnObject->statementSucceed = false;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = @pg_result_error(\$tmpstmt);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = @pg_result_errror_field(\$tmpstmt, PGSQL_DIAG_SQLSTATE);\n";
		$prepareCode .= "return;";
		$prepareCode .= "}\n";
		$prepareCode .= "";
		$prepareCode .= "TempStatmentToRun$uid(\$this, \$bindParameters);\n";
		
    	eval($prepareCode);
	}
	
	public function getRowsInResultSet($OverRideGetRowCount = false) {
		if(!$this->getRowCount || $OverRideGetRowCount) return array("rowsFound" => $this->rowsRead, "endFound" =>false);
		
		if($this->totalRowsInResultSet >= $this->rowsRead) {
			return array("rowsFound" => $this->totalRowsInResultSet, true);
		} else {
			$maxRow = $this->rowsRead + SQL_MAX_ROW_LOOK_AHEAD;
			while ($this->statementSucceed && $row = $this->checkForRowReturnError(@pg_fetch_array($this->execResult))) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) {break;} // Stop if we have retrieved enough rows.
			}
			$this->rowsRead--;
			return array("rowsFound" => $this->rowsRead, "endFound" => ( $this->statementSucceed ? ($row == null ? true : false) : true ));
		}
	}
}
