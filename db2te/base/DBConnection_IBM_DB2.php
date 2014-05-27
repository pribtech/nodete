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

}
