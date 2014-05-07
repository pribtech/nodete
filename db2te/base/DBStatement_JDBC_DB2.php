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

class Statement_jdbc_DB2 extends Statement {

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
		 
		java_last_exception_clear();
		java_throw_exceptions(true);
		$startTime = microtime(true); 
		try {
			$this->updatableStatement=!preg_match("/^\s*(select|value|with)/i",  $this->stmt);
			if ($prepare_statment) { 
				$this->type = "Prepare";
				$this->preparedStmt = $this->dbconn->prepareStatement($this->stmt);
			} else { 
				$this->type = "Execute";
				$this->statementJava = $this->dbconn->createStatement();
				if($this->statementJava==null)
					throw new Exception("createStatement failure: ".java_last_exception_get());
				java_throw_exceptions(true);
				if ($this->updatableStatement) {
					$this->statementJava->execute($this->stmt);
					$this->resultSetStmt=null;
					$error=java_last_exception_get();
					if($error!=null || $error !="")
						throw new Exception("execute failure: ".$error);
				}	else {
					$this->resultSetStmt = $this->statementJava->executeQuery($this->stmt);
					if($this->resultSetStmt==null)
						throw new Exception("executeQuery failure: ".java_last_exception_get());
				}
			}
			$this->elapsedTime = microtime(true) - $startTime; // record end time
			if( $prepare_statment) return;
			$this->totalRowsInResultSet = 0;  // $this->resultSetStmt->getMaxRows();
		} catch (Exception $e) {
			$this->sqlerror = $e->getMessage();
			$this->sqlstate = '????';
			$this->statementSucceed = false;
			return;
		} catch (SQLException $e) {
			$this->checkForError($e);
			return;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return;
		} 
		if ($this->updatableStatement) return;
		$this->setColumnInfo($this->resultSetStmt);
	}
	
	function __destruct() {
		if(isset($this->resultSetStmt))	unset($this->resultSetStmt);
	 	if(isset($this->preparedStmt))	$this->preparedStmt->close();
	 	if(isset($this->statementJava))	unset($this->statementJava);
	 	if(isset($this->dbconn)) unset($this->dbconn);
	}
	
	function checkForError($exception) {
		$this->sqlerror = $exception->getCause()." => ".$exception->getMessage();
		$this->sqlstate =  $e->getSQLState();
		$this->statementSucceed = false;
	}

	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		$this->statementSucceed=true;
		$startTime = microtime(true);
		if ($parameters != null) {
			$this->executeStmtWithParameters($parameters);
			return $this->state();
		}
		try {
			$this->resultSetStmt = $this->preparedStmt->execute(); 
			if(!$this->updatableStatement && $this->resultSetStmt==null) {
				$this->sqlerror = java_last_exception_get();
				$this->sqlstate = '????';
				$this->statementSucceed = false;
			}
		} catch (JavaException $e) {
			$this->checkForError($e);
		} 
		$this->elapsedTime = microtime(true) - $startTime; // record end time
		if($this->updatableStatement) {
			$this->totalRowsInResultSet = 0;
			if(!$this->statementSucceed) return $this->state();
			return 0;
		}
		$this->setColumnInfo($this->resultSetStmt);
		if(!$this->statementSucceed) return $this->state();
		try {
			$this->totalRowsInResultSet = $this->resultSetStmt->getMaxRows();
		} catch (JavaException $e) {
			$this->checkForError($e);
			return $this->state();
		} 
		return 0;
	}
	function getEstimateCost() { return $this->resultSetStmt->getEstimateCost(); }
	function getEstimateRowCount() { return $this->resultSetStmt->getEstimateRowCount(); }
	
	function prepSuccessful() { return $this->statementSucceed; }
	function execSuccessful() { return $this->statementSucceed; }
	function state() { return $this->sqlstate; }
	function errorMsg() { return $this->sqlerror; }

	function nextResultSet() {
		if(!$this->statementSucceed) return false;
		if($this->resultSet==0) {
			if(strtoupper(substr(trim($this->stmt),0,4)) != 'CALL') { 
				$this->resultSet++;
				return false;
			}
		} 
	
		$this->otherResult[] = $this->execResult;
		$this->rowsRead = 0;
		$this->totalRowsInResultSet = -1;
		try{
			$this->resultSetStmt->next();
			if($this->resultSetStmt->next()) {
				$this->resultSet++;
				$this->totalRowsInResultSet = $this->execResult->getMaxRows();
			}
		} catch (JavaException $e) {
			$this->checkForError($e);
			return false;
		} 
		return $this->execResult;
	}
	
	function getColumnInfo() {return $this->columnInfo;}
	public function setColumnInfo(&$resultSet) {
		if($resultSet==null) {
			$this->sqlstate = '99999';
			$this->statementSucceed=false;
			$this->sqlerror = java_last_exception_get();
			return;
		}
		
		java_last_exception_clear();
		$this->columnInfo = array();
		$this->metaData = $resultSet->getMetaData();
		if($this->metaData==null)
			throw new Exception(java_last_exception_get());
		try{
			$this->columnInfo['num'] = $this->metaData->getColumnCount();;
			$this->columnInfo['name'] = array();
			$this->columnInfo['precision'] = array();
			$this->columnInfo['scale'] = array();
			$this->columnInfo['type'] = array();
			$this->columnInfo['width'] = array();
			$this->columnInfo['displaySize'] = array();
			for($i = 1; $i <= $this->columnInfo['num']; $i++) 	{
				$this->columnInfo['name'][] = $this->metaData->getColumnLabel($i);
				$this->columnInfo['precision'][] = $this->metaData->getPrecision($i);
				$this->columnInfo['scale'][] = $this->metaData->getScale($i);
				$this->columnInfo['type'][] = $this->metaData->getColumnTypeName($i);
				$this->columnInfo['width'][] = $this->metaData->getColumnDisplaySize($i);
				$this->columnInfo['displaySize'][] = $this->metaData->getColumnDisplaySize($i);
			}
			return;
		} catch (Exception $e) {
			$this->SQLState = '?????';
			$this->SQLErrorMSG = $e->getMessage();
			$this->connected = false;
			return;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return;
		} 
	}	
	
	function fetchBoth() {
		if(!$this->statementSucceed) return false;
		$this->rowsRead++;
		try{
			if(!$this->resultSetStmt->next()) return false;
			return $this->getRow($this->resultSetStmt,$this->columnInfo);
		} catch (Exception $e) {
			$this->sqlerror = $e->getMessage();
			$this->sqlstate = '????';
			$this->statementSucceed = false;
			return false;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return false;
		} 
	}
	function fetch() {return $this->fetchBoth(); }
	function fetchIndexedRow() {return $this->fetchBoth(); }
	function fetchAssocRow() { return $this->fetchBoth(); }
	static function getNumberOfParametersToBind($query, $db2conn) {return;}
	function checkForRowReturnError($row) {return;}
	
	function fetchNRowsScrollable($rows, $starting = 0, $verbose = FALSE) {
		$resultSetIndex = $starting + 1; // Use this to keep track of which row we are on.
		return $this->fetchNRows($rows, $starting);
	}

	function fetchNRows($rows, $starting = 1, $verbose = FALSE) {
		$resultSet = array();
		if(!$this->statementSucceed) return $resultSet;
		$resultSetIndex = $starting;
		$maxRow = $starting + $rows;  
		$this->rowsRead = $starting;
		
		try{
			$this->resultSetStmt->absolute($starting);
			for ( $resultSetIndex; $resultSetIndex <= $maxRow; $resultSetIndex++) {
				if(!$this->resultSetStmt->next()) break;
				$resultSet[$resultSetIndex] = $this->getRow($this->resultSetStmt,$this->columnInfo);
				$this->rowsRead++;
			}
		} catch (Exception $e) {
			$this->sqlerror = $e->getMessage();
			$this->sqlstate = '????';
			$this->statementSucceed = false;
			return false;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return null;
		} 
		return $resultSet;
	}
	
	public function executeStmtWithParameters($bindParameters) {
/*
CallableStatement cs = conn.prepareCall(
   "? = CALL getDriverType(cast (? as INT))"
cs.registerOutParameter(1, Types.INTEGER);
cs.setInt(2, 35);

*/
	    if(!$this->statementSucceed) return;
	    if($this->resultSetStmt==null) {
	    	$this->sqlerror = java_last_exception_get();
	    	$this->sqlstate = '????';
	    	$this->statementSucceed = false;
	    	return;
	    }
	     
		$this->parameterMetaData = $this->resultSetStmt->getParameterMetaData();
		if($bindParameters == null) {
			$bindParameters = array();
			$j=0;
			for($i = 1; $i <= $paramsToBind; $i++) {
				switch ( $parameterMetaData->getParameterMode($i)) {
					case 0:
					case 1:
						$bindParameters[$j]['name'] = "parameter" . $j;
						$j++;
						break;
				}
			}
		}
		$parameterNames=array();
		$setType=array();		
		$conversion=array();		
		foreach($bindParameters as $parameterNumber=>$parameteOptions) {
			$name = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$parameterNumber}") : "p{$parameterNumber}";
			$parameterNames[]=$name;
			$value = isset($parameteOptions['value']) ? $parameteOptions['value'] : null;
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
				case "string":
					$$name = ($value==null?null:rawurldecode($value));
					$DB2dataType = DB2_CHAR;
					break;
				default:
					$this->sqlerror = 'Invalid data type for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' DB2 data type: '.$DB2dataType.' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' conversion: '.(isset($conversion[$name])?$conversion[$name]:'');
					$this->sqlstate = '99999';
					$this->statementSucceed=false;
					return;
			}
			try{
				switch ($parameterMetaData->getParameterMode($parameterNumber)) {
					case '??':  //'IN' :
			if (!@db2_bind_param($this->execResult, $parameterNumber, $name , $DB2Type , $DB2dataType ,($precision==null?-1:$precision),($scale==null?0:$scale)))
						break;
					case '??': //'INOUT' :
						break;
					case '??': // 'OUT' :
						break;
					default:
						throw new Exception( 'Invalid type for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' Driver data type: '.$parameterMetaData->getParameterMode($parameterNumber).' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' value: '.$$name);
				}
			} catch (JavaException $e) {
				$this->checkForError($e);
				$this->sqlstate = '99999';
				return;
			} 
		}
		$startTime = microtime(true);	
		try {	
			$this->result = $this->execResult->execute();
		} catch (JavaException $e) {
			$this->checkForError($e);
		} 
		$this->executionTime = microtime(true) - $startTime;
		$this->setColumnInfo($this->result);

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
		if(!$this->getRowCount || $OverRideGetRowCount) 
			return array("rowsFound" => $this->rowsRead, "endFound" =>false);
		
		if($this->totalRowsInResultSet >= $this->rowsRead) 
			return array("rowsFound" => $this->totalRowsInResultSet, true);

		$maxRow = $this->rowsRead + SQL_MAX_ROW_LOOK_AHEAD;
		$row = null;
		try {
			while ($this->resultSetStmt->next()) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) break; 
			}
		} catch (JavaException $e) {
			$this->checkForError($e);
		} 
		$this->rowsRead--;
		$endFound=($this->resultSetStmt->next() == null);
		$this->resultSetStmt->close();
		return array("rowsFound" => $this->rowsRead, "endFound" => ( $this->statementSucceed ? $endFound : true ));
	}
	public function getRow(&$resultSet,&$columnInfo) {
		$row=array();
		for($i = 0; $i < $columnInfo['num']; $i++) 	{
			switch ( $columnInfo['type'][$i]) {
				case 'BIGINT':	// 	BIGINT
					$row[]=$resultSet->getLong($i+1);
					break;
				case 'BOOLEAN':	
					$row[]=$resultSet->getBoolean($i+1);
					break;
				case 'BINARY':	// 	CHAR FOR BIT DATA
					$row[]=$resultSet->getBytes($i+1);
					break;
				case 'BIT':	// 	CHAR FOR BIT DATA
				case 'BIT1':	// 	CHAR FOR BIT DATA
					$row[]=$resultSet->getBoolean($i+1);
					break;
				case 'BLOB':	// 	BLOB (JDBC 2.0 and up)
					$row[]=$resultSet->getBlob($i+1);
					break;
				case 'CLOB':	// 	CLOB (JDBC 2.0 and up)
					$row[]=$resultSet->getClob($i+1);
					break;
				case 'DATE':	// 	DATE
					$row[]=$resultSet->getDate($i+1);
					break;
				case 'DECIMAL':	// 	DECIMAL
				case 'NUMERIC':	// 	DECIMAL
					$row[]=$resultSet->getBigDecimal($i+1);
					break;
				case 'DOUBLE':	// 	DOUBLE PRECISION
					$row[]=$resultSet->getDouble($i+1);
					break;
				case 'FLOAT':	// 	DOUBLE PRECISION2
				case 'REAL':	// 	REAL
					$row[]=$resultSet->getFloat($i+1);
					break;
				case 'INTEGER':	// 	INTEGER
					$row[]=$resultSet->getInt($i+1);
					break;
				case 'SMALLINT':	// 	SMALLINT
					$row[]=$resultSet->getShort($i+1);
					break;
				case 'TIME':	// 	TIME
					$row[]=$resultSet->getTime($i+1);
					break;
				case 'TIMESTAMP':	// 	TIMESTAMP
					$row[]=$resultSet->getTimestamp($i+1);
					break;
				case 'CHAR':	// 	CHAR
				case 'LONGVARBINARY':	// 	LONG VARCHAR FOR BIT DATA
				case 'LONG VARBINARY':	// 	LONG VARCHAR FOR BIT DATA
				case 'LONGVARCHAR':	// 	LONG VARCHAR
				case 'LONG VARCHAR':	// 	LONG VARCHAR
				case 'VARBINARY':	// 	VARCHAR FOR BIT DATA
				case 'VARCHAR':	// 	VARCHAR
				case 'SQLXML3':	// 	XML
					$row[]=$resultSet->getString($i+1);
					break;
				case 'org.apache.derby.catalog.AliasInfo':	
				case 'org.apache.derby.catalog.TypeDescriptor':
				case 'org.apache.derby.catalog.IndexDescriptor':
				case 'java.io.Serializable':
					$row[]=null;
					break;
				default:
					throw new Exception('Unknown data type: '.$columnInfo['type'][$i]);
			}
		}	
		return $row; 
	}
}
