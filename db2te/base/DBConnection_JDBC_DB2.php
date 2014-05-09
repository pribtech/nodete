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

require_once("jar/dbDriver.php");

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_JDBC_DB2.php');

class Connection_jdbc_DB2 extends Connection {
	public static $driverLoaded = "DB2DriverLoaded";
	public  $dataSource;
	public static $isPHPExtension = false;
	public static $requiredDBExtension = "jdbc db2";
	public static $requiredDBExtensionMinVersion = 9.5;
	public static $classDBMS = "DB2";
	public $statementClass = "Statement_jdbc_DB2";

	public static $features = array(
		 "monitor"	  => array("DBMS"=>"DB2","description"=>"WLM Monitoring"		,"sql"=>"SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'mon_act_metrics' and value <> ''")
		,"hadr"		  => array("DBMS"=>"DB2","description"=>"HADR"		    		,"sql"=>"SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'hadr_local_host' and value <> ''")
		,"asn"		  => array("DBMS"=>"DB2","description"=>"Replication"   		,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'ASN'")
		,"mq"		  => array("DBMS"=>"DB2","description"=>"MQ"            	   	,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'DB2MQ'    AND TABNAME = 'MQHOST'")
		,"optProfile" => array("DBMS"=>"DB2","description"=>"Optimization Profiles"	,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'SYSTOOLS' AND TABNAME = 'OPT_PROFILE'")
		,"TEMon"	  => array("DBMS"=>"DB2","description"=>"DB2 TE Monitoring" 	,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 's#db2mc'  AND TABNAME = 'MONITOR_CONTROL'")
		 );
		
	public static function driverCheck() {
		if(!isset($GLOBALS[self::$driverLoaded]) || ! $GLOBALS[self::$driverLoaded]) {
			self::setError( -1, (JAVA_BRIDGE_ACTIVE?"The jdbc_DB2 driver class library location not defined or found.":"PHP Java Bridge not installed"));
			return false;
		} 
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_jdbc_DB2($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = null) {
		$this->connected = false;
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
//			$url="jdbc:db2://".$hostname.":".$portnumber."/".$database.";retrieveMessagesFromServerOnGetMessage=true";
				
			$this->dataSource->setServerName($this->hostname);
			$this->dataSource->setPortNumber((int)$this->portnumber);
			$this->dataSource->setDatabaseName($this->database);
			$this->dataSource->setDriverType(4);
			$this->dataSource->setClientAccountingInformation("db2te");
			$this->dataSource->setRetrieveMessagesFromServerOnGetMessage(true);
/*
			com.ibm.db2.jcc.DB2BaseDataSource.activeServerListJNDIName 	7 String
			com.ibm.db2.jcc.DB2BaseDataSource.clientAccountingInformation 	String
			com.ibm.db2.jcc.DB2BaseDataSource.clientApplicationInformation 	String
			com.ibm.db2.jcc.DB2BaseDataSource.clientUser 	String
			com.ibm.db2.jcc.DB2BaseDataSource.clientWorkstation 	String
			com.ibm.db2.jcc.DB2BaseDataSource.cliSchema 	String
			com.ibm.db2.jcc.DB2BaseDataSource.currentFunctionPath 	7 String
			com.ibm.db2.jcc.DB2BaseDataSource.currentLockTimeout 	7 int
			com.ibm.db2.jcc.DB2BaseDataSource.currentPackagePath 	String
			com.ibm.db2.jcc.DB2BaseDataSource.cursorSensitivity 	7 int
			com.ibm.db2.jcc.DB2BaseDataSource.currentSchema 	String
			com.ibm.db2.jcc.DB2BaseDataSource.currentSQLID 	String
			com.ibm.db2.jcc.DB2BaseDataSource.currentSQLID 	String
			com.ibm.db2.jcc.DB2BaseDataSource.deferPrepares 	boolean
			com.ibm.db2.jcc.DB2BaseDataSource.description 	String
			com.ibm.db2.jcc.DB2BaseDataSource.fullyMaterializeLobData 	boolean
			com.ibm.db2.jcc.DB2BaseDataSource.gssCredential 	Object
			com.ibm.db2.jcc.DB2BaseDataSource.jdbcCollection 	String
			com.ibm.db2.jcc.DB2BaseDataSource.keepDynamic 	7 int
			com.ibm.db2.jcc.DB2BaseDataSource.kerberosServerPrincipal 	String
			com.ibm.db2.jcc.DB2BaseDataSource.logWriter 	PrintWriter
			com.ibm.db2.jcc.DB2BaseDataSource.resultSetHoldability 	int
			com.ibm.db2.jcc.DB2BaseDataSource.securityMechanism 	int
			com.ibm.db2.jcc.DB2BaseDataSource.readOnly 	boolean
			com.ibm.db2.jcc.DB2BaseDataSource.traceFile 	String
			com.ibm.db2.jcc.DB2BaseDataSource.traceLevel 	int
			com.ibm.db2.jcc.DB2BaseDataSource.user 	String
*/
//			$Properties=Java('java.util.Properties');
//			$this->connProperties = new Java('java.util.Properties');
//			$this->connProperties = $Properties->newInstance();
//			if($this->connProperties == null)
//				throw new Exception('properties error: '.java_last_exception_get());
//			$this->connProperties->put("retreiveMessagesFromServerOnGetMessage", "true");
//			$this->dbConnectionPool = $this->dataSource->getConnection($url,$username,$password);
//			$this->dbConnectionPool = $this->dataSource->getDB2TrustedPooledConnection($this->username,$this->password);
//			$this->dbConnectionPool = $this->dataSource->get2PooledConnection($username,$password,$properties);
			$this->dbConnectionPool = $this->dataSource->getPooledConnection($this->username,$this->password);
			if($this->dbConnectionPool==null)
				throw new Exception(java_last_exception_get());
			$this->dbconn = $this->dbConnectionPool->getConnection();
			if($this->dbconn==null)
				throw new Exception(java_last_exception_get());
/*
objects = ds1.getDB2TrustedPooledConnection("guard", "password", properties); 
DB2PooledConnection pooledCon = (com.ibm.db2.jcc.DB2PooledConnection)objects[0];
cookie = (byte[])objects[1];
con = pooledCon.getDB2Connection(cookie, "aUser", null, null, null, null, properties);
execSelectItems(con);
 */		
		} catch (Exception $e) {
			$this->setError( '?????', $e->getMessage());
			$this->connected = false;
			return;
		} catch (JavaException $e) {
			$this->setError( $e->getSQLState(), $e->getMessage());
			if (DEBUG_MODE_ENABLED ) {
				echo("Connection to database failed. error: ".$this->SQLErrorMSG);
			}
			$this->connected = false;
			return;
/*
					while($sqle != null) {               
				// SQLExceptions to process
				//=====> Optional DB2-only error processing
				if (sqle instanceof DB2Diagnosable) {
					com.ibm.db2.jcc.DB2Diagnosable diagnosable = (com.ibm.db2.jcc.DB2Diagnosable)sqle;                        
					java.lang.Throwable throwable = diagnosable.getThrowable();        
					if (throwable != null) {
						// Extract java.lang.Throwable information
						// such as message or stack trace.
						�
					}
				DB2Sqlca sqlca = diagnosable.getSqlca();                       
						// Get DB2Sqlca object
				if (sqlca != null) {              // Check that DB2Sqlca is not null
				int sqlCode = sqlca.getSqlCode(); // Get the SQL error code  
					String sqlErrmc = sqlca.getSqlErrmc();                     
				// Get the entire SQLERRMC
				String[] sqlErrmcTokens = sqlca.getSqlErrmcTokens();
				// You can also retrieve the
				// individual SQLERRMC tokens
				String sqlErrp = sqlca.getSqlErrp();                         
				// Get the SQLERRP
				int[] sqlErrd = sqlca.getSqlErrd();                         
				// Get SQLERRD fields
				char[] sqlWarn = sqlca.getSqlWarn();                         
				// Get SQLWARN fields
				String sqlState = sqlca.getSqlState();                       
				// Get SQLSTATE
				String errMessage = sqlca.getMessage();                      
				// Get error message
				System.err.println ("Server error message: " + errMessage);
				System.err.println ("--------------- SQLCA ---------------");
				System.err.println ("Error code: " + sqlCode);
				System.err.println ("SQLERRMC: " + sqlErrmc);
				If (sqlErrmcTokens != null) {
					for (int i=0; i< sqlErrmcTokens.length; i++) {
						System.err.println ("  token " + i + ": " + sqlErrmcTokens[i]);
					}
				}
				System.err.println ( "SQLERRP: " + sqlErrp );
				System.err.println (
				"SQLERRD(1): " + sqlErrd[0] + "\n" +
				"SQLERRD(2): " + sqlErrd[1] + "\n" +
				"SQLERRD(3): " + sqlErrd[2] + "\n" +
				"SQLERRD(4): " + sqlErrd[3] + "\n" +
				"SQLERRD(5): " + sqlErrd[4] + "\n" +
				"SQLERRD(6): " + sqlErrd[5] );
				System.err.println (
				"SQLWARN1: " + sqlWarn[0] + "\n" +
				"SQLWARN2: " + sqlWarn[1] + "\n" +
				"SQLWARN3: " + sqlWarn[2] + "\n" +
				"SQLWARN4: " + sqlWarn[3] + "\n" +
				"SQLWARN5: " + sqlWarn[4] + "\n" +
				"SQLWARN6: " + sqlWarn[5] + "\n" +
				"SQLWARN7: " + sqlWarn[6] + "\n" +
				"SQLWARN8: " + sqlWarn[7] + "\n" +
				"SQLWARN9: " + sqlWarn[8] + "\n" +
				"SQLWARNA: " + sqlWarn[9] );
				System.err.println ("SQLSTATE: " + sqlState);
								// portion of SQLException
				}
				$sqle=$sqle->getNextException();     // Retrieve next SQLException      
			}
*/
		}
		$this->connected = true;
		$this->setSchema();
	}

	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		if(!array_key_exists(self::$driverLoaded,$GLOBALS))
				return "jdbc_DB2 driver not load";
		if(trim($database) == "") 
			return "No database specified!";

		$dataSource = new Connection_JDBC_DB2($database, null , $username, $password, $hostname, $portnumber, $usePersistentConnection );
		
		if(!$dataSource->connected)
			return "Connection failed: ".$dataSource->SQLErrorMSG;
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "???";//$data->DBMS_NAME;
		try {
			try {
				$returnObject['dataServerInstance'] = $dataSource->dbConnectionPool->getDatabaseProductName();
				$returnObject['dataServerTransactionIsolation'] = $dataSource->dbConnectionPool->getDefaultTransactionIsolation();
			} catch (Exception $e) {
				$returnObject['dataServerInstance'] = "????";
				$returnObject['dataServerTransactionIsolation'] = null;
			}
			$statementJava = $dataSource->dbconn->createStatement(); 
	 		$resultSet = $statementJava->executeQuery(
	 				"SELECT INST_NAME,substr(SERVICE_LEVEL,LOCATE('v',SERVICE_LEVEL)+1,locate('.',SERVICE_LEVEL,locate('.',SERVICE_LEVEL)+1)-LOCATE('v',SERVICE_LEVEL)-1),FIXPACK_NUM FROM SYSIBMADM.ENV_INST_INFO"
	 				);
      		 $resultSet->next();
			$returnObject['dataServerVersion'] = $resultSet->getString(2);
      		 $returnObject['dataServerFixpack'] = $resultSet->getString(3);
			$statementJava = $dataSource->dbconn->createStatement();
			$resultSet = $statementJava->executeQuery(
					"SELECT value FROM SYSIBMADM.DBCFG where name='codepage'"
			);
			$resultSet->next();
			$returnObject['dataServerCodepage'] = $resultSet->getString(1);
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
/*
getDriverMajorVersion 	Yes 	Yes
getDriverMinorVersion 	Yes 	Yes
getDriverName 	Yes 	Yes
getDriverVersion 	Yes 	Yes
getExportedKeys 	Yes 	Yes
getExtraNameCharacters 	Yes 	Yes
getIdentifierQuoteString 	Yes 	Yes
getImportedKeys 	Yes 	Yes
getMaxBinaryLiteralLength 	Yes 	Yes
getMaxCatalogNameLength 	Yes 	Yes
getMaxCharLiteralLength 	Yes 	Yes
getMaxColumnNameLength 	Yes 	Yes
getMaxColumnsInGroupBy 	Yes 	Yes
getMaxColumnsInIndex 	Yes 	Yes
getMaxColumnsInOrderBy 	Yes 	Yes
getMaxColumnsInSelect 	Yes 	Yes
getMaxColumnsInTable 	Yes 	Yes
getMaxConnections 	Yes 	Yes
getMaxCursorNameLength 	Yes 	Yes
getMaxIndexLength 	Yes 	Yes
getMaxProcedureNameLength 	Yes 	Yes
getMaxRowSize 	Yes 	Yes
getMaxSchemaNameLength 	Yes 	Yes
getMaxStatementLength 	Yes 	Yes
getMaxStatements 	Yes 	Yes
getMaxTableNameLength 	Yes 	Yes
getMaxTablesInSelect 	Yes 	Yes
getMaxUserNameLength 	Yes 	Yes
getSchemaTerm 	Yes 	Yes
getSearchStringEscape 	Yes 	Yes
getSQLKeywords 	Yes 	Yes
 */		
		
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
			$this->dbConnectionPool->rollback();
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
		try{ $this->dbConnectionPool->close(); } catch (JavaException $e) {return;}
	}

	public function setFeatures() {
		$features=self::getBaseFeatures();
		$features["costEstimation"]=true;
		$connectDBMS=( isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS'] : null);
		$statementJava = $this->dbconn->createStatement(); 
		foreach(self::$features as $key => $value) {
			try {						
				$resultSet=$statementJava->executeQuery($value["sql"]);
				 $resultSet->getString(1);
				$features[$key] = $resultSet->getString(1);
			} catch (JavaException $e) {
				throw new Exception('Error Set feature '.$key.' error: '.$e->getMessage().' sql: '.$value["sql"]);
			}
		}

		$resultSet=$statementJava->executeQuery("SELECT FEATURE_NAME,FEATURE_FULLNAME FROM SYSIBMADM.ENV_FEATURE_INFO where LICENSE_INSTALLED='Y' FOR READ ONLY");

		while ( $resultSet->getString(1)) {
			$key =  $resultSet->getString(1);
			$features[$key] =   $resultSet->getString(1);
		}
		
		unset($resultSet);
		unset($statementJava);
		TE_session_start();
		$_SESSION['Connections'][USE_DATABASE_CONNECTION]['features'] = $features;
		TE_session_write_close();
		return;
	}

	public function setTrustedContextUsers($userName, $password) {return "Trusted context not available";}
	public function testTrustedContextUser($userName, $password) {return "Trusted context not available";}
}
