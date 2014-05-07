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
 * An executed state runs immedately as part of the object constructor
 * A prepared statement is initalized as part of the constructor but
 * is not executed until parameters are passed in as part of an
 * explict execute function
 *
*/

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement.php');

/** This class is a general manager for prepare and execute SQL statements
 * as well as simple executed SQL statements.
 * An executed state runs immedately as part of the object constructor
 * A prepared statement is initalized as part of the constructor but
 * is not executed until parameters are passed in as part of an
 * explict execute function */
class Statement_MYSQL extends Statement {

/** Requires a SQL statement as well as a database connection.
  * You can also choose a two set prepare and execute or a simple execute
  * The default is a simple execute immediate. */
	function __construct($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE, $dbconn = null) {
		
		$this->otherResult = array();
		$this->otherResult_counter = -1;
		if($dbconn == null)
		{
			$this->dbconn = connectionManager::getConnection()->dbconn;
		}
		else if(is_subclass_of($dbconn, 'Connection')) 
		{
			$this->dbconn = $dbconn->dbconn;	
		}
		else if(is_resource($dbconn))
		{
			$this->dbconn = $dbconn;
		}
		else 
		{
			$this->dbconn = null;
		}
		
		$this->rows = -1;

		$this->stmt = $stmt_text;
		
		$this->getRowCount = $getRowCount;
    
		$this->elapsedTime = 0;
		
		//$options = array('cursor' => DB2_FORWARD_ONLY);
		
		//if($getRowCount) $options['rowcount'] = DB2_ROWCOUNT_PREFETCH_ON;

		//if(!$ForwardOnlyScroll) $options['cursor'] = DB2_SCROLLABLE;
		
		if ($this->dbconn !== false) 
		{  // Check that the connection is valid
			// db2_exec returns 0 if the statement fails;
			// otherwise it returns a result set ID
			$startTime = microtime(true); // Record the start time

			if ($prepare_statment) // If prepare was requested
			{ 
				$this->type = "Prepare";
				$this->execResult = @mysqli_prepare($this->dbconn, $this->stmt);
//				print_r($this->execResult->fetch_row());
			}
			else // If execute was requested (default)
			{ 
				$this->type = "Execute";
				/*if(mysqli_multi_query($this->dbconn,$this->stmt)){
					do {
						$this->execResult = new mysqli_result($this->dbconn);
						//if ($result = mysqli_store_result($this->dbconn)) {
						//	array_push ($this->otherResult, $result);
						//	mysqli_free_result($result);
						//}
					} while (mysqli_next_result($this->dbconn));
					$this->otherResult_counter = 0;
					//$this->execResult = $this->otherResult[$this->otherResult_counter];
					//print_r($this->otherResult_counter);
					//print_r($this->otherResult);
					//print_r($this->execResult);
					//print_r(mysqli_fetch_assoc($this->execResult));
				
				}*/
				
				//else{
					$this->execResult = $this->dbconn->real_query($this->stmt);
					$this->execResult = mysqli_store_result($this->dbconn);//new mysqli_result($this->dbconn);

				//}
				$this->baseResult = $this->execResult;
			}

			$this->elapsedTime = microtime(true) - $startTime; // record end time
			
			if ($this->execResult !== false) // If result was good, display success if verbose
			{ 
				$this->statementSucceed = true;
				$this->sqlerror = mysqli_error($this->dbconn);
				$this->sqlstate = mysqli_errno($this->dbconn);
				
				if($this->sqlerror == null && $this->sqlstate == 0)
					$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);

			}
			else if(mysqli_errno($this->dbconn) == 0)
			{
				$this->statementSucceed = true;
				$this->sqlstate = mysqli_info($this->dbconn);
				$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);
				
			}
			else // otherwise display error message
			{ 
				$this->statementSucceed = false;
				$this->sqlerror = mysqli_error($this->dbconn);
				$this->sqlstate = mysqli_errno($this->dbconn);
				$this->sqlerror = $this->sqlerror == null ? "Database returned no error" . $this->sqlerror : $this->sqlerror;
				$this->sqlstate = $this->sqlstate == 0 ? "?????" . $this->sqlstate : $this->sqlstate;
			}
		}
	}


/** Executes a prepared statement.
  * Requires an array of parameters
  * @return boolean */

	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		$execResult = false;
		$startTime = microtime(true);
		if ($parameters != null) {
			$stmt = mysqli_stmt_init($this->dbconn);
			if (@mysqli_stmt_prepare($stmt,$this->stmt)){
				$type = "";
				foreach ($parameters as &$value) {
					if (is_bool($value)){ $type .= "s";}
					elseif (is_float($value)){ $type .= "d";}
					elseif (is_int($value)){ $type .= "i";}
					else{ $type .= "s";}
				}
				mysqli_stmt_bind_param($stmt, $type, $parameters);
				$execResult = mysqli_stmt_execute($stmt);
				
				$this->elapsedTime = microtime(true) - $startTime; // record end time
				$this->sqlerror = mysqli_stmt_error($this->dbconn);
				$this->sqlstate = mysqli_stmt_errno($this->dbconn);		
				
				if($execResult)
					if($this->sqlerror == null && $this->sqlstate == 0)
						$this->totalRowsInResultSet = @mysqli_stmt_num_rows($stmt);
				
				$this->baseResult = $this->execResult;
				if ($execResult === false) { // If result was not good display error message
					$this->statementSucceed = false;
					mysqli_stmt_free_result($stmt);
					mysqli_stmt_close($stmt);
					return $this->sqlstate;
				}
				else { // otherwise display success if verbose
					if($this->sqlerror == null && $this->sqlstate == 0)
						$this->totalRowsInResultSet = @mysqli_stmt_num_rows($stmt);
					$this->statementSucceed = true;
					mysqli_stmt_free_result($stmt);
					mysqli_stmt_close($stmt);
					return 0;
				}
				
			}else{//failed to prepare, so just try to query it
				$execResult = @mysqli_query($this->dbconn,$this->stmt); //Calling with no parameters.
			}
			$this->baseResult = $this->execResult;
		} else {
			$execResult = @mysqli_query($this->dbconn,$this->stmt); //Calling with no parameters.
			$this->baseResult = $this->execResult;
		}
		
		$this->elapsedTime = microtime(true) - $startTime; // record end time

		$this->sqlerror = mysqli_error($this->dbconn);
		$this->sqlstate = mysqli_errno($this->dbconn);		
	
		if($execResult)
			if($this->sqlerror == null && $this->sqlstate == 0)
				$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);
		
		if ($execResult === false) { // If result was not good display error message
			$this->statementSucceed = false;
			return $this->sqlstate;
		}
		else { // otherwise display success if verbose
			if($this->sqlerror == null && $this->sqlstate == 0)
				$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);
			$this->statementSucceed = true;
			return 0;
		}
	}

/** Returns whether a statement was successfully prepared
  * @return boolean */
	function prepSuccessful() { // Query if prepare was successful
		if ($this->execResult === false) {
			return FALSE;
		}
		else {return TRUE;}
	}

/** Returns whether a statement was successfully executed
  * @return boolean */
	function execSuccessful() { // Query if execute was successful
		if ($this->execResult === false) {
			return FALSE;
		}
		else {return TRUE;}
	}

/** Returns the SQLSTATE of the Statement object
  * Multiple calls to this
  * only returns the last state. Multiple calls to
  * mysqli_stmt_errno will pull all previous states
  * for the statement in reverse order of execution
  * @return integer */
	function state() { // Query the SQL State
		return $this->sqlstate;
	}

/** Returns the MySQL Error message
  * Multiple calls to this
  * only returns the last error. Multiple calls to
  * mysqli_stmt_error will pull all previous error messages
  * for the statement in reverse order of execution
  * @return string */
	function errorMsg() { // Query the SQL Error Message
		return $this->sqlerror;
	}

/** Retrieves the next result set returned
 * sets $stmt to false when there are no more result sets
  * @return array */
	function nextResultSet() {
		if (empty($this->otherResult)){
		return false;
		}
		
		$this->otherResult_counter += 1;
		if ($this->otherResult_counter >= count($this->otherResult)){
			return false;
		}
		$this->execResult = $this->otherResult[$this->otherResult_counter];
			
		$this->rowsRead = 0;
		$this->totalRowsInResultSet = -1;
		if($this->execResult !== false)
			if($this->sqlerror == null && $this->sqlstate == 0)
				$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);
		return $this->execResult;
	//As far as I can tell and discussing with Matthew,
	//multiple return result sets are not supported.
	//	if (empty($this->otherResult)){ //If empty, means that this is the first call to nextResultSet
	//		$this->execResult = @mysqli_multi_query($this->dbconn,$this->stmt);	
	//		if ($this->execResult !== false) // If result was good, display success if verbose
	//			{ 
	//				$this->statementSucceed = true;
	//				if(is_resource($this->execResult))
	//				{
	//					$this->sqlerror = mysqli_error($this->dbconn);
	//					$this->sqlstate = mysqli_errno($this->dbconn);
	//				}
	//				else 
	//				{
	//					$this->sqlerror = mysqli_error($this->dbconn);
	//					$this->sqlstate = mysqli_errno($this->dbconn);
	//				}
	//				if($this->sqlerror == null && $this->sqlstate == 0)
	//					$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);
	//			}
	//			else // otherwise display error message
	//			{ 
	//				$this->statementSucceed = false;
	//				$this->sqlerror = mysqli_error($this->dbconn);
	//				$this->sqlstate = mysqli_errno($this->dbconn);
	//				$this->sqlerror = $this->sqlerror == null ? "Database returned no error" : $this->sqlerror;
	//				$this->sqlstate = $this->sqlstate == 0 ? "?????" : $this->sqlstate;
	//				return $this->execResult;
	//			}
	//		
	//		do {
	//			/* store result sets */
	//			if ($result = mysqli_store_result($dbconn)) {
	//				array_push ($this->otherResult, $result);
	//				unset($result);
	//			}
	//		} while (mysqli_next_result($link));
	//	}
	//	//otherResult[] has been filled, proceed to iterate until match, when there is a match, return the next result set.
	//	$result = false;
	//	foreach ($this->otherResult as &$value) {
	//		$found = false;
	//		if ($found === true)
	//			break 1;
	//		if ($value === $this->execResult){
	//			$found = true;
	//		}
	//	}
	//	$this->execResult = $result;
	//	unset($found);
	//	unset($result);
	//	unset($value);
	//	
	//	$this->rowsRead = 0;
	//	$this->totalRowsInResultSet = -1;
	//	if($this->execResult !== false)
	//		if($this->sqlerror == null && $this->sqlstate == 0)
	//			$this->totalRowsInResultSet = @mysqli_num_rows($this->execResult);
	//	return $this->execResult;
	}
	
/** Retrieves the field information for the columns information
 * sets $stmt to false when there are no more result sets
  * @return array */
	function getColumnInfo() {
		if($this->execResult !== false || $this->execResult !== null)
		{
			$columnInfo = array();
			$columnInfo['num'] = mysqli_field_count($this->dbconn);
			$columnInfo['name'] = array();
			$columnInfo['precision'] = array();
			$columnInfo['scale'] = array();
			$columnInfo['type'] = array();
			$columnInfo['width'] = array();
			$columnInfo['displaySize'] = array();
						
			//$lengths = mysqli_fetch_lengths($result);

			//$row = mysqli_fetch_row($this->execResult);
			//$this->execResult->fetch_row(); //Losing the Top Row ----- ----------------
			for($i = 0; $i < $columnInfo['num']; $i++)
			{
				$meta = mysqli_fetch_field_direct($this->execResult, $i);
				$columnInfo['name'][] = $meta->name;
				$columnInfo['precision'][] = $meta->decimals;
				$columnInfo['scale'][] = null;// Unsupported
				$type = $meta->type; //return a number (ie: String = "4")
				//echo "$type \n";
				if ($type == 1 || $type == 2 || $type == 3 || $type == 8){
					$columnInfo['type'][] = "int";
				}
				else{
					$columnInfo['type'][] = "string";
				}
					/*if(is_bool($row[$i]))
						$columnInfo['type'][] = "boolean";
					elseif(is_integer($row[$i]))
						$columnInfo['type'][] = "int";
					elseif(is_float($row[$i]))
						$columnInfo['type'][] = "float";
					elseif(is_string($row[$i]))
						$columnInfo['type'][] = "string";
					elseif(is_array($row[$i]))
						$columnInfo['type'][] = "array";
					elseif(is_null($row[$i]))
						$columnInfo['type'][] = "NULL";
					else
						$columnInfo['type'][] = "unknown type";		
						*/
				$columnInfo['width'][] = $meta->max_length;
				$columnInfo['displaySize'][] = $meta->length;
			}
			unset($meta);
			return $columnInfo;
		}
		return null;
	}	
	
/** Retrieve a single row. Each array element will be identified
  * by the column name
  * @return array */
	function fetch() {
		if($this->execResult===null or !$this->execResult) {
			$this->statementSucceed = false;
			$this->sqlerror = "Result set link is null or false";
			$this->sqlstate = "?????";
			return;
		} 
		return $this->checkForRowReturnError($this->execResult->fetch_row());
	}

/** Retrieve a single row. Each array element will be identified
  * by an sequential index number starting at 0
  * @return array */
	function fetchIndexedRow() {
		$this->rowsRead++;
		return $this->checkForRowReturnError($this->execResult->fetch_array());
	}

/** Retrieve a single row. Each array element will be identified
  * by the coloumn name or as given in the statment
  * @return array */
	function fetchAssocRow() {
		$this->rowsRead++;
		return $this->checkForRowReturnError($this->execResult->fetch_assoc());
	}
	
/** Retrieve a single row. Each array element will be identified
  * by the coloumn name and by column index.
  * @return array */	
	function fetchBoth() {
		$this->rowsRead++;
		return $this->checkForRowReturnError($this->execResult->fetch_assoc());
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
		/*$resultSetIndex = $starting + 1; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		$this->rowsRead = $starting;
		
		for ($resultSetIndex = 1; $resultSetIndex <= $starting; $resultSetIndex++) {
				if (mysqli_fetch_row($this->execResult) === false) {return null;}
				$this->rowsRead++;
			}
		
		while ($row = @mysqli_fetch_row($this->execResult, $resultSetIndex)) {
			$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
			$this->rowsRead++;
			$resultSetIndex++; // Increment our row pointer
			if ($resultSetIndex > $maxRow) {break;} // Stop if we have retrieved enough rows.
		}
		*/
		$resultSet = fetchNRows($rows,$starting, $verbose);
		return $resultSet;
	}

/** Retrieve a a specified number of rows. Each array element will be identified
 * by an sequential index number starting at 0.
 * $rows specifies the number of rows to retrieve.
 * $starting specifies the starting row, initially indexes at 0.
 * Returns an array of rows.
 * @return array */
	function fetchNRows($rows, $starting = 1, $verbose = FALSE) {
		$MaxForwardScrollLookAHead = ($rows * 5) + 5;
		$resultSet = array();
		$resultSetIndex = $starting; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		if(false)//Scrollable is unsupported for now.             db2_cursor_type($this->execResult) == DB2_SCROLLABLE )
		{
			//$starting = $starting == 0 ? 1 : $starting;
			//for($resultSetIndex=$starting; $resultSetIndex <= $maxRow; $resultSetIndex++)
			//{
			//	$row = @mysqli_fetch_row($this->execResult, $resultSetIndex);
			//	if ($row === false) {break;}
			//	$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
			//	$this->rowsRead++;
			//}
		}
		else
		{
			// Fast forward to the starting row

			for ($resultSetIndex = 1; $resultSetIndex <= $starting; $resultSetIndex++) {
				if ($this->execResult->fetch_array() === false) {return null;}
				$this->rowsRead++;
			}

			// Build an array of rows for the number of rows requested$maxRow
			for ( $resultSetIndex; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				$row = $this->execResult->fetch_array();
				if ($row === false) {break;}
				$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
				$this->rowsRead++;
			}
		}

		return $resultSet;
	}
	
	/** Retrieve the number of parameters which can be bound to the given SQL
 * $query the SQL to check
 * $db2conn the database connection 
 * Returns the number of bindable parameters
 * @return array */
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
					//else if (substr($altquery, $i, 2) == "\\\\"){
					//	$i++; //skip over a dual backspaced symbol...
					//}
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
	
	public function executeStmtWithParameters($bindParameters)
	{
		
		$storageCode = ""; 
		$uid = uniqid();
		
		$prepareCode = "function TempStatmentToRun$uid(\$ReturnObject, \$bindParameters) {\n";
		$prepareCode .= "\$tmpStmt = @mysqli_stmt_init(\$ReturnObject->dbconn);";
		$prepareCode .= "if (@mysqli_prepare(\$tmpStmt, \$ReturnObject->stmt)){\n";
		
		if($bindParameters == null)
		{
			$paramsToBind = $this->getNumberOfParametersToBind($this->stmt, $this->dbconn);
			if($paramsToBind <= 0)
			{
				$this->statementSucceed = false;
				$this->sqlerror = "No parameters were passed to be bound";
				$this->sqlstate = "";
				return;
			}
			$bindParameters = array();
			for($i = 1; $i <= $paramsToBind; $i++)
			{
				$bindParameters[$i]['name'] = "parameter" . $i;
			}
		}
		
		$prepareCode_datatype = "";
		$prepareCode_values = "";
		foreach($bindParameters as $parameterNumber=>$parameteOptions)
		{
			$name = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$parameterNumber}") : "p{$parameterNumber}";
			$value = isset($parameteOptions['value']) ? "'" . rawurlencode($parameteOptions['value']) ."'" : "''";
			$dataType = isset($parameteOptions['dataType']) ? strtolower($parameteOptions['dataType'] ): "string";
			$type = isset($parameteOptions['type']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['type']) ? $parameteOptions['type'] : 'DB2_PARAM_OUT') : 'DB2_PARAM_OUT';
			//$DB2dataType = isset($parameteOptions['DB2dataType']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['DB2dataType']) ? $parameteOptions['DB2dataType'] : null) : null;
			//$precision = isset($parameteOptions['precision']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['precision']) ? $parameteOptions['precision'] : null) : null;
			//$scale = isset($parameteOptions['scale']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['scale']) ? $parameteOptions['scale'] : null) : null;

			//$prepareCode .= "\$$name = ";
			switch($dataType)
			{
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
			//$prepareCode .= "@db2_bind_param(\$ReturnObject->execResult, $parameterNumber, \"{$name}\"";
			
			/*if($type != null)
			{
				$prepareCode .= ", " . $type;
				if($DB2dataType != null)
				{
					$prepareCode .= ", " . $DB2dataType;
					if($precision != null)
					{
						$prepareCode .= ", " . $precision;
						if($scale != null)
						{
							$prepareCode .= ", " . $scale;
						}
					}
				}
			}*/
		}
		$prepareCode .= "@mysqli_stmt_bind_param(\$tmpstmt,$prepareCode_datatype,$prepareCode_values);\n";
		//$storageCode .= "\$ReturnObject->parameters['{$name}'] = htmlspecialchars(\${$name},  ENT_QUOTES, \"UTF-8\");\n";
		$prepareCode .= "\$startTime = microtime(true);\n";		

		
		$prepareCode .= "if(@mysqli_stmt_execute(\$tmpstmt))\n"; //db2_execute(\$ReturnObject->execResult))\n";
		$prepareCode .= "{";
		$prepareCode .= "\$ReturnObject->statementSucceed = true;\n";
		$prepareCode .= "\$ReturnObject->baseResult = \$ReturnObject->execResult;\n";
		$prepareCode .= "\$ReturnObject->executionTime = microtime(true) - \$startTime;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = mysqli_stmt_error(\$tmpstmt);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = mysqli_stmt_errno(\$tmpstmt);\n";
		$prepareCode .= "return;";
		$prepareCode .= "} else {";
		$prepareCode .= "\$ReturnObject->statementSucceed = false;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = mysqli_stmt_error(\$tmpstmt);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = mysqli_stmt_errno(\$tmpstmt);\n";
		$prepareCode .= "return;";
		$prepareCode .= "}\n";
		//$prepareCode .= $storageCode;
		$prepareCode .= "}\n";
		
		//Couldn't even prepare the code!
		$prepareCode .= "\$ReturnObject->statementSucceed = false;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = mysqli_stmt_error(\$tmpstmt);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = mysqli_stmt_errno(\$tmpstmt);\n";
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
			while ($row = @mysqli_fetch_row($this->execResult)) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) {break;} // Stop if we have retrieved enough rows.
			}
			$this->rowsRead--;
			return array("rowsFound" => $this->rowsRead, "endFound" => ($row == null ? true : false));
		}
	}
}
