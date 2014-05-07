<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
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

class Statement_HADOOP extends Statement {

	function __construct($stmt_text, $prepare_statment = FALSE, $singleRow = FALSE, $ForwardOnlyScroll = FALSE, $getRowCount = FALSE, $dbconn = null) {
		$this->otherResult = array();
		$this->statementSucceed=false;
		$this->rowPerLine=(!$singleRow);
		if($dbconn == null)
			$this->dbconn = connectionManager::getConnection()->dbconn;
		else if(is_subclass_of($dbconn, 'Connection')) 
			$this->dbconn = $dbconn->dbconn;	
		else if(is_resource($dbconn))
			$this->dbconn = $dbconn;
		else
			$this->dbconn = null;
		if ($this->dbconn==null) {
			$this->setError('99999','No connection established');
			return;
		}
		$this->rows = -1;
		$this->stmt=$stmt_text;
		$this->getRowCount = $getRowCount;
		$this->elapsedTime = 0;
		$this->resultSet = 0;
 
		java_last_exception_clear();
		java_throw_exceptions(true);
		$startTime = microtime(true); 
		try {
			$this->setMaxExecutionTime();
			if ($prepare_statment) { 
				$this->type = "Prepare";
//				$this->dbconn->setCmd($this->stmt);
			} else { 
				$this->type = "Execute";
				java_throw_exceptions(true);
//				$this->resultSetStmt = $this->string2lineRows($this->dbconn->command($this->stmt));
				if($this->resultSetStmt==null)
					throw new Exception("executeQuery failure: ".java_last_exception_get());
			}
			$this->elapsedTime = microtime(true) - $startTime; // record end time
			$this->statementSucceed=true;
			if( $prepare_statment) return;
			$this->totalRowsInResultSet = count($this->resultSetStmt);
		} catch (Exception $e) {
			$this->setError('?????',$e->getMessage());
		} catch (JavaException $e) {
			$this->checkForError($e);
		} 
		if(!$this->statementSucceed) return;
		$this->setColumnInfo($this->resultSetStmt);
	}
	
	function __destruct() {
		if(isset($this->resultSetStmt))	unset($this->resultSetStmt);
	 	if(isset($this->dbconn)) unset($this->dbconn);
	}
	function setMaxExecutionTime() {
		$maxExecutionTime=connectionManager::getConnection()->getMaxExecutionTime();
		if($maxExecutionTime==null) return;
		$this->dbconn->setTimeOut($maxExecutionTime);
		if($maxExecutionTime>120) {
			settype($totalTimeout,"integer");
			$totalTimeout=$maxExecutionTime+5;
//				$this->dbconn->setTotalTimeOut($totalTimeout);      // seems to be a bug in a version of the java bridge
		}
		set_time_limit($maxExecutionTime+10);
	}
	function checkForError($exception) {
		$this->setError(99999, $exception->getCause()." => ".$exception->getMessage());
	}
	function checkForJavaError() {
		if(java_last_exception_get()==null) return;
		throw new Exception(java_last_exception_get());
	}

	function execute($parameters=null, $verbose=false) { // Execute, to only be used if previously prepared
		$this->statementSucceed=true;
		$this->resultSetCnt=0;
		$startTime = microtime(true);
		if ($parameters != null) {
			$this->executeStmtWithParameters($parameters);
			return $this->state();
		} 
		try {
			java_last_exception_clear();
			$this->resultSetStmt = $this->string2lineRows($this->dbconn->command($this->stmt));
			$this->checkForJavaError();
		} catch (Exception $e) {
			$this->setError('????', $e);
		} catch (JavaException $e) {
			$this->checkForError($e);
		} 
		$this->elapsedTime = microtime(true) - $startTime; // record end time
		$this->setColumnInfo($this->resultSetStmt);
		if(!$this->statementSucceed) return $this->state();
		try {
			$this->totalRowsInResultSet = count($this->resultSetStmt);
		} catch (JavaException $e) {
			$this->checkForError($e);
			return $this->state();
		} 
		return 0;
	}

	function prepSuccessful() { return $this->statementSucceed; }
	function execSuccessful() { return $this->statementSucceed; }
	function state() { return $this->sqlstate; }
	function errorMsg() { return $this->sqlerror; }

	function nextResultSet() {
		if(!$this->statementSucceed) return false;
		$this->resultSetCnt++;
		if($this->resultSetCnt>0) return false;
		$this->resultSetStmt=&$this->result;
		return $this->result;
	}
	
	function getColumnInfo() {return $this->columnInfo;}
	
	public function setColumnInfo(&$resultSet) {
		if($resultSet==null) {
			$this->setError('99999',java_last_exception_get());
			return;
		}
		
		java_last_exception_clear();
		$this->columnInfo = array();
		try{
			$this->columnInfo['num'] = 1;
			$this->columnInfo['name'] = array();
			$this->columnInfo['precision'] = array();
			$this->columnInfo['scale'] = array();
			$this->columnInfo['type'] = array();
			$this->columnInfo['width'] = array();
			$this->columnInfo['displaySize'] = array();
			for($i = 1; $i <= $this->columnInfo['num']; $i++) 	{
				$this->columnInfo['name'][] = 'Line';
				$this->columnInfo['precision'][] = 0;
				$this->columnInfo['scale'][] = 1024;
				$this->columnInfo['type'][] = 'CHAR';
				$this->columnInfo['width'][] = 1024;
				$this->columnInfo['displaySize'][] = 80;
			}
			return;
		} catch (Exception $e) {
			$this->setError('?????' , $e->getMessage());
			return;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return;
		} 
	}	
	function setError($sqlstate,$sqlError) {
		$this->sqlerror = $sqlError;
		$this->sqlstate = $sqlstate;
		$this->statementSucceed = false;
	}
	function fetchBoth() {
		if(!$this->statementSucceed) return false;
		if(!isset($this->resultSetStmt)) {
			if(isset($this->result)) { 
				$this->resultSetStmt=&$this->result;
				$this->totalRowsInResultSet = count($this->resultSetStmt);
		} else {
				$this->setError('????','result set null for fetch both');
				return false;
			}
		}
		try{
			if($this->rowsRead++>=$this->totalRowsInResultSet) return false;
			return $this->getRow($this->resultSetStmt,$this->columnInfo);
		} catch (Exception $e) {
			$this->setError('????',$e->getMessage());
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
			$this->setError('????',$e->getMessage());
			return false;
		} catch (JavaException $e) {
			$this->checkForError($e);
			return null;
		} 
		return $resultSet;
	}
	
	public function executeStmtWithParameters($bindParameters) {
	    if(!$this->statementSucceed) return;
	     
		$parameterNames=array();
		$setType=array();		
		$conversion=array();		
		foreach($bindParameters as $parameterNumber=>$parameteOptions) {
			$name = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$parameterNumber}") : "p{$parameterNumber}";
			$parameterNames[]=$name;
			$value = isset($parameteOptions['value']) ? $parameteOptions['value'] : null;
			$dataType = isset($parameteOptions['dataType']) ? $parameteOptions['dataType'] : "string";
			$type = isset($parameteOptions['type']) ? (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['type']) ? $parameteOptions['type'] : 'DB2_PARAM_OUT') : 'DB2_PARAM_OUT';
			$precision = isset($parameteOptions['precision']) ? (preg_match('/^[0-9_]+$/' , $parameteOptions['precision']) ? $parameteOptions['precision'] : -1) : -1;
			$scale = isset($parameteOptions['scale']) ? (preg_match('/^[0-9_]+$/' , $parameteOptions['scale']) ? $parameteOptions['scale'] : null) : null;

			if(isset($parameteOptions['conversion'])) {
				$conversion[$name] = $parameteOptions['conversion'];
				switch ($conversion[$name]) {
					case 'bin2hex' :
						$value = bin2hex($value);
						break;
					default:
				}
			}
			$isNull=false;
			if(isset($parameteOptions['settype'])) {
				$setType[$name] = strtolower($parameteOptions['settype']);
				switch ($setType[$name]) {
					case 'null':
						$isNull=true;
					case 'string':
						settype($$name,$setType[$name]);
						break;
					default:
						$this->setError('99999','Invalid settype for parameter '.$parameterNumber.' name: '.$name.' settype: '.$setType[$name]);
						return;
				}
			}
				
			switch (strtolower($dataType)) {
				case "string":
					$$name = ($value==null?null:rawurldecode($value));
					break;
				default:
					$this->setError('99999','Invalid data type for parameter '.$parameterNumber.' name: '.$name.' data type: '.$dataType.' DB2 data type: '.$DB2dataType.' type: '.$type.' precision: '.$precision.' scale: '.$scale.' valueIn: '.$value.' conversion: '.(isset($conversion[$name])?$conversion[$name]:''));
					return;
			}
			try{
				java_last_exception_clear();
				if($isNull)
					$this->dbconn->setParameterNull($name);
				else
					switch(strtolower($type)) {
						case "null":
							$this->result = $this->dbconn->command('unset $name');
							break;
						default:
							$this->result = $this->dbconn->command('export '.$name.'="'.$value.'"');
					}
				if(java_last_exception_get()!=null) 
					throw new Exception('Set parameter failed for '.$name.' error: '.java_last_exception_get());
			} catch (JavaException $e) {
				$this->checkForError($e);
				return;
			} 
		}
		$startTime = microtime(true);	
		try {	
			$this->result = $this->string2lineRows($this->dbconn->command($this->stmt));
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
						$this->setError('99999','Unknown conversion '.$conversion[$name]);
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
		if(!isset($this->resultSetStmt)) {
			if(isset($this->result)) 
				$this->resultSetStmt=&$this->result;
			else { 
				$this->setError('?????','getRowsInResultSet has null result set');
				return;
			}
		}
		try {
			while (true) { // ($this->resultSetStmt->next()) {
				$this->rowsRead++;
				if ($this->rowsRead > $maxRow) break; 
			}
		} catch (Exception $e) {
			$this->checkForError($e);
		} 
		$this->rowsRead--;
		$endFound=($this->rowsRead >= $this->totalRowsInResultSet);
//		$this->resultSetStmt->close();
		return array("rowsFound" => $this->rowsRead, "endFound" => ( $this->statementSucceed ? $endFound : true ));
	}
	public function getRow(&$resultSet,&$columnInfo) {
		$row=array();
		for($i = 0; $i < $columnInfo['num']; $i++) 	{
			switch ( $columnInfo['type'][$i]) {
				case 'CHAR':	
					$row[]=$resultSet[$this->rowsRead-1];
					break;
				default:
					throw new Exception('Unknown data type: '.$columnInfo['type'][$i]);
			}
		}	
		return $row; 
	}
	function setNoRowPerLine() {$this->rowPerLine=false;}
	function string2lineRows(&$string)  {
		if($this->rowPerLine)
			return preg_split("/(\r\n|\n|\r)/", $string);
		$return=array();
		$return[]=array($string);
		return array($string);
	}
}

/*
 $phase="set job configuration";
//			$jobConfig=$GLOBALS['org.apache.hadoop.mapred.JobConf']->newInstance(array($config));

$constructor = $GLOBALS['org.apache.hadoop.mapred.JobConf']->getDeclaredConstructor(array($GLOBALS['org.apache.hadoop.conf.Configuration']));
if(java_last_exception_get()!=null)
	throw new Exception(java_last_exception_get());
$constructor->setAccessible(true); // use reflection to get access to this private constructor
if(java_last_exception_get()!=null)
	throw new Exception(java_last_exception_get());
$jobConfig=$constructor->newInstance(array($config));
if(java_last_exception_get()!=null)
	throw new Exception(java_last_exception_get());
*/

/*
 $constructorJobClient = $GLOBALS['org.apache.hadoop.mapred.JobClient']->getDeclaredConstructor(array($GLOBALS['org.apache.hadoop.mapred.JobConf']));
if(java_last_exception_get()!=null)
	throw new Exception(java_last_exception_get());
$phase="set job client set accessable";
$constructorJobClient->setAccessible(true); // use reflection to get access to this private constructor
if(java_last_exception_get()!=null)
	throw new Exception(java_last_exception_get());
$phase="set job client new instance";
$jobCLient=$constructorJobClient->newInstance(array($jobConfig));
if(java_last_exception_get()!=null)
	throw new Exception(java_last_exception_get());
*/
/*
 Job job = new Job(conf, "Wordcount");
job.setJarByClass(TestHadoop.class);

FileInputFormat.addInputPath(job, new Path("/user/hue/jobsub/sample_data/midsummer.txt"));
FileOutputFormat.setOutputPath(job, new Path("/tmp/hadoop-out2"));

job.setMapperClass(Map.class);
job.setReducerClass(Reduce.class);

job.setOutputKeyClass(Text.class);
job.setOutputValueClass(IntWritable.class);

job.setInputFormatClass(TextInputFormat.class);
job.setOutputFormatClass(TextOutputFormat.class);

job.waitForCompletion(true);


public void checkStatus(){
ListJobStatus> jobStatusList = new ArrayList();

try {
Configuration conf = new Configuration();
JobClient client = new JobClient(new JobConf(conf));
JobStatus[] jobStatuses = client.getAllJobs();
int jobCount = 0;
for (JobStatus jobStatus : jobStatuses) {
Long lastTaskEndTime = 0L;
TaskReport[] mapReports = client.getMapTaskReports(jobStatus.getJobID());
for (TaskReport r : mapReports) {
if (lastTaskEndTime < r.getFinishTime())
	lastTaskEndTime = r.getFinishTime();
}
TaskReport[] reduceReports = client.getReduceTaskReports(jobStatus.getJobID());
for (TaskReport r : reduceReports) {
if (lastTaskEndTime < r.getFinishTime())
	lastTaskEndTime = r.getFinishTime();
}
client.getSetupTaskReports(jobStatus.getJobID());
client.getCleanupTaskReports(jobStatus.getJobID());

String jobId = jobStatus.getJobID().toString();
Long startTime = jobStatus.getStartTime();
String user = jobStatus.getUsername();
int mapProgress = (int)(jobStatus.mapProgress() * 100);
int reduceProgress = (int)(jobStatus.reduceProgress() * 100);

jobStatusList.add(jobStat);
}
*/

