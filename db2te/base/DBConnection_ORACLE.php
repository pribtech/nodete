<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011-2012 All rights reserved.
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

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_ORACLE.php');

class Connection_ORACLE extends Connection {
	public static $requiredDBExtension = "oci8";
	public static $isPHPExtension = true;
	public static $requiredDBExtensionMinVersion = 1.4;
	public static $classDBMS = "ORACLE";
	public $statementClass = "Statement_ORACLE";

	public static $features = array(
		 );
	public static function driverCheck() {
		if(ENABLE_PHP_EXTENSION_CHECK) {
			$extension_version = phpversion(Connection_ORACLE::$requiredDBExtension);
			if($extension_version === false) {
				self::setError( -1, "The " . Connection_ORACLE::$requiredDBExtension . " PHP module was not found.");
				return false;
			}
			if($extension_version < Connection_ORACLE::$requiredDBExtensionMinVersion) {
				self::setError( -2, "Upgrade to latest " . Connection_ORACLE::$requiredDBExtension . " PHP module. v" . $extension_version . " is installed a minimum of v" .Connection_MYSQL::$requiredDBExtensionMinVersion . "  is required.");
				return false;
			}
		}
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_ORACLE($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

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
		if($this->database == "")  return;
		$this->description = $this->username. "@".$this->database.($this->hostname != "" ? "." . $this->hostname . ":" . $this->portnumber : "" );
		
		$this->dbconn = @oci_connect($username,$password, '//'.$hostname.':'.$portnumber.'/'.$database);
		if(self::isError($this->dbconn))
			return;
		
		$this->connected = ($this->setSchema()===false);
	}

	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		if(trim($database) == "") 
			return "No database specified!";

		$usePersistentConnection = $usePersistentConnection == "" || $usePersistentConnection == null ? USE_PERSISTENT_CONNECTION : $usePersistentConnection;

		$dbconn = @oci_connect($username,$password, '//'.$hostname.':'.$portnumber.'/'.$database);
		if (!$dbconn) {
			 $e = @oci_error();
    		 return htmlentities($e['message'], ENT_QUOTES);
    	}
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "unknown";//$data->DBMS_NAME;
		$returnObject['dataServerVersion'] = @oci_server_version($dbconn);
		$returnObject['dataServerFixpack'] = 'Unknown';
		$returnObject['feature'] = array();
		$returnObject['DBMS'] = self::$classDBMS;;
		$returnObject['dataServerInstance'] = 'Unknown'; 
		$returnObject['dataServerTransactionIsolation'] = 'Unknown'; 
		$returnObject['dataServerCodepage'] = 'Unknown'; 
		$returnObject['dataServerSQLConformance'] = 'Unknown';  
		$returnObject['dataServerDefaultIsolationLevel'] ='Unknown';
		return $returnObject;
	}

	public function setAutoCommit($SQLAdHoc_AutoCommit) {
		//set value OCI_NO_AUTO_COMMIT
		return true;
	}

	public function commit() {
		if (!@oci_commit($this->dbconn)) 
			if(isError($this->dbconn)) return false;
		return true;
	}

	public function rollback() {
		if($this->dbconn===false) return false;
		return @oci_rollback($this->dbconn); 
	}

	public function setSchema($schema = null) {
		if($schema == null || $schema == "" )
			$schema=$this->schema;
		if($schema == null || $schema == "" || strtolower($this->schema) == strtolower($this->username))
			return;
		if($this->dbconn == null) {
			$this->setError( '99999', 'Connection set schema, no connection');
			return false;
		}
		$stid = @oci_parse($this->dbconn,"SET CURRENT PATH ".$schema);
		if(self::isError($stid)) return false;
		@oci_execute($stid);
		if(self::isError($stid)) return false;
		$stid = @oci_parse($this->dbconn,"SET CURRENT SCHEMA  ".$schema);
		if(self::isError($stid)) return false;
		@oci_execute($stid);
		if(self::isError($stid)) return false;
		return;
	}

	public function isError($resource) {
	  	if($resource) return false;
	    $e = @oci_error($resource); 
		$this->setError( $e['code'], htmlentities($e['message']));
		$this->statementSucceed = false;
		return true;
	}

	public function close() {
		@oci_close($this->dbconn);
	}

	public function setTrustedContextUsers($userName, $password) {return "Trusted context not available";}
	
	public function testTrustedContextUser($userName, $password) {return "Trusted context not available";}
	
	public function getXMLDefSqlName() {
		return "if (\$type = \"MGW_BASIC_MSG_T\") then fn:concat(''\"'',\$table,''\".\"'',\$c/column/text(),''\".text_body.small_value'')
			    else if (\$type = \"RAW\") then fn:concat(''RAWTONHEX('',\$c/column/text(),'')'')
			    else if (\$type = \"INTERVAL DAY(3) TO SECOND(0)\" or \$type = \"INTERVAL DAY(3) TO SECOND(2)\"
			    	  or \$type = \"INTERVAL DAY(5) TO SECOND(1)\" or \$type = \"INTERVAL DAY(9) TO SECOND(6)\" or \$type = \"INTERVAL DAY(9) TO SECOND(9)\"
			    	  or \$type = \"LONG\" or \$type = \"NCHAR\" 
			    	  or \$type = \"NCLOB\" or \$type = \"NVARCHAR2\" or \$type = \"ROWID\" or \$type = \"VARCHAR2\" or \$type = \"XMLTYPE\" 
					  or \$type = \"TIMESTAMP(0)\" or \$type = \"TIMESTAMP(13) WITH TIME ZONE\"
					  or \$type = \"TIMESTAMP(3)\" or \$type = \"TIMESTAMP(3) WITH TIME ZONE\"
					  or \$type = \"TIMESTAMP(6)\" or \$type = \"TIMESTAMP(6) WITH LOCAL TIME ZONE\" or \$type = \"TIMESTAMP(6) WITH TIME ZONE\"
                      or \$type = \"TIMESTAMP(9)\" or \$type = \"TIMESTAMP(9) WITH TIME ZONE\"
			    	) then \$columnName
			    else ".parent::getXMLDefSqlName();
	}

	public static function getXMLDefType() {
		return "if(\$type = \"LONG\") then ''n''
		        else if(\$type = \"RAW\") then ''s''
			    else ".parent::getXMLDefType();
	}

	public static function getXMLDefColumnsTable() {
		return "(SELECT OWNER as TABSCHEMA ,TABLE_NAME AS TABNAME ,COLUMN_NAME AS COLNAME ,DATA_TYPE AS TYPENAME ,COLUMN_ID AS COLNO FROM SYS.DBA_TAB_COLUMNS)";
	}

	public static function getXMLDefColumns() {
		return "\$i/cols/*";
	}
	public static function getValuesStatement(&$statement) {return "SELECT ".$statement." FROM DUAL";}
	public static function getXMLserializeDocument() {return "DOCUMENT";}
	public static function getXMLDefSerializeReturnType() {return "";}
}
