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
 * The Connection Class is used to create a connection to either solidDB
 * database. It supports either a direct connection to a hostname and port number
 * or a connection through an ODBC Driver Manager.
*/

/** Statement Class */
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_ODBC_SolidDB.php');
/** The Connection Class is used to create a connection to either a solidDB
 * database. It supports either a direct connection to a hostname and port number
 * or a connection through an ODBC Driver Manager. */
class Connection_ODBC_SolidDB extends Connection {

	/** Indicated the PHP extension used
	 * set to null if non is needed
	 * @var string */
	public static $requiredDBExtension = false;
	/** Indicated the PHP extension minimum version needed
	 * set to null if non is needed
	 * @var float */
	public static $requiredDBExtensionMinVersion = 1.6;
	/** Database Managment System
	 * @var float */
	public static $classDBMS = "solidDB";
	
	public $statementClass = "Statement_ODBC_SolidDB";

	public static function driverCheck() {
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_ODBC_SolidDB($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	/**
	  * Requires a database name, userid and password.
	  * If the hostname and portnumber are also included it will try to connect directly to the database.
	  * With only a database name, it will try to connect through an ODBC Driver Manager.
	*/
	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false) {
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
		$this->trustedContextEnabled = $enableTrustedContext;
       	$this->cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;

		if($this->database == "" && $this->username == "")
			return;

		$optionArray = array();

		if($this->trustedContextEnabled)
			$optionArray['trustedcontext'] = DB2_TRUSTED_CONTEXT_ENABLE;
		/** odbc_connect returns 0 if the connection attempt fails;
		  * otherwise it returns a connection ID used by other solidDB functions */

		if($this->usePersistentConnection) {
			if ($this->cataloged) {
				$this->dbconn = odbc_pconnect($this->database, $this->username, $this->password, $optionArray);
			} else {
				$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
				$this->dbconn = odbc_pconnect($connectionString, NULL, NULL, $optionArray);
			}
		} else {
			if ($this->cataloged) {
				$this->dbconn = odbc_connect($this->database, $this->username, $this->password, $optionArray);
			} else {
				$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
				$this->dbconn = odbc_connect($connectionString, NULL, NULL, $optionArray);
			}
		}

		if ($this->dbconn === false) {
			$this->setError( odbc_conn_error(), odbc_conn_errormsg());
			if (DEBUG_MODE_ENABLED && odbc_conn_errormsg() != "") {
				echo("Connection to database failed.");
				$sqlerror = $this->SQLErrorMSG;
				echo($sqlState);
			}
			$this->connected = false;
		} else {

			$time = date('y.d.m:H:i:s');

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

		if(trim($database) == "")
			return "No database specified!";
		if(trim($username) == "")
			return "No username specified!";
			
		if($usePersistentConnection){
			if ($cataloged) {
				$dbconn = odbc_pconnect($database, $username, $password);
			} else {
				$connectionString = "HOSTNAME=$hostname;DATABASE=$database;PROTOCOL=TCPIP;PORT=$portnumber;UID=$username;PWD=$password;";
				$dbconn = odbc_pconnect($connectionString, NULL, NULL);
			}
		} else {
			if ($cataloged) {
				$dbconn = @odbc_connect($database, $username, $password);
			} else {
				$connectionString = "HOSTNAME=$hostname;DATABASE=$database;PROTOCOL=TCPIP;PORT=$portnumber;UID=$username;PWD=$password;";
				$dbconn = @odbc_connect($connectionString, NULL, NULL);
			}
		}

		if ($dbconn === false) {
			$returnedError = odbc_errormsg();
			return $returnedError == "" ? "No error given. " . odbc_error() : $returnedError;
		}
		$data = "input via manual data";
		$major = 0;
		$minor = 0;
		$sub = 0;
		if($data === false)
			return false;
		$returnObject = array();
		$returnObject['DBMS'] = self::$classDBMS;;
		$returnObject['dataServerName'] = "IBM solidDB";
		
		$version = explode(".", "6.5.2");
		if($version !== false) {
			$returnObject['dataServerVersion'] = ((int)$version[0]) . "." . ((int)$version[1]);
			$returnObject['dataServerFixpack'] = ((int)$version[2]);
		}
		
		$returnObject['dataServerInstance'] = "";
		$returnObject['dataServerTransactionIsolation'] =  "CS";
		$returnObject['dataServerCodepage'] =  0;
		$returnObject['dataServerSQLConformance'] =  "FULL";
		$returnObject['dataServerDefaultIsolationLevel'] =  "CS";

		return $returnObject;
	}

	public function setTrustedContextUsers($userName, $password) {
		if(!$this->trustedContextEnabled || $this->dbconn === false) {
			$this->connected = false;
			$this->SQLErrorMSG = 'Trusted context has not been enabled.';
			$this->dbconn = false;
			return $this;
		}

		if(!odbc_get_option($this->dbconn, "trustedcontext")) {
			$this->connected = false;
			$this->SQLErrorMSG = 'Trusted context has not been enabled on this connection.';
			$this->dbconn = false;
			return $this;
		}

		if(odbc_set_option($this->dbconn, array('trusted_user' => $userName, 'trusted_password' => $password), 1)) {
			if($userName == odbc_get_option($this->dbconn, "trusted_user")) {
				$this->connected = true;
				$this->SQLErrorMSG = 'User has been switched.';
				return $this;
			}
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
			odbc_close($this->dbconn);
			$this->dbconn = false;
		}

		$cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;
		if ($cataloged) 
			$dbconn = odbc_connect($this->database, $this->username, $this->password, $ConnOpAry);
		else {
			$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
			$dbconn = odbc_connect($connectionString, NULL, NULL, $ConnOpAry);
		}

		if($dbconn === false)
			return array(false, "Could not establish database connection with trusted context enabled.\n" . odbc_conn_errormsg());

		if($this->trustedContextEnabled || !odbc_get_option($dbconn, "trustedcontext")) {
			odbc_close($dbconn);
			return array(false, 'Trusted contest has not been enabled on this connection.');
		}

		if(odbc_set_option($dbconn, array('trusted_user' => $userName, 'trusted_password' => $password), 1))
			if($userName == odbc_get_option($dbconn, "trusted_user")) {
				odbc_close($dbconn);
				return array(true, 'Trusted user is valid.');
			}
		odbc_close($dbconn);
		return array(false, 'Could not set trusted context user.');
	}

	/**
	 * Sets the autocommit
	 * @return resource
	 */
	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		return odbc_autocommit($this->dbconn, $SQLAdHoc_AutoCommit);
	}

	/**
	 * executs a commit
	 * @return resource
	 */
	public function commit() {
		return odbc_commit($this->dbconn);
	}

	/**
	 * Executs a rollback
	 * @return resource
	 */
	public function rollback() {
		return odbc_rollback($this->dbconn);
	}

	/**
	 * DG - Creates the database schema if it does not already exist.
	 */
	public function createSchema($schema) {
	
		$schema = strtoupper($schema);
		$query = "SELECT count(*) FROM SYS_SCHEMAS WHERE NAME = '$schema'";
		$rs = odbc_exec($this->dbconn, $query);

		odbc_fetch_row($rs);
		$cnt=odbc_result($rs,1);
		if($cnt == 0) {
			$query = "CREATE SCHEMA $schema";
			odbc_exec($this->dbconn, $query);
			$this->commit();
		}
	}

	/**
	 * Sets the database schema for all subsequent database requests.
	 *
	 * If the schema variable is blank the schema is set by default
	 * to the schema corresponding to the username.
	 */
	public function setSchema($schema = null) {

		$setCurrentSchema = "SET SCHEMA ";

		// this was causing a problem on the linux system, but not windows
        if($schema === null)
            return;

 		if($schema != null && $schema != "") {
			$this->createSchema($schema);
			$setCurrentSchema .= $schema;
			odbc_exec($this->dbconn, $setCurrentSchema);
		} else if ($this->schema != "") {
			$setCurrentSchema .= $this->schema;
			odbc_exec($this->dbconn, $setCurrentSchema);
		}
	}

	/**
	 * Close the database connection.
	 */
	public function close() {
		odbc_close($this->dbconn); // Close the connection
	}
	public function setFeatures() { return null;}
}
