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
class Statement_ODBC_SolidDB extends Statement {

/** Requires a SQL statement as well as a database connection.
  * You can also choose a two set prepare and execute or a simple execute
  * The default is a simple execute immediate. */
	function __construct($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE, $dbconn = null) {

		$this->otherResult = array();
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

		if ($this->dbconn !== false) 
		{  // Check that the connection is valid
			// db2_exec returns 0 if the statement fails;
			// otherwise it returns a result set ID
			$startTime = microtime(true); // Record the start time

			//solid cannot drop the current schema so set schema to DEFAULT_DATABASE_SCHEMA before continuing
			if( stristr($this->stmt, "DROP SCHEMA") !== false)
			{
				$sql = "SET SCHEMA ".DEFAULT_DATABASE_SCHEMA;
				$this->execResult = @odbc_exec($this->dbconn, $sql);
				$error = odbc_error();
				if($error !== false)
				{
					$this->sqlerror = odbc_errormsg();
					$this->sqlstate = odbc_error();
				}
			}

			if ($prepare_statment) // If prepare was requested
			{ 
				$this->type = "Prepare";
				$this->execResult = odbc_prepare($this->dbconn, $this->stmt);
			}
			else // If execute was requested (default)
			{ 
				$this->type = "Execute";
				$this->execResult = @odbc_exec($this->dbconn, $this->stmt);
				$this->baseResult = $this->execResult;
			}

			$this->elapsedTime = microtime(true) - $startTime; // record end time
		
			if ($this->execResult !== false) // If result was good, display success if verbose
			{ 
				$this->statementSucceed = true;
				if(is_resource($this->execResult))
				{
				//DG - This causes invalid messages to be returned. If stmt succeeds, why set error msgs?
//					$this->sqlerror = odbc_errormsg();
//					$this->sqlstate = odbc_error();
				}
				else 
				{
echo "\n WARNING: Still using db2_stmt functionc() \n";
					$this->sqlerror = db2_stmt_errormsg();
					$this->sqlstate = db2_stmt_error();
				}
/* DG - solid does not return num_rows on SELECT
				if($this->sqlerror == "" && $this->sqlstate == "")
					$this->totalRowsInResultSet = odbc_num_rows($this->execResult);
*/
				$this->totalRowsInResultSet = -1;
			}
			else // otherwise display error message
			{
				$this->statementSucceed = false;
				$this->sqlerror = odbc_errormsg();
				$this->sqlstate = odbc_error();
				$this->sqlerror = $this->sqlerror == "" ? "Database returned no error" : $this->sqlerror;
				$this->sqlstate = $this->sqlstate == "" ? "?????" : $this->sqlstate;
			}
		}
	}


/** Executes a prepared statement.
  * Requires an array of parameters
  * @return boolean */

	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
echo "function execute\n";
		$execResult = false;
		$startTime = microtime(true);
		if ($parameters != null) {
			$execResult = odbc_execute($this->execResult, $parameters); // Record execution result
			$this->baseResult = $this->execResult;
		} else {
			$execResult = odbc_execute($this->execResult); //Calling with no parameters.
			$this->baseResult = $this->execResult;
		}
		$this->elapsedTime = microtime(true) - $startTime; // record end time
		
		$this->sqlerror = odbc_stmt_errormsg($this->execResult); // When executing a prepared statement you must pass in the prep resource Id to correctly retrieve the error message.
		$this->sqlstate = odbc_stmt_error($this->execResult);
	
		if($execResult)
			if($this->sqlerror == "" && $this->sqlstate == "")
				$this->totalRowsInResultSet = odbc_num_rows($this->execResult);
		
		if ($execResult === false) { // If result was not good display error message
			$this->statementSucceed = false;
			return $this->sqlstate;
		}
		else { // otherwise display success if verbose
			if($this->sqlerror == "" && $this->sqlstate == "")
				$this->totalRowsInResultSet = odbc_num_rows($this->execResult);
			$this->statementSucceed = true;
			return 0;
		}
	}

/** Returns whether a statement was successfully prepared
  * @return boolean */
	function prepSuccessful() { // Query if prepare was successful
echo "function prepSuccessful\n";
		if ($this->execResult === false) {
			return FALSE;
		}
		else {return TRUE;}
	}

/** Returns whether a statement was successfully executed
  * @return boolean */
	function execSuccessful() { // Query if execute was successful
echo "function execSuccessful\n";
		if ($this->execResult === false) {
			return FALSE;
		}
		else {return TRUE;}
	}

/** Returns the SQLSTATE of the Statement object
  * Multiple calls to this
  * only returns the last state. Multiple calls to
  * odbc_stmt_error will pull all previous states
  * for the statement in reverse order of execution
  * @return integer */
	function state() { // Query the SQL State
echo "function state\n";
		return $this->sqlstate;
	}
	
	function getSTMTError() {
		return odbc_error();	
	}

/** Returns the solidDB Error message
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
		$this->otherResult[] = $this->execResult;
		$this->execResult = odbc_next_result($this->baseResult);
		$this->rowsRead = 0;
		$this->totalRowsInResultSet = -1;
		if($this->execResult !== false)
			if($this->sqlerror == "" && $this->sqlstate == "")
				$this->totalRowsInResultSet = odbc_num_rows($this->execResult);
	
		return $this->execResult;
	}
	
/** Retrieves the field information for the columns information
 * sets $stmt to false when there are no more result sets
  * @return array */
	function getColumnInfo() {
		if($this->execResult !== false || $this->execResult !== null)
		{
			$columnInfo = array();
			$columnInfo['num'] = odbc_num_fields($this->execResult);
			$columnInfo['name'] = array();
			$columnInfo['precision'] = array();
			$columnInfo['scale'] = array();
			$columnInfo['type'] = array();
			$columnInfo['width'] = array();
			$columnInfo['displaySize'] = array();

			for($i = 1; $i <= $columnInfo['num']; $i++)
			{
				$columnInfo['name'][] = odbc_field_name($this->execResult, $i);
				$columnInfo['precision'][] = odbc_field_precision($this->execResult, $i);
				$columnInfo['scale'][] = odbc_field_scale($this->execResult, $i);
				$columnInfo['type'][] = strtolower(odbc_field_type($this->execResult, $i));
				$columnInfo['width'][] = odbc_field_len($this->execResult, $i);
//DG				$columnInfo['displaySize'][] = db2_field_display_size($this->execResult, $i);
				$columnInfo['displaySize'][] = odbc_field_len($this->execResult, $i);
			}

			return $columnInfo;
		}
		return null;
	}	
	
/** Retrieve a single row. Each array element will be identified
  * by the column name
  * @return array */
	function fetch() {
		$this->rowsRead++;
//		return $this->checkForRowReturnError(odbc_fetch_array($this->execResult));
		$returnArray = array();
		if(@odbc_fetch_into($this->execResult, $returnArray) === false)
			$returnArray = null;
		return $this->checkForRowReturnError($returnArray);
	}

/** Retrieve a single row. Each array element will be identified
  * by an sequential index number starting at 0
  * @return array */
	function fetchIndexedRow() {
		$this->rowsRead++;
		$returnArray = array();
		if(@odbc_fetch_into($this->execResult, $returnArray) === false)
			$returnArray = null;
		return $this->checkForRowReturnError($returnArray);
	}

/** Retrieve a single row. Each array element will be identified
  * by the coloumn name or as given in the statment
  * @return array */
	function fetchAssocRow() {
echo "function fetchAssocRow\n";
		$this->rowsRead++;
		return $this->checkForRowReturnError(odbc_fetch_array($this->execResult));
	}
	
/** Retrieve a single row. Each array element will be identified
  * by the coloumn name and by column index.
  * @return array */
	function fetchBoth() {
echo "function fetchBoth\n";
		$this->rowsRead++;
		return $this->checkForRowReturnError(odbc_fetch_array($this->execResult));
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
echo "function fetchNRowsScrollable\n";
		$resultSetIndex = $starting + 1; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		$this->rowsRead = $starting;
		while ($row = odbc_fetch_array($this->execResult, $resultSetIndex)) {
			$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
			$this->rowsRead++;
			$resultSetIndex++; // Increment our row pointer
			if ($resultSetIndex > $maxRow) {break;} // Stop if we have retrieved enough rows.
		}
		return $resultSet;
	}

/** Retrieve a a specified number of rows. Each array element will be identified
 * by an sequential index number starting at 0.
 * $rows specifies the number of rows to retrieve.
 * $starting specifies the starting row, initially indexes at 0.
 * Returns an array of rows.
 * @return array */
	function fetchNRows($rows, $starting = 1, $verbose = FALSE) {
echo "function fetchNRows\n";
		$MaxForwardScrollLookAHead = ($rows * 5) + 5;
		$resultSet = array();
		$resultSetIndex = $starting; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		if(odbc_cursor_type($this->execResult) == DB2_SCROLLABLE ) //?DG? what to do about this?
		{
			$starting = $starting == 0 ? 1 : $starting;
			for($resultSetIndex=$starting; $resultSetIndex <= $maxRow; $resultSetIndex++)
			{
				$row = odbc_fetch_array($this->execResult, $resultSetIndex);
				if ($row === false) {break;}
				$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
				$this->rowsRead++;
			}
		}
		else
		{
			// Fast forward to the starting row
			for ($resultSetIndex = 1; $resultSetIndex <= $starting; $resultSetIndex++) {
				if (odbc_fetch_array($this->execResult) === false) {return null;}
				$this->rowsRead++;
			}

			// Build an array of rows for the number of rows requested$maxRow
			for ( $resultSetIndex; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				$row = odbc_fetch_array($this->execResult);
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
echo "function getNumberOfParametersToBind\n";
	    $stmt = odbc_prepare($db2conn, $query);

    //Try to bind parameters to the statement till it fails at which point we will know how many 
    //parameters there are.
    	for ($paramCount=1; $paramCount <= 1024; $paramCount++) {
			if(db2_bind_param($stmt, $paramCount, "a", DB2_PARAM_IN)) continue;
			if(db2_bind_param($stmt, $paramCount, "a", DB2_PARAM_INOUT)) continue;
			if(db2_bind_param($stmt, $paramCount, "a", DB2_PARAM_OUT)) continue;
			break;
		}
		odbc_free_stmt($stmt);
		return $paramCount--;
	}
	
	public function executeStmtWithParameters($bindParameters)
	{
echo "function executeStmtWithParameters\n";
		$storageCode = ""; 
		$uid = uniqid();
		
		$prepareCode = "function TempStatmentToRun$uid(\$ReturnObject, \$bindParameters) {\n";
		
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
		
		foreach($bindParameters as $parameterNumber=>$parameteOptions)
		{
			$name = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$parameterNumber}") : "p{$parameterNumber}";
			$value = isset($parameteOptions['value']) ? "'" . rawurlencode($parameteOptions['value']) ."'" : "''";
			$dataType = isset($parameteOptions['dataType']) ? strtolower($parameteOptions['dataType'] ): "string";
			$type = isset($parameteOptions['type']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['type']) ? $parameteOptions['type'] : 'DB2_PARAM_OUT') : 'DB2_PARAM_OUT';
			$DB2dataType = isset($parameteOptions['DB2dataType']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['DB2dataType']) ? $parameteOptions['DB2dataType'] : null) : null;
			$precision = isset($parameteOptions['precision']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['precision']) ? $parameteOptions['precision'] : null) : null;
			$scale = isset($parameteOptions['scale']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['scale']) ? $parameteOptions['scale'] : null) : null;

			$prepareCode .= "\$$name = ";
			switch($dataType)
			{
				case "null":
					 $prepareCode .= "null;\n";
					break;
				case "int";
				    $prepareCode .= "intval(rawurldecode($value));\n";
					break;
				case 'float':
				    $prepareCode .= "floatval(rawurldecode($value));\n";
					break;
				default:
					$prepareCode .= "rawurldecode($value);\n";
			}

			$prepareCode .= "db2_bind_param(\$ReturnObject->execResult, $parameterNumber, \"{$name}\"";
			
			if($type != null)
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
			}
			
			
			$prepareCode .= ");\n";
			$storageCode .= "\$ReturnObject->parameters['{$name}'] = htmlspecialchars(\${$name},  ENT_QUOTES, \"UTF-8\");\n";
		}
		$prepareCode .= "\$startTime = microtime(true);\n";		

		
		$prepareCode .= "if(odbc_execute(\$ReturnObject->execResult))\n";
		$prepareCode .= "{";
		$prepareCode .= "\$ReturnObject->statementSucceed = true;\n";
		$prepareCode .= "\$ReturnObject->baseResult = \$ReturnObject->execResult;\n";
		$prepareCode .= "\$ReturnObject->executionTime = microtime(true) - \$startTime;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = odbc_stmt_errormsg(\$ReturnObject->execResult);\n";
		$prepareCode .= "\$ReturnObject->sqlstate = odbc_stmt_error(\$ReturnObject->execResult);\n";
		$prepareCode .= "} else {";
		$prepareCode .= "\$ReturnObject->statementSucceed = false;\n";
		$prepareCode .= "\$ReturnObject->sqlerror = odbc_stmt_errormsg();\n";
		$prepareCode .= "\$ReturnObject->sqlstate = odbc_stmt_error();\n";
		$prepareCode .= "}";
		$prepareCode .= $storageCode;

		$prepareCode .= "}\n";
		$prepareCode .= "TempStatmentToRun$uid(\$this, \$bindParameters);\n";
		
    	eval($prepareCode);
	}
	
	public function getRowsInResultSet($OverRideGetRowCount = false) {
		if(!$this->getRowCount || $OverRideGetRowCount) return array("rowsFound" => $this->rowsRead, "endFound" =>false);
		
		if($this->totalRowsInResultSet >= $this->rowsRead) {	
			return array("rowsFound" => $this->totalRowsInResultSet, true);
		} else {
			$maxRow = $this->rowsRead + SQL_MAX_ROW_LOOK_AHEAD;
			while ($row = odbc_fetch_array($this->execResult)) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) {break;} // Stop if we have retrieved enough rows.
			}
			$this->rowsRead--;
			return array("rowsFound" => $this->rowsRead, "endFound" => ($row == null ? true : false));
		}
	}
}
