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
require_once("jar/hadoop.php");
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_HADOOP.php');

class Connection_HADOOP extends Connection {
	public static $driverLoaded = "hadoopDriverLoaded";
	public static $isPHPExtension = false;
	public static $requiredDBExtension = "HADOOP";
	public static $requiredDBExtensionMinVersion = 1.0;
	public static $classDBMS = "HADOOP";
	public $statementClass = "Statement_HADOOP";

	public static $features = array(
		 );
	
	public static function driverCheck() {
		if(!isset($GLOBALS[self::$driverLoaded]) || ! $GLOBALS[self::$driverLoaded]) {
			self::setError( -1 , (JAVA_BRIDGE_ACTIVE?"The HADOOP class library location not defined or found.":"PHP Java Bridge not installed") );
			return false;
		} 
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_HADOOP($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false) {
		$this->connected = false;
		$this->DBMS=self::$classDBMS;
		if(!@$this->driverCheck()) return;

		$this->description = $username."@".$hostname.":". $portnumber;
		$this->username = $username;
		$this->password = $password;
		$this->hostname = $hostname;
		$this->portnumber = $portnumber;
		
		$phase="";
		try {
			java_throw_exceptions(true);
			if(!isset($GLOBALS["datasource"]))
				$GLOBALS["datasource"]=array();
			if(isset($GLOBALS["datasource"][$this->description])) {
				$this->dataSource=&$GLOBALS["datasource"][$this->description];
				$this->dbconn=$this->dataSource;
				$this->connected = false;
				return;
			}
			$phase="set configuration";
			java_last_exception_clear();
			$config=$GLOBALS['org.apache.hadoop.conf.Configuration']->newInstance();
			if(java_last_exception_get()!=null)
				throw new Exception(java_last_exception_get());
			$phase="set configuration value";
			$config->set("mapred.job.tracker", "hdfs://" + $this->hostname + ":$this->portnumber");
			if(java_last_exception_get()!=null)
				throw new Exception(java_last_exception_get());
			$phase="set job client";
			$this->dbconn=$GLOBALS['org.apache.hadoop.mapred.JobClient']->newInstance();
			if(java_last_exception_get()!=null)
				throw new Exception(java_last_exception_get());
			$phase="set job client";
			$this->dbconn->setConf($config);
			if(java_last_exception_get()!=null)
				throw new Exception(java_last_exception_get());
			$phase="get system dir";
			$this->systemDir=$this->dbconn->getSystemDir();
			if(java_last_exception_get()!=null)
				throw new Exception(java_last_exception_get());
				
			$GLOBALS["datasource"][$this->description]=$this->dbconn;
			$this->dataSource=&$GLOBALS["datasource"][$this->description];
			$this->connected = true;
		} catch (Exception $e) {
			$this->setError('????', $phase." java exception: ".$e->getMessage());
		} catch (JavaException $e) {
			$this->setError('????', $phase." java exception: ".$e->getMessage());
		}
		if($this->SQLErrorMSG!="")
			throw new Exception($this->SQLErrorMSG);
	}

	function __destruct() {
		if(isset($this->dbconn))
			if($this->dbconn!=null) 
				$this->dbconn->close();
	}
	
	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {

		if(!$GLOBALS[self::$driverLoaded])
				return self::$classDBMS." driver not load";
				
		$dataSource = new Connection_HADOOP($database, "schema" , $username, $password, $hostname, $portnumber);
		
		if(!$dataSource->connected)
			return "Connection failed: ".$dataSource->SQLErrorMSG;
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "???";//$data->DBMS_NAME;
		$returnObject['feature'] = array();
		$returnObject['DBMS'] = self::$classDBMS;;
		$returnObject['dataServerSQLConformance'] = 'Unknown';  
		$returnObject['dataServerDefaultIsolationLevel']='?'; 
		return $returnObject;
	}

	public function close() {
		// Close the connection
	}

	public function setFeatures() {
		$features=self::getBaseFeatures();
		$connectDBMS=( isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS'] : null);
		foreach(self::$features as $key => $value) {
			$features[$key]=false;
//			$result=@db2_exec($this->dbconn, $value["sql"]);
		}
		
		self::saveFeatures( $features);
	}

	public function setTrustedContextUsers($userName, $password) {}
	public function testTrustedContextUser($userName, $password) {return false;}
	public function setAutoCommit($SQLAdHoc_AutoCommit) {}
	public function commit() {}
	public function rollback() {}
	public function setSchema($schema = null) {}

	public static function getAttributes() {
		$attributes=parent::getAttributes();
		unset($attributes['usePersistentConnection']);
		unset($attributes['database']);
		$attributes['hostname']['title']='Job Tracker Host Name';
		$attributes['portnumber']['title']='Job Tracker Port';
		return $attributes;
	}
}
