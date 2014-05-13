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
 * The Connection Class is used to create a connection to either a mysql, Apache Derby or Cloudscape
 * database. It supports either a direct connection to a hostname and port number
 * or a connection through a mysql Client.
*/

/** Statement Class */
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_MYSQL.php');
/** The Connection Class is used to create a connection to either a mysql, Apache Derby or Cloudscape
 * database. It supports either a direct connection to a hostname and port number
 * or a connection through a mysql Client. */
class Connection_MYSQL extends Connection {
	public static $requiredDBExtension = "mysqli";
	public static $isPHPExtension = true;
	public static $requiredDBExtensionMinVersion = null;
	public $DBMS = "MYSQL";
	public $statementClass = "Statement_MYSQL";

	public static function driverCheck() {
		if(ENABLE_PHP_EXTENSION_CHECK) {
			$extension_version = phpversion(Connection_MYSQL::$requiredDBExtension);
			if($extension_version === false) {
				self::setError( -1, "The " . Connection_MYSQL::$requiredDBExtension . " PHP module was not found.");
				return false;
			} elseif($extension_version < Connection_MYSQL::$requiredDBExtensionMinVersion) {
				self::setError( -2, "Upgrade to latest " . Connection_MYSQL::$requiredDBExtension . " PHP module. v" . $extension_version . " is installed a minimum of v" .Connection_MYSQL::$requiredDBExtensionMinVersion . "  is required.");
				return false;
			}
		}
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_MYSQL($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	/**
	  * Requires a database name, schema, userid and password.
	  * If the hostname and portnumber are also included it will try to connect directly to the database.
	  * With only a database name, it will try to connect through a local mysql Client.
	*/
	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false) {
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

		$this->trustedContextEnabled = false;//$enableTrustedContext;

        if(trim($this->description) == "@")
            $this->description = "";

        $this->cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;

		if($this->database == "" && $this->username == "")
			return;

		$optionArray = array();
		$optionArray['trustedcontext'] = false;  // Unsupported!

		/** mysqli_connect returns 0 if the connection attempt fails;
		  * otherwise it returns a connection ID used by other mysql functions */
		/*
		Unlike the mysql extension, 
		mysqli does not provide a separate function for opening persistent connections. 
		To open a persistent connection you must prepend p: to the hostname when connecting.
		
		Source: http://ca3.php.net/manual/en/mysqli.persistconns.php
		*/
		$this->dbconn = mysqli_connect("$this->hostname", "$this->username", "$this->password", "$this->database", $this->portnumber);

		if ($this->dbconn === false) {
			$this->setError( mysqli_connect_errno(), mysqli_connect_error());
			if (DEBUG_MODE_ENABLED && mysqli_connect_error() != "")
				error_log("MYSQL Connection to database failed, sql message:".$this->SQLErrorMSG,0);
			$this->connected = false;
		} else {
			$time = date('y.d.m:H:i:s');
			$this->setSchema($this->database, $this->dbconn);
			$this->connected = true;
		}
		if($this->cataloged = "") {
			$this->hostname = "localhost";
			$this->portnumber = 3306;
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
			
		$dbconn = mysqli_connect(($usePersistentConnection?"p:":"")."$hostname", "$username", "$password", "$database", "$portnumber");

		if ($dbconn === false) {
			$returnedError = mysqli_connect_error();
			return $returnedError == "" ? "No error given. " . mysqli_connect_errno() : $returnedError;
		}

		$serverdata = mysqli_get_server_info($dbconn);
		$major = 0;
		$minor = 0;
		$sub = 0;
		if($serverdata === false)
			return false;

		str_ireplace(" ",".",$serverdata);
		$version = explode(".", $serverdata);

		$returnObject = array();
		if($version !== false) {
			$returnObject['dataServerVersion'] = ((int)$version[0]) . "." . ((int)$version[1]);
			$returnObject['dataServerFixpack'] = ((int)$version[2]);
		}
		$returnObject['DBMS'] = 'MYSQL';
		return $returnObject;
	}

	public function setTrustedContextUsers($userName, $password) {
		$this->connected = false;
		$this->SQLErrorMSG = 'Trusted context user not supported.';
		$this->dbconn = false;
		return $this;
	}

	public function testTrustedContextUser($userName, $password) {
		/*$ConnOpAry = array('trustedcontext' => mysql_TRUSTED_CONTEXT_ENABLE);
		$dbconn = false;
		if($this->dbconn !== false) {
			mysqli_close($this->dbconn);
			$this->dbconn = false;
		}

		$cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;
		if ($cataloged) {
				$dbconn = mysqli_pconnect($this->database, $this->username, $this->password, $ConnOpAry);
		} else {
			$connectionString = "HOSTNAME=$this->hostname;DATABASE=$this->database;PROTOCOL=TCPIP;PORT=$this->portnumber;UID=$this->username;PWD=$this->password;";
			$dbconn = mysqli_pconnect($connectionString, NULL, NULL, $ConnOpAry);
		}

		if($dbconn === false)
			return array(false, "Could not establish database connection with trusted context enabled.\n" . mysqli_connect_error());

		if($this->trustedContextEnabled || !db2_get_option($dbconn, "trustedcontext")) {
			mysqli_close($dbconn);
			return array(false, 'Trusted contest has not been enabled on this connection.');
		}

		if(mysql_set_option($dbconn, array('trusted_user' => $userName, 'trusted_password' => $password), 1)) {
			if($userName == db2_get_option($dbconn, "trusted_user")) {
				mysqli_close($dbconn);
				return array(true, 'Trusted user is valid.');
			}
		}
		mysqli_close($dbconn);
		*/
		return array(false, 'Trusted context user unsupported.');
	}

	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		return @mysqli_autocommit($this->dbconn, $SQLAdHoc_AutoCommit);
	}
	public function commit() {
		return @mysqli_commit($this->dbconn);
	}
	public function rollback() {
		return @mysqli_rollback($this->dbconn);
	}

	/**
	 * Sets the database schema for all subsequent database requests.
	 *
	 * If the schema variable is blank the schema is set by default
	 * to the schema corresponding to the username.
	 */
	public function setSchema($schema = null) {
		if($schema != null && $schema != "")// && strtolower($this->schema) != strtolower($this->username))
			@mysqli_select_db($this->dbconn, $schema);
	}

	/**
	 * Close the database connection.
	 */
	public function close() {
		@mysqli_close($this->dbconn); // Close the connection
	}
}
