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
require_once("jar/dbDriver.php");

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_JSON_NOSQL_DB2.php');

class Connection_json_NoSql_DB2 extends Connection {
	public static $driverLoaded = "jsonNoSqlDB2DriverLoaded";
	public  $dataSource;
	public static $isPHPExtension = false;
	public static $requiredDBExtension = "json NoSql db2";
	public static $requiredDBExtensionMinVersion = 0.0;
	public static $classDBMS = "JSON";
	public $statementClass = "Statement_json_NoSql_DB2";

	public static $features = array(
		 );
		
	public static function driverCheck() {
		if(self::driverOK(self::$driverLoaded)) return true;
		if(self::driverNotDefined("JAVA_DB_DRIVER_JSON_NOSQL_DB2")) return false; 
		self::setError( -1, "Connection_json_NoSql_DB2 driverCheck  was not loaded, driver location: ".JAVA_DB_DRIVER_JSON_NOSQL_DB2);
		return false;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_json_nosql_DB2($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}
	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = null) {
		$this->connected = false;
		$this->DBMS=self::$classDBMS;
		if(!@$this->driverCheck()) return;
		
		if(!$this->setDefaultConnection()) {
			$this->database = $database;
			$this->schema = $schema =! "" && $schema != null ? $schema : $username;
			$this->username = $username;
			$this->password = $password;
			$this->hostname = $hostname;
			$this->portnumber = $portnumber;
		}
		$this->description = "jsonNoSqlDB2:".$this->username. "@".$this->database.($this->hostname != "" ? "." . $this->hostname . ":" . $this->portnumber : "" );
		java_last_exception_clear();
		try {
			if($this->database == "" || $this->database==null)
				throw new Exception("No database name specified:");
			if(!isset($GLOBALS["datasource"]))
				$GLOBALS["datasource"]=array();
			if(isset($GLOBALS["datasource"][$this->description])) {
				$this->dataSource=&$GLOBALS["datasource"][$this->description];
				return;
			}
			$GLOBALS["datasource"][$this->description]=$GLOBALS["com.ibm.db2.jcc.DB2ConnectionPoolDataSource"]->newInstance();
			$this->dataSource=$GLOBALS["datasource"][$this->description];
			$this->dataSource->setServerName($this->hostname);
			$this->dataSource->setPortNumber((int)$this->portnumber);
			$this->dataSource->setDatabaseName($this->database);
			$this->dataSource->setDriverType(4);
			$this->dataSource->setClientAccountingInformation("db2te");
			$this->dataSource->setRetrieveMessagesFromServerOnGetMessage(true);
			
			$this->dbConnectionPool = $this->dataSource->getPooledConnection($this->username,$this->password);
			if($this->dbConnectionPool==null)
				throw new Exception(java_last_exception_get());
			$this->conn = $this->dbConnectionPool->getConnection();
			if($this->conn==null)
				throw new Exception(java_last_exception_get());
			try{
				$this->dbconn=$GLOBALS["com.ibm.nosql.json.api.NoSQLClient"]->getDB($this->conn);
			} catch (JavaException $e) {
				if(strripos($error, "SYSJSON_INDEX"))
					throw new Exception("json interface not installed for the schema (user)");

				throw $e;
			}

/*
			$this->dbconn=$GLOBALS["com.ibm.nosql.json.cmd.NoSqlCmdLine"]->newInstance();
			if($this->dbconn==null)
				throw new Exception("newInstance: ".java_last_exception_get());
//			$this->conn=$this->dbconn->getConnection();
//			if($this->conn==null)
//				throw new Exception("getConnection: ".java_last_exception_get());
			$this->cmdOptions=array("--url", "jdbc:db2://".$this->hostname.":".$this->portnumber."/".$this->database,"--user",$this->username,"--password",$this->password);				
			$this->dbconn->processCmdLineArgs($this->cmdOptions);
			javaTestException("processCmdLineArgs");
			$this->outputStream = new java("java.io.ByteArrayOutputStream");
			javaTestException("ByteArrayOutputStream");
			$this->printWriter = new java("java.io.PrintWriter",$this->outputStream); 
			javaTestException("printWriter");

//			$byte = $GLOBALS["java.lang.Byte"]->TYPE;
//			$byteArray = $GLOBALS["java.lang.reflect.Array"]->newInstance($byte, 255);
//			$string = $GLOBALS["java.lang.String"]->TYPE;
//			$stringArray = $GLOBALS["java.lang.reflect.Array"]->newInstance($string, 0);

			$cmd = new java("java.lang.String","db");
			javaTestException("String");
			$inputStream = new java("java.io.ByteArrayInputStream",$cmd->getBytes());
//			$inputStream = new java("java.io.ByteArrayInputStream",unpack('C*','db'));
//			javaTestException("ByteArrayInputStream");
			$this->dbconn->executeCmdLine($stringArray,$inputStream,$this->printWriter);
			error_log("test output stream: ".var_export($outputStream,true),0);
			$arr = $this->outputStream->toByteArray();
			error_log("test output arr: ".var_export($arr,true),0);
*/
		} catch (Exception $e) {
			error_log($e->getTrace());
			$this->connected = false;
			$this->setError( '?????', $e->getMessage());
			return;
		} catch (JavaException $e) {
			$this->connected = false;
			$this->setError( '?????', $e->getMessage());
			return;
		}
		$this->connected = true;
		$this->setSchema();
	}

	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		if(!self::driverOK(self::$driverLoaded))
			return self::$requiredDBExtension." driver not load";
		if(trim($database) == "") 
			return "No database specified!";

		$dataSource = new Connection_json_NoSql_DB2($database, null , $username, $password, $hostname, $portnumber, $usePersistentConnection );
		
		if(!$dataSource->connected)
			return "Connection failed: ".$dataSource->SQLErrorMSG;
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "???";//$data->DBMS_NAME;
		try {
			try {
				$returnObject['dataServerInstance'] = '?';
				$returnObject['dataServerTransactionIsolation'] = "?";
			} catch (Exception $e) {
				$returnObject['dataServerInstance'] = "????";
				$returnObject['dataServerTransactionIsolation'] = null;
			}
			
//			com.ibm.nosql.json.tools.NoSQLVersion   getProductVersion()
			
			$returnObject['dataServerVersion'] = 0;
      		 $returnObject['dataServerFixpack'] = 0;
			$returnObject['dataServerCodepage'] = null;
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
		self::saveFeatures( $features);
	}

	public function setTrustedContextUsers($userName, $password) {return "Trusted context not available";}
	public function testTrustedContextUser($userName, $password) {return "Trusted context not available";}
	public static function getAttributes() {
		$attributes=parent::getAttributes();
		unset($attributes['usePersistentConnection']);
		return $attributes;
	}
}
