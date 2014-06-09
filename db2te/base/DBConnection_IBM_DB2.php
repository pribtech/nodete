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
 * The Connection Class is used to create a connection to either a DB2, Apache Derby or Cloudscape
 * database. It supports either a direct connection to a hostname and port number
 * or a connection through a DB2 Client.
*/

/** Statement Class */
include_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
include_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_IBM_DB2.php');
/** The Connection Class is used to create a connection to either a DB2, Apache Derby or Cloudscape
 * database. It supports either a direct connection to a hostname and port number
 * or a connection through a DB2 Client. */
class Connection_IBM_DB2 extends Connection {
	 /** Indicated the PHP extension used
	 * set to null if non is needed
	 * @var string */
	public static $requiredDBExtension = "ibm_db2";
	public static $isPHPExtension = true;
	/** Indicated the PHP extension minimum version needed
	 * set to null if non is needed
	 * @var float */
	public static $requiredDBExtensionMinVersion = 1.6;
	/** Database Managment System
	 * @var float */
	public $statementClass = "Statement_IBM_DB2";
	public static $classDBMS = "DB2";

	public static $features = array(    
		 "monitor"	  => array("DBMS"=>"DB2","description"=>"WLM Monitoring"		,"sql"=>"SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'mon_act_metrics' and value <> ''")
		,"baseMonitors" => array("DBMS"=>"DB2","description"=>"Base Monitors"		,"sql"=>"SELECT 1 FROM (values(1)) where not exists(SELECT 1 FROM SYSIBMADM.DBMCFG  WHERE NAME LIKE 'dft_mon%' and Value='OFF')")
		,"hadr"		  => array("DBMS"=>"DB2","description"=>"HADR"		    		,"sql"=>"SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'hadr_local_host' and value <> ''")
		,"asn"		  => array("DBMS"=>"DB2","description"=>"Replication"   		,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'ASN'")
		,"mq"		  => array("DBMS"=>"DB2","description"=>"MQ"            	   	,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'DB2MQ'    AND TABNAME = 'MQHOST'")
		,"optProfile" => array("DBMS"=>"DB2","description"=>"Optimization Profiles"	,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'SYSTOOLS' AND TABNAME = 'OPT_PROFILE'")
		,"TEMon"	  => array("DBMS"=>"DB2","description"=>"DB2 TE Monitoring" 	,"sql"=>"SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 's#db2mc'  AND TABNAME = 'MONITOR_CONTROL'")
		 );
	
	public static function driverCheck() {
		if(ENABLE_PHP_EXTENSION_CHECK) {
			$extension_version = phpversion(Connection_IBM_DB2::$requiredDBExtension);
			if($extension_version === false) {
				self::setError( -1, "The " . Connection_IBM_DB2::$requiredDBExtension . " PHP module was not found.");
				return false;
			} elseif($extension_version < Connection_IBM_DB2::$requiredDBExtensionMinVersion) {
				self::setError( -2, "Upgrade to latest " . Connection_IBM_DB2::$requiredDBExtension . " PHP module. v" . $extension_version . " is installed a minimum of v" .Connection_IBM_DB2::$requiredDBExtensionMinVersion . "  is required.");
				return false;
			}
		}
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_IBM_DB2($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	/**
	  * Requires a database name, schema, userid and password.
	  * If the hostname and portnumber are also included it will try to connect directly to the database.
	  * With only a database name, it will try to connect through a local DB2 Client.
	*/
	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false) {
		$this->DBMS=self::$classDBMS;
		if(!@$this->driverCheck()) return;

		$usePersistentConnection = $usePersistentConnection == "" || $usePersistentConnection == null ? USE_PERSISTENT_CONNECTION : $usePersistentConnection;

		if(FORCE_CONNECTION_WITH_DEFAULT) {
			$this->database = DEFAULT_DATABASE;

			TE_session_start();
			$this->schema = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema'] : DEFAULT_DATABASE_SCHEMA;
			TE_session_write_close();

			$this->username = DEFAULT_DATABASE_USERNAME;
			$this->password = DEFAULT_DATABASE_PASSWORD;
			$this->hostname = DEFAULT_DATABASE_HOST_NAME;
			$this->portnumber = DEFAULT_DATABASE_PORT_NUMBER;
			$this->usePersistentConnection = USE_PERSISTENT_CONNECTION;
		} else {
			$this->database = $database;
			$this->schema = $schema =! "" && $schema != null ? $schema : $username;
			$this->username = $username;
			$this->password = $password;
			$this->hostname = $hostname;
			$this->portnumber = $portnumber;
			$this->usePersistentConnection = $usePersistentConnection;
		}
		$this->description = $this->username. "@".$this->database.($this->hostname != "" ? "." . $this->hostname . ":" . $this->portnumber : "" );
		
		$this->trustedContextEnabled = $enableTrustedContext;

        $this->cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;

		if($this->database == "" && $this->username == "")
			return;

		$optionArray = array();

		if($this->trustedContextEnabled)
			$optionArray['trustedcontext'] = DB2_TRUSTED_CONTEXT_ENABLE;
		/** db2_connect returns 0 if the connection attempt fails;
		  * otherwise it returns a connection ID used by other DB2 functions */

		if($this->usePersistentConnection) {
			if ($this->cataloged) {
				$this->dbconn = db2_pconnect($this->database, $this->username, $this->password, $optionArray);
			} else {
				$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
				$this->dbconn = db2_pconnect($connectionString, NULL, NULL, $optionArray);
			}
		} else {
			if ($this->cataloged) {
				$this->dbconn = db2_connect($this->database, $this->username, $this->password, $optionArray);
			} else {
				$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
				$this->dbconn = db2_connect($connectionString, NULL, NULL, $optionArray);
			}
		}

		if ($this->dbconn === false) {
			$this->setError( db2_conn_error(), db2_conn_errormsg() );
			if (DEBUG_MODE_ENABLED && db2_conn_errormsg() != "") {
				echo("Connection to database failed.");
				$sqlerror = $this->SQLErrorMSG;
				echo($sqlState);
			}
			$this->connected = false;
		} else {
            $addy = "";
            $remote_addy = "";
            if(is_array($_SERVER))
            {
                $addy =  @$_SERVER['SERVER_ADDR'];
                $remote_addy = @$_SERVER['REMOTE_ADDR'];
            }
			$time = date('y.d.m:H:i:s');
			$options = array(
					'wrkstnname' => 'TEr' . MAJOR_VERSION . "." . MINOR_VERSION . "." . SUB_VERSION . '_on_' . $username . "@" . $addy . "_FROM_" . $remote_addy . "_at_" . $time,
					'applname' => 'TEr' . MAJOR_VERSION . "." . MINOR_VERSION . "." . SUB_VERSION . '_on_' . $username . "@" . $addy . "_FROM_" . $remote_addy . "_at_" . $time
					);

			db2_set_option($this->dbconn, $options, 1);

			$this->setSchema();
			$this->connected = true;
		}
		if($this->cataloged = "") {
			$this->hostname = "LOCAL";
			$this->portnumber = "LOCAL";
		}
	}

	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {

		$usePersistentConnection = $usePersistentConnection == "" || $usePersistentConnection == null ? USE_PERSISTENT_CONNECTION : $usePersistentConnection;

		$dbconn = null;

		$cataloged = ($hostname == "" | $portnumber == "") ? true : false;
		
		if(!extension_loaded(self::$requiredDBExtension))
			return "PHP Extension ".self::$requiredDBExtension." not loaded!";
		if(trim($database) == "")
			return "No database specified!";
		if(trim($username) == "")
			return "No username specified!";
		try{	
			if($usePersistentConnection) {
				if ($cataloged) {
					$dbconn = db2_pconnect($database, $username, $password);
				} else {
					$connectionString = "HOSTNAME=$hostname;DATABASE=$database;PROTOCOL=TCPIP;PORT=$portnumber;UID=$username;PWD=$password;";
					$dbconn = db2_pconnect($connectionString, NULL, NULL);
				}
			} else {
				if ($cataloged) {
					$dbconn = db2_connect($database, $username, $password);
				} else {
					$connectionString = "HOSTNAME=$hostname;DATABASE=$database;PROTOCOL=TCPIP;PORT=$portnumber;UID=$username;PWD=$password;";
					$dbconn = db2_connect($connectionString, NULL, NULL);
				}
			}
		} catch(Exception $e) {
			return "DB2 Connection failed ".$e->getMessage();
		}

		if ($dbconn === false) {
			$returnedError = db2_conn_errormsg();
			return $returnedError == "" ? "No error given. " . db2_conn_error() : $returnedError;
		}

		$data = db2_server_info($dbconn);
		$major = 0;
		$minor = 0;
		$sub = 0;
		if($data === false)
			return false;
		$returnObject = array();
		$returnObject['dataServerName'] = $data->DBMS_NAME;
		$version = explode(".", $data->DBMS_VER);
		if($version !== false) {
			$returnObject['dataServerVersion'] = ((int)$version[0]) . "." . ((int)$version[1]);
			$returnObject['dataServerFixpack'] = ((int)$version[2]);
			$returnObject['feature'] = array();
		}
		$returnObject['DBMS'] = ($data->DBMS_NAME=="DB2"? "DB2Z":"DB2");
		$returnObject['dataServerInstance'] = $data->INST_NAME;
		$returnObject['dataServerTransactionIsolation'] =  $data->DFT_ISOLATION;
		$returnObject['dataServerCodepage'] =  $data->DB_CODEPAGE;
		$returnObject['dataServerSQLConformance'] =  $data->SQL_CONFORMANCE;
		$returnObject['dataServerDefaultIsolationLevel'] =  $data->DFT_ISOLATION;

		return $returnObject;
	}

	public function setTrustedContextUsers($userName, $password) {
		if(!$this->trustedContextEnabled || $this->dbconn === false) {
			$this->connected = false;
			$this->SQLErrorMSG = 'Trusted context has not been enabled.';
			$this->dbconn = false;
			return $this;
		}

		if(!db2_get_option($this->dbconn, "trustedcontext")) {
			$this->connected = false;
			$this->SQLErrorMSG = 'Trusted context has not been enabled on this connection.';
			$this->dbconn = false;
			return $this;
		}

		if(db2_set_option($this->dbconn, array('trusted_user' => $userName, 'trusted_password' => $password), 1))
			if($userName == db2_get_option($this->dbconn, "trusted_user")) {
				$this->connected = true;
				$this->SQLErrorMSG = 'User has been switched.';
				return $this;
			}
		$this->connected = false;
		$this->SQLErrorMSG = 'Could not set trusted context user.';
		$this->dbconn = false;
		return $this;
	}

	public function testTrustedContextUser($userName, $password) {
		$ConnOpAry = array('trustedcontext' => DB2_TRUSTED_CONTEXT_ENABLE);
		$dbconn = false;
		if($this->dbconn !== false) {
			db2_close($this->dbconn);
			$this->dbconn = false;
		}

		$cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;
		if ($cataloged) {
				$dbconn = db2_connect($this->database, $this->username, $this->password, $ConnOpAry);
		} else {
			$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
			$dbconn = db2_connect($connectionString, NULL, NULL, $ConnOpAry);
		}

		if($dbconn === false)
			return array(false, "Could not establish database connection with trusted context enabled.\n" . db2_conn_errormsg());

		if($this->trustedContextEnabled || !db2_get_option($dbconn, "trustedcontext")) {
			db2_close($dbconn);
			return array(false, 'Trusted contest has not been enabled on this connection.');
		}

		if(db2_set_option($dbconn, array('trusted_user' => $userName, 'trusted_password' => $password), 1)) 
			if($userName == db2_get_option($dbconn, "trusted_user")) {
				db2_close($dbconn);
				return array(true, 'Trusted user is valid.');
			}
		db2_close($dbconn);
		return array(false, 'Could not set trusted context user.');
	}

	/**
	 * Sets the autocommit
	 * @return resource
	 */
	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		return @db2_autocommit($this->dbconn, $SQLAdHoc_AutoCommit);
	}

	/**
	 * executs a commit
	 * @return resource
	 */
	public function commit() {
		return @db2_commit($this->dbconn);
	}

	/**
	 * Executs a rollback
	 * @return resource
	 */
	public function rollback() {
		return @db2_rollback($this->dbconn);
	}

	/**
	 * Sets the database schema for all subsequent database requests.
	 *
	 * If the schema variable is blank the schema is set by default
	 * to the schema corresponding to the username.
	 */
	public function setSchema($schema = null) {
		$setCurrentPath = "SET CURRENT PATH ";
		$setCurrentSchema = "SET CURRENT SCHEMA ";
		if($schema != null && $schema != "" && strtolower($this->schema) != strtolower($this->username)) {
			$setCurrentPath .= $schema . ", USER, SYSTEM PATH";
			$setCurrentSchema .= $schema;
			@db2_exec($this->dbconn, $setCurrentPath);
			@db2_exec($this->dbconn, $setCurrentSchema);
		} else if ($this->schema != "" && strtolower($this->schema) != strtolower($this->username)) {
			$setCurrentPath .= $this->schema . ", USER, SYSTEM PATH";
			$setCurrentSchema .= $this->schema;
			@db2_exec($this->dbconn, $setCurrentPath);
			@db2_exec($this->dbconn, $setCurrentSchema);
		}
	}

	/**
	 * Close the database connection.
	 */
	public function close() {
		db2_close($this->dbconn); // Close the connection
	}

	public function setFeatures() {
		$features=self::getBaseFeatures();
		$connectDBMS=( isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS'] : null);
		foreach(self::$features as $key => $value) {
			$features[$key]=false;
			$result=@db2_exec($this->dbconn, $value["sql"]);
			$sqlstate = db2_stmt_error();
			if($sqlstate!='00000') {
				if($sqlstate!='') {
					$sqlerror = db2_stmt_errormsg();
					throw new Exception('Error Set feature '.$key.' sqlstate: '.$sqlstate.' error: '.$sqlerror.' sql: '.$value["sql"]);
				} 
			}
			$features[$key] = @db2_fetch_row($result);	
			$sqlstate = db2_stmt_error();
		}
		
		$result=@db2_exec($this->dbconn, "SELECT FEATURE_NAME,FEATURE_FULLNAME FROM SYSIBMADM.ENV_FEATURE_INFO where LICENSE_INSTALLED='Y' FOR READ ONLY");
		while (db2_fetch_row($result)) {
    		$key = db2_result($result, 0);
			$features[$key] =  db2_result($result, 1);	
		}
		self::saveFeatures( $features);
	}
	public static function getShowPhysicalServerDetails() {  
		$serverInfo = array();
		$selectLICInfoResult = connectionManager::getNewStatement('SELECT * FROM SYSIBMADM.ENV_PROD_INFO', FALSE, FALSE);
		if ($selectLICInfoResult->execSuccessful())
		if($row = $selectLICInfoResult->fetchAssocRow()) {
			$serverLICInfo = array();
			$serverInfo['INSTALLED_PROD'] = $row['INSTALLED_PROD'];
			$serverInfo['PROD_RELEASE'] = $row['PROD_RELEASE'];
			$serverInfo['INSTALLED_PROD_FULLNAME'] = $row['INSTALLED_PROD_FULLNAME'];
			$serverInfo['LICENSE_INSTALLED'] = $row['LICENSE_INSTALLED'];
			$serverInfo['LICENSE_TYPE'] = $row['LICENSE_TYPE'];
		}
		$TempStmt = connectionManager::getNewStatement("SELECT NAME, VALUE FROM SYSIBMADM.ENV_SYS_RESOURCES", FALSE, FALSE);
		if ($TempStmt->execSuccessful())
		while($row = $TempStmt->fetch())
			$serverInfo[$row[0]] = $row[1];
		require_once(PHP_INCLUDE_BASE_DIRECTORY . 'FunctionInlineBarGraph.php');
		return makeDisplayGroup('Physical Server',
				makeDisplayContent('Operating System', $serverInfo['OS_NAME']) .
				makeDisplayContent('Operating System Version', $serverInfo['OS_VERSION']) .
				makeDisplayContent('Operating System Release', $serverInfo['OS_RELEASE']) .
				(isset($serverInfo['OS_LEVEL']) ? makeDisplayContent('Operating System Level', $serverInfo['OS_LEVEL']) : "") .
				makeDisplayContent('System Type', $serverInfo['MACHINE_IDENTIFICATION']) .
				makeDisplayContent('Processors', $serverInfo['CPU_TOTAL']) .
				makeDisplayContent('Processors Active', $serverInfo['CPU_ONLINE']) .
				makeDisplayContent('Processors Configured', $serverInfo['CPU_ONLINE']) .
				makeDisplayContent('Processors Speed', ($serverInfo['CPU_SPEED'] / 1000.0) . "GHz") .
				makeDisplayContent('Processors Pre Socket', $serverInfo['CPU_CORES_PER_SOCKET']) .
				makeDisplayContent('System Memory', number_format($serverInfo['MEMORY_TOTAL'] - $serverInfo['MEMORY_FREE']) . " MB of " . number_format($serverInfo['MEMORY_TOTAL']) . " MB", generatBar($serverInfo['MEMORY_TOTAL'] - $serverInfo['MEMORY_FREE'], $serverInfo['MEMORY_TOTAL'], "ReportGeneralBar")) .
				makeDisplayContent('System Swap', number_format($serverInfo['MEMORY_SWAP_TOTAL'] - $serverInfo['MEMORY_SWAP_FREE']) . " MB of " . number_format($serverInfo['MEMORY_SWAP_TOTAL']) . " MB", generatBar($serverInfo['MEMORY_TOTAL'] - $serverInfo['MEMORY_SWAP_FREE'], $serverInfo['MEMORY_SWAP_TOTAL'], "ReportGeneralBar")) .
				makeDisplayContent('System Virtual Memory', number_format($serverInfo['VIRTUAL_MEM_TOTAL'] - $serverInfo['VIRTUAL_MEM_FREE']) . " MB of " . number_format($serverInfo['VIRTUAL_MEM_TOTAL']) . " MB", generatBar($serverInfo['VIRTUAL_MEM_TOTAL'] - $serverInfo['VIRTUAL_MEM_FREE'], $serverInfo['VIRTUAL_MEM_TOTAL'], "ReportGeneralBar")) .
				makeDisplayContent('CPU Usage Now', generatBar($serverInfo['CPU_USAGE_TOTAL'], 100, "ReportGeneralBar")).
				(isset($serverInfo['CPU_LOAD_LONG']) ? makeDisplayContent('CPU Usage Long', generatBar($serverInfo['CPU_LOAD_LONG']*100, 100, "ReportGeneralBar")) : "").
				(isset($serverInfo['CPU_LOAD_MEDIUM']) ? makeDisplayContent('CPU Usage Medium', generatBar($serverInfo['CPU_LOAD_MEDIUM']*100, 100, "ReportGeneralBar")) : "").
				(isset($serverInfo['CPU_LOAD_SHORT']) ? makeDisplayContent('CPU Usage Short', generatBar($serverInfo['CPU_LOAD_SHORT']*100, 100, "ReportGeneralBar")) : "")
			);
	}
	public static function getShowDataServerDetails() {  
		$serverInfo = array();
		$selectLICInfoResult = connectionManager::getNewStatement('SELECT * FROM SYSIBMADM.ENV_PROD_INFO', FALSE, FALSE);
		if ($selectLICInfoResult->execSuccessful())
			if($row = $selectLICInfoResult->fetchAssocRow()){
				$serverInfo['INSTALLED_PROD'] = $row['INSTALLED_PROD'];
				$serverInfo['PROD_RELEASE'] = $row['PROD_RELEASE'];
				$serverInfo['INSTALLED_PROD_FULLNAME'] = $row['INSTALLED_PROD_FULLNAME'];
				$serverInfo['LICENSE_INSTALLED'] = $row['LICENSE_TYPE'];
			}
		$selectDBInfo = connectionManager::getNewStatement('SELECT INST_NAME, RELEASE_NUM, SERVICE_LEVEL, BLD_LEVEL, PTF, FIXPACK_NUM, INST_PTR_SIZE FROM SYSIBMADM.ENV_INST_INFO', FALSE, FALSE);
		if ($selectDBInfo->execSuccessful())
			while ($row = $selectDBInfo->fetch()) {
				$serverInfo["INST_NAME"] = $row[0];
				$serverInfo["RELEASE_NUM"] = $row[1];
				$serverInfo["SERVICE_LEVEL"] = $row[2];
				$serverInfo["BLD_LEVEL"] = $row[3];
				$serverInfo["PTF"] = $row[4];
				$serverInfo["FIXPACK_NUM"] = $row[5];
				$serverInfo["INST_PTR_SIZE"] = $row[6];
		}
		
		return makeDisplayGroup('Data Server',
				makeDisplayContent('DBMS', $dbms)
				.(
						(connectionManager::getConnection()->hostname != "" )?
						makeDisplayContent('Server', connectionManager::getConnection()->hostname) .
						makeDisplayContent('Port Number', connectionManager::getConnection()->portnumber)
						:
						makeDisplayContent('Server', "Local DB2 Client")
				)
				.makeDisplayContent("<a onclick=\"miniLinkLoader({table:'License/features',action:'list_table'}, '', '_blank')\">Product</a>", "{$serverInfo['INSTALLED_PROD']} ({$serverInfo["LICENSE_INSTALLED"]})")
				.makeDisplayContent('Instance', "{$serverInfo['INST_NAME']}, {$serverInfo['INST_PTR_SIZE']} bit")
				.makeDisplayContent('Service Level', $serverInfo['SERVICE_LEVEL'])
				.makeDisplayContent('Code Release', $serverInfo['RELEASE_NUM'])
						.makeDisplayContent('Build Level', $serverInfo['BLD_LEVEL'])
								.makeDisplayContent('Fix pack', $serverInfo['FIXPACK_NUM'])
						);
		
		
	}
	public static function getShowDatabaseDetails() {
		require_once(PHP_INCLUDE_BASE_DIRECTORY . 'FunctionInlineBarGraph.php');
		$database = strtoupper(connectionManager::getConnection()->database);
		$serverInfo = array('CURR_CONNS'=>-1,'TOTAL_LOG_AVAILABLE_KB'=>-1,'TOTAL_LOG_USED_KB'=>-1,'DB_MEMORY_USED'=>-1,'logretain'=>-1,'SIZE'=>-1);
		$ErrorsAdmin24h = 0;
		$WarningAdmin24h = 0;
		$error=array();
		$TempStmt = connectionManager::getNewStatement("SELECT * FROM SYSIBMADM.SNAPDB WHERE DB_NAME = '$database'", FALSE, FALSE);
		if ($TempStmt->execSuccessful()) {
			if($row = $TempStmt->fetchAssocRow())
			foreach($row as $key=>$value)
				$serverInfo[$key] = $value;
		} else $error[]="SYSIBMADM.SNAPDB failed, sqlcode: ".$TempStmt->sqlstate;
		
		$TempStmt = connectionManager::getNewStatement("SELECT NAME, VALUE FROM SYSIBMADM.DBCFG where NAME = 'logretain'", FALSE, FALSE);
		if ($TempStmt->execSuccessful()) {
			while($row = $TempStmt->fetchAssocRow())
				$serverInfo[$row["NAME"]] = $row["VALUE"];
		} else $error[]="SYSIBMADM.DBCFG failed, sqlcode: ".$TempStmt->sqlstate;
		
		$TempStmt = connectionManager::getNewStatement("SELECT NAME, VALUE FROM SYSIBMADM.DBMCFG where NAME = 'instance_memory'", FALSE, FALSE);
		if ($TempStmt->execSuccessful()) {
			while($row = $TempStmt->fetchAssocRow())
				$serverInfo[$row["NAME"]] = $row["VALUE"];
		} else $error[]="SYSIBMADM.DBCFG failed, sqlcode: ".$TempStmt->sqlstate;
		
		$TempStmt = connectionManager::getNewStatement("SELECT count(*) FROM TABLE(DB_PARTITIONS()) AS T");
		if ($TempStmt->execSuccessful()) {
			while($row = $TempStmt->fetchAssocRow())
				$serverInfo["DB_Partitions"] = $row[1];
		} else $error[]="DB_PARTITIONS failed, sqlcode: ".$TempStmt->sqlstate;
		
		$TempStmt = connectionManager::getNewStatement("SELECT COUNT(*) FROM SYSIBMADM.PDLOGMSGS_LAST24HOURS WHERE MSGSEVERITY = 'E'", FALSE, FALSE);
		if ($TempStmt->execSuccessful()) {
			if($row = $TempStmt->fetch())
				$ErrorsAdmin24h = $row[0];
			$TempStmt = connectionManager::getNewStatement("SELECT COUNT(*) FROM SYSIBMADM.PDLOGMSGS_LAST24HOURS WHERE MSGSEVERITY = 'W'", FALSE, FALSE);
			if ($TempStmt->execSuccessful()) {
				if($row = $TempStmt->fetch())
					$WarningAdmin24h = $row[0];
			}
		} else $error[]="SYSIBMADM.PDLOGMSGS_LAST24HOURS failed, sqlcode: ".$TempStmt->sqlstate;
		
		$selectTopConns = connectionManager::getNewStatement(
				"SELECT SUM(CONCURRENT_CONNECTION_TOP) FROM TABLE (WLM_GET_SERVICE_SUPERCLASS_STATS('', -2)) AS SERVICE_SUPERCLASS"
				, FALSE, FALSE);
		if ($selectTopConns->execSuccessful()) {
			while ($row = $selectTopConns->fetch())
				$serverInfo["TOP_CONNS"] = $row[0];
		} else $error[]="WLM_GET_SERVICE_SUPERCLASS_STATS failed, sqlcode: ".$selectTopConns->sqlstate;
		
		$selectCurrConns = connectionManager::getNewStatement(
				"SELECT COUNT(*) FROM SYSIBMADM.APPLICATIONS"
				, FALSE, FALSE);
		if ($selectCurrConns->execSuccessful()) {
			while ($row = $selectCurrConns->fetch())
				$serverInfo["CURR_CONNS"] = $row[0];
		} else $error[]="SYSIBMADM.APPLICATIONS failed, sqlcode: ".$selectCurrConns->sqlstate;
		
		$selectDBMEMInfo = connectionManager::getNewStatement("SELECT sum(pool_cur_size)/1024.0/1024.0 FROM SYSIBMADM.SNAPDB_MEMORY_POOL", FALSE, FALSE);
		if ($selectDBMEMInfo->execSuccessful()) {
			while ($row = $selectDBMEMInfo->fetch())
				$serverInfo["DB_MEMORY_USED"] = $row[0];
		} else $error[]="SYSIBMADM.SNAPDB_MEMORY_POOL failed, sqlcode: ".$selectDBMEMInfo->sqlstate;
		
		$selectLOGInfo = connectionManager::getNewStatement(
				"SELECT TOTAL_LOG_USED_KB, TOTAL_LOG_AVAILABLE_KB, TOTAL_LOG_USED_TOP_KB FROM SYSIBMADM.LOG_UTILIZATION"
				, FALSE, FALSE, TRUE);
		if ($selectLOGInfo->execSuccessful()) {
			while ($row = $selectLOGInfo->fetch()) {
				$serverInfo["TOTAL_LOG_USED_KB"] = $row[0];
				$serverInfo["TOTAL_LOG_AVAILABLE_KB"] = $row[1];
				$serverInfo["TOTAL_LOG_USED_TOP_KB"] = $row[2];
			}
		} else $error[]="SYSIBMADM.LOG_UTILIZATION failed, sqlcode: ".$selectLOGInfo->sqlstate;
		
		$parameters = array();
		
		$parameters[1]  = array('name'=>'timestamp', 'value'=>'Unknown','dataType'=>'string','type'=>'DB2_PARAM_OUT');
		$parameters[2]  = array('name'=>'size', 'value'=>'0.0','dataType'=>'float','type'=>'DB2_PARAM_OUT');
		$parameters[3]  = array('name'=>'capacity', 'value'=>'0.0','dataType'=>'float','type'=>'DB2_PARAM_OUT');
		
		$selectDBSizeInfo = connectionManager::getNewStatement("CALL GET_DBSIZE_INFO(?, ?, ?, 0)", true);
		$selectDBSizeInfo->executeStmtWithParameters($parameters);
		
		if($selectDBSizeInfo->execSuccessful()) {
			$timestamp = $selectDBSizeInfo->parameters['timestamp'];
			$size = $selectDBSizeInfo->parameters['size'];
			$size = (int)($size / 1024 /1024); // convert to MB
			$capacity = $selectDBSizeInfo->parameters['capacity'];
			$capacity = (int)($capacity / 1024 /1024); // convert to MB
		} else {
			$timestamp = "GET_DBSIZE_INFO failed";
			$size = "GET_DBSIZE_INFO failed";
			$capacity = "GET_DBSIZE_INFO failed";
		}
		
		$serverInfo["TIMESTAMP"] = $timestamp;
		$serverInfo["SIZE"] = $size;
		$serverInfo["CAPACITY"] = $capacity;
		
		$instmemtotal = isset($serverInfo["instance_memory"]) ? ($serverInfo["instance_memory"] * 4/1024) * $serverInfo["DB_Partitions"] : "";
		
		return makeDisplayGroup('Database',
		    makeDisplayContent('Name', $database) .
				makeDisplayContent('Features', connection::getFeatureList()) .
				makeDisplayContent('Status', @$serverInfo["DB_STATUS"]) .
				makeDisplayContent('Active Since', @$serverInfo["DB_CONN_TIME"]) .
				makeDisplayContent("<a onclick=\"miniLinkLoader({oper:'B',table:'dbhist',action:'list_table'}, '', '_blank')\">Last Backup</a>", (isset($serverInfo["LAST_BACKUP"]) ? $serverInfo["LAST_BACKUP"] : 'NONE')) .
				makeDisplayContent('Logging', ( strcasecmp($serverInfo["logretain"], "OFF") == 0 || strcasecmp($serverInfo["logretain"], "NO") == 0  ?
					"Circular" :
					"Archive"
				)) .
				makeDisplayContent("<a onclick=\"miniLinkLoader({table:'pdlog',action:'list_table'}, '', '_blank')\">Admin Log (Last 24h)</a>" ,  'Warnings: ' . $WarningAdmin24h . '&nbsp&nbsp&nbsp Errors: ' . $ErrorsAdmin24h) .
				makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/dbmemory',action:'list_table'}, '', '_blank')\">Memory</a>", number_format($serverInfo["DB_MEMORY_USED"]) . " MB of " . number_format($instmemtotal) . " MB", generatBar($serverInfo["DB_MEMORY_USED"], $instmemtotal, "ReportGeneralBar")) .
				($serverInfo["CAPACITY"] > 0 ?
   				makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/tbsputil',action:'list_table'}, '', '_blank')\">Size</a>", number_format($serverInfo["SIZE"]) . " MB of " . number_format($serverInfo["CAPACITY"]) . " MB", generatBar($serverInfo["SIZE"], $serverInfo["CAPACITY"], "ReportGeneralBar")) :
   				makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/tbsputil',action:'list_table'}, '', '_blank')\">Size</a>", number_format($serverInfo["SIZE"]) . " MB") ) .
				makeDisplayContent('Log', number_format($serverInfo["TOTAL_LOG_USED_KB"]/1024) . " MB of " . number_format($serverInfo["TOTAL_LOG_AVAILABLE_KB"]/1024) . " MB", generatBar($serverInfo["TOTAL_LOG_USED_KB"], $serverInfo["TOTAL_LOG_AVAILABLE_KB"], "ReportGeneralBar")) .
				makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/applicationStatus',action:'list_table'}, '', '_blank')\">Connections</a>", (isset($serverInfo["CURR_CONNS"])?number_format($serverInfo["CURR_CONNS"]):"?") . " current, " . number_format($serverInfo["TOP_CONNS"]) . " high water", generatBar($serverInfo["CURR_CONNS"], $serverInfo["TOP_CONNS"], "ReportGeneralBar")).
		   	 	( count($error)==0 ? '' : makeDisplayContent('Load Errors',implode(", ", $error)) )
			);
	}
	public static function getShowMyAuthoritiesDetails() {
		$db2ConnectedUser = connectionManager::getConnection()->username;
		$myAuthoritiesResult = connectionManager::getNewStatement(
				"SELECT AUTHORITY FROM TABLE (select authority from table(sysproc.auth_list_authorities_for_authid( CURRENT USER,'U')) where d_user = 'Y' or d_group = 'Y' or d_public = 'Y' or role_user = 'Y' or role_group = 'Y' or role_public = 'Y' or d_role = 'Y' ) AS AUTH_SUMMARY"
				, FALSE, FALSE);
		if ($myAuthoritiesResult->execSuccessful())
		while($row = $myAuthoritiesResult->fetchAssocRow())
			$myAuthorities[] = $row['AUTHORITY'];
		$fileMask = ArrayEncodeTableDefinition::ParseTableMask(new XMLNode(null, file_get_contents(TABLE_DEFINITION_DIRECTORY . 'masks/authoritiesMask.xml')));
		$contentInfo = "";
		foreach($myAuthorities as $autoritie)
			$contentInfo .= makeDisplayContent($autoritie, (isset($fileMask[$autoritie]) ? $fileMask[$autoritie]['mask'] : ""));
		return makeDisplayGroup('Authorities for ' . $db2ConnectedUser, $contentInfo);
	}
}
