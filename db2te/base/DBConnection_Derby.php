<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.
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
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_Derby.php');

class Connection_DERBY extends Connection {
	public static $driverLoaded = "DerbyDriverLoaded";
	public static $dataSource = "derbyDataSource";
	public static $isPHPExtension = false;
	public static $requiredDBExtension = "Derby";
	public static $requiredDBExtensionMinVersion = 10.1;
	public static $classDBMS = "DERBY";
	public $statementClass = "Statement_Derby";

	public static $features = array(
		 "defaultConnectionMode"	=> array("DBMS"=>"DERBY","description"=>"defaultConnectionMode","sql"=>"VALUES(SYSCS_UTIL.SYSCS_GET_DATABASE_PROPERTY('derby.database.defaultConnectionMode'))")
		 );
	public static function driverCheck() {
		if(!isset($GLOBALS[self::$driverLoaded])) {
			self::setError( -1, (JAVA_BRIDGE_ACTIVE?"The Derby driver class library location not defined or found.":"PHP Java Bridge not installed"));
			return false;
		} 
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_Derby($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		$this->DBMS=self::$classDBMS;
		if(!@$this->driverCheck()) return;

		$usePersistentConnection = $usePersistentConnection == "" || $usePersistentConnection == null ? USE_PERSISTENT_CONNECTION : $usePersistentConnection;

		if(!$this->setDefaultConnection()) {
			$this->database = $database;
			$this->schema = $schema =! "" && $schema != null ? $schema : $username;
			$this->username = $username;
			$this->password = $password;
			$this->hostname = $hostname;
			$this->portnumber = $portnumber;
			$this->usePersistentConnection = $usePersistentConnection;
		}
		$this->description = $this->username. "@".$this->database.($this->hostname != "" ? "." . $this->hostname . ":" . $this->portnumber : "" );
		
		if($this->database == "")  return;

        java_last_exception_clear();
		try {
			$this->dataSource=&$GLOBALS[self::dataSource];
			$this->dataSource->setServerName($hostname);
			$this->dataSource->setPortNumber((int)$portnumber);
			$this->dataSource->setDatabaseName($database);
//			$this->dataSource->setConnectionAttributes($options); 
//			$this->dataSource->setSecurityMechanism(??);
//			$this->dataSource->setDataSourceName(??);
//			$this->dataSource->setShutdownDatabase('shutdown');
//			$this->dataSource->setSsl(off, basic or peerAuthentication);
//			$this->dataSource->setTraceLevel(??);
//			$this->dataSource->setTraceFile(???);
//			$this->dataSource->setTraceDirectory(??);
//			$this->dataSource->setTraceFileAppend(true/false)
//			$this->dataSource->setPassword(java.lang.String password) 
//			$this->dataSource->setUser(java.lang.String user) 
			$this->dataSource->setDescription($this->description); 
			$this->dataSource->setLoginTimeout(20);
			$this->dataSource->setRetrieveMessageText(true);
			if($username==null)
				$this->dbconn = $this->dataSource->getConnection();
			else
				$this->dbconn = $this->dataSource->getConnection($username,$password);
		} catch (JavaException $e) {
			$this->setError( '????', $e->getMessage());
			if (DEBUG_MODE_ENABLED ) {
				echo("Connection to database failed.");
				echo($this->SQLErrorMSG);
			}
			$this->connected = false;
			return;
		} 
		$this->setSchema();
		$this->connected = true;
	}

	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		if(!$GLOBALS[self::$driverLoaded])
				return "Derby driver not load";
		if(trim($database) == "") 
			return "No database specified!";

		$usePersistentConnection = $usePersistentConnection == "" || $usePersistentConnection == null ? USE_PERSISTENT_CONNECTION : $usePersistentConnection;
		$dbconn = null;
		java_last_exception_clear();
		try {
			$dataSource=$GLOBALS[self::$dataSource];
			$dataSource->setServerName($hostname);
			$dataSource->setPortNumber((int)$portnumber);
			$dataSource->setDatabaseName($database);
			if($username==null)
				$dbconn = $dataSource->getConnection();
			else
				$dbconn = $dataSource->getConnection($username,$password);
		} catch (JavaException $e) {
			return $e->getMessage();
		} catch (Exception $e) {
			return $e;
		}
		if(!$dbconn)
			return "Connection failed for Derby: ".java_last_exception_get();
/*
} catch (SQLException se ) {
        String SQLState = se.getSQLState();
} 
*/		
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "test";//$data->DBMS_NAME;
		try {
			$dbmd = $dbconn->getMetaData();
			$returnObject['dataServerVersion'] = $dbmd->getDatabaseProductVersion();
			$returnObject['dataServerInstance'] = "unknown ".$dbmd->getDatabaseProductName();;
			$returnObject['dataServerTransactionIsolation'] = $dbmd->getDefaultTransactionIsolation();
			$statementJava = $dbconn->createStatement(); 
	 		$resultSet = $statementJava->executeQuery(
    	        "VALUES(SYSCS_UTIL.SYSCS_GET_DATABASE_PROPERTY('derby.system.home')"
    	        	 .",SYSCS_UTIL.SYSCS_GET_DATABASE_PROPERTY('derby.territory'))");
       		 $resultSet->next();
			$returnObject['dataServerInstance'] = $resultSet->getString(1);
			$returnObject['dataServerCodepage'] = $resultSet->getString(2);
		} catch (JavaException $e) {
			return $e->getMessage();
		}
		$returnObject['dataServerFixpack'] = 'Unknown';
		$returnObject['feature'] = array();
		$returnObject['DBMS'] = self::$classDBMS;;
/*
Connection.TRANSACTION_READ_UNCOMMITTED (ANSI level 0) 	UR, DIRTY READ, READ UNCOMMITTED
Connection.TRANSACTION_READ_COMMITTED (ANSI level 1) 	CS, CURSOR STABILITY, READ COMMITTED
Connection.TRANSACTION_REPEATABLE_READ (ANSI level 2) 	RS
Connection.TRANSACTION_SERIALIZABLE (ANSI level 3) 

*/
		$returnObject['dataServerCodepage'] = 'Unknown'; //
		$returnObject['dataServerSQLConformance'] = 'Unknown';  
		$returnObject['dataServerDefaultIsolationLevel'] ='Unknown'; 
		return $returnObject;
	}

	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		try {
			$this->dbconn->setAutocommit($SQLAdHoc_AutoCommit);
		} catch (JavaException $e) {
			$this->setError( '???', $e->getMessage());
			$this->connected = false;
			return false;
		} 
		return true;
	}

	public function commit() {
		try {
			$this->dbconn->commit();
		} catch (JavaException $e) {
			$this->setError( '???', $e->getMessage());
			return false;
		}
		return true;
	}

	public function rollback() {
		try {
			$this->dbconn->rollback();
		} catch (JavaException $e) {
			$this->setError( '???', $e->getMessage());
			return false;
		}
		return true;
	}

	public function setSchema($schema = null) {
		if($schema == null || $schema == "" )
			$schema=$this->schema;
		if($schema == null || $schema == "" || strtolower($this->schema) == strtolower($this->username))
			return;
		try {
			$this->dbconn->executeQuery("SET CURRENT PATH ".$schema);
			$this->dbconn->executeQuery("SET CURRENT SCHEMA  ".$schema);
		} catch (JavaException $e) {
			$this->setError( '???', $e->getMessage());
			return false;
		}
	}

	public function close() {
		try{ $this->dbconn->close(); } catch (JavaException $e) {return;}
	}

	public function setFeatures() {
		$features=self::getBaseFeatures();
		$connectDBMS=( isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS'] : null);
		$statementJava = $this->dbconn->createStatement(); 
		foreach(self::$features as $key => $value) {
			if($value["DBMS"]!=$connectDBMS) continue;
			try {						
				$resultSet=$statementJava->executeQuery($value["sql"]);
				$resultSet->next();
				$features[$key] = $resultSet->getString(1);
			} catch (JavaException $e) {
				throw new Exception('Error Set feature '.$key.' error: '.$e->getMessage().' sql: '.$value["sql"]);
			}
		}
		unset($resultSet);
		unset($statementJava);
		self::saveFeatures( $features);
	}

	public function setTrustedContextUsers($userName, $password) {return "Trusted context not available";}
	public function testTrustedContextUser($userName, $password) {return "Trusted context not available";}
}
