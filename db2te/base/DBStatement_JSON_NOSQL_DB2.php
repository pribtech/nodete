<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2014 All rights reserved.
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

class Statement_json_nosql_DB2 extends Statement {

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
		if( $prepare_statment) return;
		$this->totalRowsInResultSet = 0;
		$this->execute();
		if ($this->updatableStatement) return;
	}
	
	function __destruct() {
	 	if(isset($this->dbconn)) unset($this->dbconn);
	}
/*	
	function commandDb() {

		switch () {
		 db.createCollection(name, indexSpec)
		 db.getCollection ("books");
		}

	}
*/	
	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		java_last_exception_clear();
		java_throw_exceptions(true);
		$this->statementSucceed=true;
		$startTime = microtime(true);
		if ($parameters != null) {
			$this->executeStmtWithParameters($parameters);
			return $this->state();
		}
/*
		try {
			switch () {
				case 'db':
					$this->commandDb();
					break;
			}
		} catch (JavaException $e) {
			$this->setError('?????',$e->getMessage());
		} 
*/
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
			$this->setError('?????',$e->getMessage());
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
			$this->setError('?????',$e->getMessage());
			$this->connected = false;
			return;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return;
		} 
	}	
	
	function setError($sqlstate,$message) {
		$this->sqlerror = $message;
		$this->sqlstate = $sqlstate;
		$this->statementSucceed = false;
	}	

	function fetchBoth() {$this->setError('?????','fetchBoth not implement');}
	function fetch() {$this->setError('?????','fetch not implement');}
	function fetchIndexedRow() {$this->setError('?????','fetchIndexedRow not implement');}
	function fetchAssocRow() {$this->setError('?????','fetchAssocRow not implement');}
	static function getNumberOfParametersToBind($query, $db2conn) {$this->setError('?????','getNumberOfParametersToBind not implement');}
	function checkForRowReturnError($row) {$this->setError('?????','checkForRowReturnError not implement');}
	function fetchNRowsScrollable($rows, $starting = 0, $verbose = FALSE) {$this->setError('?????','fetchNRowsScrollable not implement');}
	function fetchNRows($rows, $starting = 1, $verbose = FALSE) {$this->setError('?????','fetchNRows not implement');}
	public function executeStmtWithParameters($bindParameters) {$this->setError('?????','executeStmtWithParameters not implement');}
	public function getRowsInResultSet($OverRideGetRowCount = false) {$this->setError('?????','getRowsInResultSet not implement');}
	public function getRow(&$resultSet,&$columnInfo) {$this->setError('?????','getRow not implement');}
}