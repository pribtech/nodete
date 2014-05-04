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
class Statement_IBM_DB2 extends Statement {

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
		
		if ($this->dbconn === false) { 
			$this->statementSucceed = false;
			$this->sqlerror = "No database connection";
			$this->sqlstate = "?????";
			return;
		} 
					 
		// Check that the connection is valid
		// db2_exec returns 0 if the statement fails;
		// otherwise it returns a result set ID
		$startTime = microtime(true); // Record the start time

		if ($prepare_statment) { // If prepare was requested
			$this->type = "Prepare";
			$this->execResult = $this->checkForError(@db2_prepare($this->dbconn, $this->stmt));//,  $options);
		} else { // If execute was requested (default)
			$this->type = "Execute";
			try{
				$this->execResult = $this->checkForError(@db2_exec($this->dbconn, $this->stmt));//, array('cursor' => DB2_SCROLLABLE));
			} catch (Exception $e) {
				$this->sqlerror = db2_stmt_errormsg();
				$this->sqlstate = db2_stmt_error();
				$this->statementSucceed = false;
			}
			$this->baseResult = $this->execResult;
		}
		if(!$this->statementSucceed) return;

		$this->elapsedTime = microtime(true) - $startTime; // record end time

		if( $prepare_statment) return;
		if ($this->execResult === false)  {
			$this->statementSucceed = false;
			$this->sqlerror = $this->sqlerror == "" ? "Database returned no error" : $this->sqlerror;
			$this->sqlstate = $this->sqlstate == "" ? "?????" : $this->sqlstate;
			return;
		} 
		if($this->statementSucceed && $this->sqlerror == "" && $this->sqlstate == "")
			$this->totalRowsInResultSet = $this->checkForError(@db2_num_rows($this->execResult));
	}
	
	function checkForError(&$result=null) {
		if(is_resource($result)) {
			$this->sqlerror = db2_stmt_errormsg($result);
			$this->sqlstate = db2_stmt_error($result);
		} else {
			$this->sqlerror = db2_stmt_errormsg();
			$this->sqlstate = db2_stmt_error();
		}
		if($this->sqlstate=='00000') return $result;
		if($this->sqlstate=='') return $result;
		if($this->sqlstate=='01602') return $result;
		$this->statementSucceed = false;
		return false;
	}

/** Executes a prepared statement.
  * Requires an array of parameters
  * @return boolean */

	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		$this->statementSucceed=true;
		$execResult = false;
		$startTime = microtime(true);
		if ($parameters != null) {
			$execResult = $this->checkForError(@db2_execute($this->execResult, $parameters)); // Record execution result
			$this->baseResult = $this->execResult;
		} else {
			$execResult = $this->checkForError(@db2_execute($this->execResult)); //Calling with no parameters.
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
		if(!$this->statementSucceed) return false;
		if($this->resultSet==0) {
			if(strtoupper(substr(trim($this->stmt),0,4)) != 'CALL') { 
				$this->resultSet++;
				return false;
			}
		} 
	
		$this->otherResult[] = $this->execResult;
		$this->execResult = $this->checkForError(@db2_next_result($this->baseResult));
		$this->rowsRead = 0;
		$this->totalRowsInResultSet = -1;
		if(!$this->statementSucceed) return false;
		if($this->execResult !== false) {
			$this->resultSet++;
			if($this->sqlerror == "" && $this->sqlstate == "")
				$this->totalRowsInResultSet = @db2_num_rows($this->execResult);
		}
		return $this->execResult;
	}
	
/** Retrieves the field information for the columns information
 * sets $stmt to false when there are no more result sets
  * @return array */
	function getColumnInfo() {
		if($this->execResult == false || $this->execResult == null) {
			$this->sqlerror = 'No column information';
			$this->sqlstate = '99999';
			$this->statementSucceed=false;
			return;
		}
		$columnInfo = array();
		$columnInfo['num'] = $this->checkForError(@db2_num_fields($this->execResult));
		if(!$this->statementSucceed) return;
		$columnInfo['name'] = array();
		$columnInfo['precision'] = array();
		$columnInfo['scale'] = array();
		$columnInfo['type'] = array();
		$columnInfo['width'] = array();
		$columnInfo['displaySize'] = array();
		for($i = 0; $i < $columnInfo['num']; $i++) {
			$columnInfo['name'][] = @db2_field_name($this->execResult, $i);
			$columnInfo['precision'][] = @db2_field_precision($this->execResult, $i);
			$columnInfo['scale'][] = @db2_field_scale($this->execResult, $i);
			$columnInfo['type'][] = @strtolower(@db2_field_type($this->execResult, $i));
			$columnInfo['width'][] = @db2_field_width($this->execResult, $i);
			$columnInfo['displaySize'][] = @db2_field_display_size($this->execResult, $i);
		}
		return $columnInfo;
	}	
	
/** Retrieve a single row. Each array element will be identified
  * by the column name
  * @return array */
	function fetch() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@db2_fetch_array($this->execResult));
	}

/** Retrieve a single row. Each array element will be identified
  * by an sequential index number starting at 0
  * @return array */
	function fetchIndexedRow() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@db2_fetch_array($this->execResult));
	}

/** Retrieve a single row. Each array element will be identified
  * by the coloumn name or as given in the statment
  * @return array */
	function fetchAssocRow() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@db2_fetch_assoc($this->execResult));
	}
	
/** Retrieve a single row. Each array element will be identified
  * by the coloumn name and by column index.
  * @return array */
	function fetchBoth() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		return $this->checkForRowReturnError(@db2_fetch_both($this->execResult));
	}
	
	function checkForRowReturnError($row) {
		$this->sqlstate = @db2_stmt_error();
		if($this->sqlstate==null) return $row;
		if($this->sqlstate=='00000') return $row;
		$this->sqlerror = @db2_stmt_errormsg();
		$this->statementSucceed = false;
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
		while ($row = $this->checkForRowReturnError(@db2_fetch_array($this->execResult, $resultSetIndex))) {
			if(!$this->statementSucceed) return $resultSet;
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
		$MaxForwardScrollLookAHead = ($rows * 5) + 5;
		$resultSet = array();
		$resultSetIndex = $starting; // Use this to keep track of which row we are on.
		$maxRow = $starting + $rows;  // The maximum row index to retrieve
		if($this->checkForError(db2_cursor_type($this->execResult)) == DB2_SCROLLABLE ) {
			if(!$this->statementSucceed) return null;
			$starting = $starting == 0 ? 1 : $starting;
			for($resultSetIndex=$starting; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				$row = $this->checkForRowReturnError(@db2_fetch_array($this->execResult, $resultSetIndex));
				if (!$this->statementSucceed || $row === false) break;
				
				$resultSet[$resultSetIndex] = $row; // Add this row to the array of rows.
				$this->rowsRead++;
			}
		} else {
			// Fast forward to the starting row
			if(!$this->statementSucceed) return null;
			for ($resultSetIndex = 1; $resultSetIndex <= $starting; $resultSetIndex++) {
				if ($this->checkForRowReturnError(@db2_fetch_array($this->execResult)) === false) return null;
				if(!$this->statementSucceed) return null;
				$this->rowsRead++;
			}

			// Build an array of rows for the number of rows requested$maxRow
			for ( $resultSetIndex; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				$row = $this->checkForRowReturnError(@db2_fetch_array($this->execResult));
				if (!$this->statementSucceed || $row === false) break;
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

	    $stmt = @db2_prepare($db2conn, $query);
	    if($stmt==null) return -1;

    //Try to bind parameters to the statement till it fails at which point we will know how many 
    //parameters there are.
    	for ($paramCount=1; $paramCount <= 1024; $paramCount++) {
			if(@db2_bind_param($stmt, $paramCount, "a", DB2_PARAM_IN)) continue;
			if(@db2_bind_param($stmt, $paramCount, "a", DB2_PARAM_INOUT)) continue;
			if(@db2_bind_param($stmt, $paramCount, "a", DB2_PARAM_OUT)) continue;
			break;
		}
		@db2_free_stmt($stmt);
		return --$paramCount;
	}
	
	public function executeStmtWithParameters($bindParameters) {
	    if(!$this->statementSucceed) return;
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
			$value = isset($parameteOptions['value']) ? (strtolower($parameteOptions['value']) == 'null' ? null : $parameteOptions['value'] ): null;
			$dataType = isset($parameteOptions['dataType']) ? $parameteOptions['dataType'] : "string";
			$type = isset($parameteOptions['type']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['type']) ? $parameteOptions['type'] : 'DB2_PARAM_OUT') : 'DB2_PARAM_OUT';
			$DB2dataType = isset($parameteOptions['DB2dataType']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['DB2dataType']) ? $parameteOptions['DB2dataType'] : null) : null;
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
				
			switch (strtolower($dataType)) {
				case 'smallint' :
					if($precision==-1) $precision=5;
				case 'int' :
				case 'integer' :
					if($precision==-1) $precision=10;
				    $$name = ($value==null?null:intval(str_replace(",","",$value)));
					$DB2dataType = DB2_BINARY;
					break;
				case 'real' :
				case 'float' :
				case 'double' :
				    $$name = ($value==null?null:doubleval(str_replace(",","",$value)));
					$DB2dataType = DB2_DOUBLE;
					break;
				case 'bigint' :
				case 'long' :
					if($precision==-1) $precision=15;
					$$name = ($value==null?null:intval(str_replace(",","",$value)));
					$DB2dataType = DB2_LONG;
					break;
				case "null":
					$$name = null;
					$DB2dataType = DB2_CHAR;
					break;
				case "blob":
					$$name = ($value==null?null:rawurldecode($value));
					$DB2dataType = null;
					break;
				case "string":
				case "date":
				case "time":
				case "timestamp":
					$$name = ($value==null?null:rawurldecode($value));
					$DB2dataType = DB2_CHAR;
					break;
				default:
					$this->sqlerror = 'Invalid data type for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' DB2 data type: '.$DB2dataType.' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' conversion: '.(isset($conversion[$name])?$conversion[$name]:'');
					$this->sqlstate = '99999';
					$this->statementSucceed=false;
					return;
			}
			switch (strtoupper($type)) {
				case 'DB2_PARAM_IN' :
				case 'IN' :
					$DB2Type = DB2_PARAM_IN;
					break;
				case 'DB2_PARAM_INOUT' :
				case 'INOUT' :
					$DB2Type = DB2_PARAM_INOUT;
					break;
				case 'DB2_PARAM_OUT' :
				case 'OUT' :
				case '' :
					$DB2Type = DB2_PARAM_OUT;
					break;
				default:
					$this->sqlerror = 'Invalid type for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' DB2 data type: '.$DB2dataType.' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' value: '.$$name;
					$this->sqlstate = '99999';
					$this->statementSucceed=false;
					return;
			}
			if (!@db2_bind_param($this->execResult, $parameterNumber, $name , $DB2Type , $DB2dataType ,($precision==null?-1:$precision),($scale==null?0:$scale))) {
				$this->sqlerror = 'Bind failed for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' DB2 data type: '.$DB2dataType.' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' value: '.$$name;
				$this->sqlstate = '99999';
				$this->statementSucceed=false;
				return;
			}
		}
		$startTime = microtime(true);		
		$this->result = $this->checkForError( @db2_execute($this->execResult) );
		$this->executionTime = microtime(true) - $startTime;

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
						for ($i=0; $i < strlen($$name)-1; $i+=2) {
							$outString .= chr(hexdec(substr($$name,$i,2)));
						}
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
			while ($this->statementSucceed && $row = $this->checkForRowReturnError(@db2_fetch_array($this->execResult))) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) {break;} // Stop if we have retrieved enough rows.
			}
			$this->rowsRead--;
			return array("rowsFound" => $this->rowsRead, "endFound" => ( $this->statementSucceed ? ($row == null ? true : false) : true ));
		}
	}
}
