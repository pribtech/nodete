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
require_once("jar/mq.php");

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_MQ.php');

class Connection_mq extends Connection {
	public static $driverLoaded = "mqLoader";
	public  $dataSource;
	public static $isPHPExtension = false;
	public static $requiredDBExtension = "mq";
	public static $requiredDBExtensionMinVersion = 7.0;
	public static $classDBMS = "MQ";
	public $statementClass = "Statement_MQ";

	public static $features = array(
		 );
		
	public static function driverCheck() {
		if(isset($GLOBALS[self::$driverLoaded])) 
			return true;
		self::setError( -1, (JAVA_BRIDGE_ACTIVE?"The MQ driver class library location not defined or found.":"PHP Java Bridge not installed"));
		return false;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_mq($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}
	public function __construct($queueManager, $channel='SYSTEM.DEF.SVRCONN', $username=null, $password=null, $hostname='localhost', $portnumber='1414') {
		$this->connected = false;
		$this->DBMS=self::$classDBMS;
		if(!@$this->driverCheck()) return;

		$this->description = $username."@". $queueManager.':'.$channel.".".$hostname.":". $portnumber;
		$this->queueManager = $queueManager;
		$this->username = $username;
		$this->password = $password;
		$this->hostname = $hostname;
		$this->portnumber = $portnumber;
		$this->channel = ($channel==""?'SYSTEM.DEF.SVRCONN':$channel);
		
		$this->connected = false;
		try {
			java_throw_exceptions(true);
			if($this->queueManager == "" || $this->queueManager==null)
				throw new Exception("No queue manager name specified:");
			if(!isset($GLOBALS["datasource"]))
				$GLOBALS["datasource"]=array();
			if(isset($GLOBALS["datasource"][$this->description])) {
				$this->dataSource=&$GLOBALS["datasource"][$this->description];
				$this->dbconn=$this->dataSource;
				$this->connected = false;
				return;
			}
			java_last_exception_clear();
			$this->dbconn=$GLOBALS['mq.MqWrapper']->newInstance();
			if(java_last_exception_get()!=null) 
				throw new Exception('Connection failed, error loading instance: '.java_last_exception_get());
			if ($this->dbconn==null)
				throw new Exception('Connection failed: instance is null');
			java_last_exception_clear();
			$this->dbconn->connectTo($this->username."/".$this->password."@".$this->hostname.":".$this->portnumber."/".$this->queueManager.":".$this->channel);
			if(java_last_exception_get()!=null)
				throw new Exception('Connection failed: '.java_last_exception_get());
			$GLOBALS["datasource"][$this->description]=$this->dbconn;
			$this->dataSource=&$GLOBALS["datasource"][$this->description];
			$this->connected = true;
		} catch (Exception $e) {
			$this->setError('?????', $e->getMessage());
			return;
		} catch (JavaException $e) {
			$this->setError('?????', $e->getMessage());
			return;
		}
	}

	public static function testConnection($queueManagerSlashChannel, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		
		if(!$GLOBALS[self::$driverLoaded])
				return "mq driver not load";
		if(trim($queueManagerSlashChannel) == "") 
			return "No queue manager (and channel) specified!";

		$target = explode("/", $queueManagerSlashChannel);
		
		$dataSource = new Connection_mq($target[0], (count($target)>1?$target[1]:null) , $username, $password, $hostname, $portnumber);
		
		if(!$dataSource->connected)
			return "Connection failed: ".$dataSource->SQLErrorMSG;
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "???";//$data->DBMS_NAME;
		try {
		} catch (Exception $e) {
			return $e->getMessage();
		} catch (JavaException $e) {
			return $e->getMessage();
		}
		$returnObject['feature'] = array();
		$returnObject['DBMS'] = self::$classDBMS;;
		$returnObject['dataServerSQLConformance'] = 'Unknown'; 
		$returnObject['dataServerDefaultIsolationLevel'] = '?';
		return $returnObject;
	}

	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		return true;
	}

	public function commit() {
		return true;
	}

	public function rollback() {
		return false;
	}

	public function setSchema($schema = null) {
	}

	public function close() {
	}

	public function setFeatures() {
		$features=self::getBaseFeatures();
/*
		$connectDBMS=( isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS'] : null);
//		$statementJava = $this->dbconn->createStatement(); 
		foreach(self::$features as $key => $value) {
			try {						
//				$resultSet=$statementJava->executeQuery($value["sql"]);
//				 $resultSet->getString(1);
//				$features[$key] = $resultSet->getString(1);
			} catch (JavaException $e) {
				throw new Exception('Error Set feature '.$key.' error: '.$e->getMessage().' sql: '.$value["sql"]);
			}
		}

		unset($resultSet);
		unset($statementJava);
*/
		self::saveFeatures( $features);
	}

	public function setTrustedContextUsers($userName, $password) {return "Trusted context not available";}
	public function testTrustedContextUser($userName, $password) {return "Trusted context not available";}
	public static function getAttributes() {
		$attributes=parent::getAttributes();
		unset($attributes['usePersistentConnection']);
		$attributes['database']['title']='Queue Manager';
		return $attributes;
	}
}
