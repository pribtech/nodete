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
if ( !defined('__DIR__') ) define('__DIR__', dirname(__FILE__));

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_PostgreSQL.php');

function handleError($errno, $errstr, $errfile, $errline, array $errcontext) {
    // error was suppressed with the @-operator
    if (0 === error_reporting()) 
        return false;
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}
 class Connection_PostgreSQL extends Connection {
	public static $requiredDBExtension = "pgsql";
	public static $requiredDBExtensionMinVersion = 8.3;
	public static $classDBMS = "postgreSQL";
	public $statementClass = "Statement_PostgreSQL";
	public static $features = array(
		);	
	public static function driverCheck() {
		if(ENABLE_PHP_EXTENSION_CHECK) {
			$extension_version = phpversion(Connection_PostgreSQL::$requiredDBExtension);
			if($extension_version === false) {
				foreach (get_loaded_extensions() as $i => $ext)
					if($ext==self::$requiredDBExtension) return true;
				self::setError( -1, "The " . Connection_PostgreSQL::$requiredDBExtension . " PHP module version not determined.");
				return false;
			}
			if($extension_version < Connection_PostgreSQL::$requiredDBExtensionMinVersion) {
				self::setError( -2, "Upgrade to latest " . Connection_PostgreSQL::$requiredDBExtension . " PHP module. v" . $extension_version . " is installed a minimum of v" .Connection_MYSQL::$requiredDBExtensionMinVersion . "  is required.");
				return false;
			}
		}
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_PostgreSQL($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}
	
	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false) {
		$this->DBMS=self::$classDBMS;
//		if(!@$this->driverCheck()) return;

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
        $this->cataloged = ($this->hostname == "" | $this->portnumber == "") ? true : false;

		if($this->database == "" && $this->username == "")
			return;

		$optionArray = array();
		
		if($this->usePersistentConnection) {
			if ($this->cataloged) {
				$connectionString = "dbname={$this->database} user={$this->username} password={$this->password}"; //not sure about what to do with PROTOCOL
				$this->dbconn = @pg_pconnect($connectionString);
			} else {
				$connectionString = "host={$this->hostname} dbname={$this->database} port={$this->portnumber} user={$this->username} password={$this->password}";
				$this->dbconn = @pg_pconnect($connectionString); 
			}
		} else {
			if ($this->cataloged) {
				$connectionString = "dbname={$this->database} user={$this->username} password={$this->password}"; //not sure about what to do with PROTOCOL
				$this->dbconn = @pg_connect($connectionString);
			} else {
				$connectionString = "host={$this->hostname} dbname={$this->database} port={$this->portnumber} user={$this->username} password={$this->password}";
				$this->dbconn = @pg_connect($connectionString); 
			}
		}

		$error = error_get_last();
		if($error !== null)
			return $error['message'];

		if ($this->dbconn === false) {
			$dbConnResult = pg_get_result($this->dbconn);
			$this->SQLState = pg_result_error_field($dbConnResult, PGSQL_DIAG_SQLSTATE);
			$this->SQLErrorMSG = pg_result_error($this->dbconn);
			if (DEBUG_MODE_ENABLED && pg_result_error($this->dbconn) != "") {
				echo("Connection to database failed.");
				$sqlerror = $this->SQLErrorMSG;
				echo($sqlState);
			}
			$this->connected = false;
		} else {
            $addy = "";
            $remote_addy = "";
            if(is_array($_SERVER)) {
                $addy =  @$_SERVER['SERVER_ADDR'];
                $remote_addy = @$_SERVER['REMOTE_ADDR'];
            }
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
			
		if($usePersistentConnection) {
			if ($cataloged) {
				$connectionString = "dbname={$database} user={$username} password={$password}"; //not sure about what to do with PROTOCOL
				$dbconn = @pg_pconnect($connectionString);
			} else {
				$connectionString = "host={$hostname} dbname={$database} port={$portnumber} user={$username} password={$password}";
				$dbconn = @pg_pconnect($connectionString); 
			}
		} else {
			if ($cataloged) {
				$connectionString = "dbname={$database} user={$username} password={$password}"; //not sure about what to do with PROTOCOL
				$dbconn = @pg_connect($connectionString);
			} else {
				$connectionString = "host={$hostname} dbname={$database}  port={$portnumber} user={$username} password={$password}";
				$dbconn = @pg_connect($connectionString); 
			}
		}
		
		$error = error_get_last();
		if ($dbconn === false)
			return $error['message'];

		$data = pg_version($dbconn);
		$major = 0;
		$minor = 0;
		$sub = 0;
		if($data === false)
			return false;
		$returnObject = array();
		
		$version = explode(".", $data['server']);
		if($version !== false) {
			$returnObject['dataServerVersion'] = ((int)$version[0]) . "." . ((int)$version[1]);
			$returnObject['dataServerFixpack'] = ((int)$version[2]);
		}
		//need to test out data['protocol'] and data['server']
		$returnObject['DBMS'] = self::$classDBMS;

		return $returnObject;
	}
	
	public function setTrustedContextUsers($userName, $password) {
	}
	
	public function testTrustedContextUser($userName, $password) {
	}
	
	/* NO PostgreSQL equivalent in PHP. */
	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		return TRUE;
	}
	
	/* NO PostgreSQL equivalent in PHP. */
	public function commit() {
	}
	
	/* NO PostgreSQL equivalent in PHP. */
	public function rollback() {
	}
	
	public function setSchema($schema = null) {
		$setCurrentPath = "SET SEARCH PATH "; 
		$setCurrentSchema = "SET CURRENT SCHEMA ";
		if($schema != null && $schema != "" && strtolower($this->schema) != strtolower($this->username)) {
			$setCurrentPath .= $schema . ", USER, SYSTEM PATH";
			$setCurrentSchema .= $schema;
			pg_query($setCurrentPath);
			pg_query($setCurrentSchema);
		} else if ($this->schema != "" && strtolower($this->schema) != strtolower($this->username)) {
			$setCurrentPath .= $this->schema . ", USER, SYSTEM PATH";
			$setCurrentSchema .= $this->schema;
			pg_query($setCurrentPath);
			pg_query($setCurrentSchema);
		}
	}
	
	public function setDescription($description) {
		$this->description = $description;
		TE_session_start();
		$_SESSION['Connections'][USE_DATABASE_CONNECTION]['description'] = $description;
		TE_session_write_close();
	}

	/**
	 * Close the database connection.
	 */
	public function close() {
		pg_close($this->dbconn); // Close the connection
	}
 	public static function getXMLDefColumnsTable() {
		return "(SELECT table_schema as TABSCHEMA ,TABLE_NAME AS TABNAME ,COLUMN_NAME AS COLNAME ,DATA_TYPE AS TYPENAME ,ordinal_position AS COLNO, udt_schema,udt_name FROM information_schema.columns)";
	}
	public static function getXMLserializeDocument() {return "DOCUMENT";}
	public static function getXMLDefSerializeReturnType() {return "VARCHAR";}
 }



