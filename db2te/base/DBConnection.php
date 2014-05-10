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

/** Include your corresponding Statement Class */
include_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement.php');

abstract class Connection {

	/** Boolean indicating whether you are using a cataloged or direct connection
	* @var boolean */
	public $cataloged = false;
	/** Database name
	* @var boolean */
	public $database = "";
	/** Connection Description name
	* @var boolean */
	public $description = "";
	/** Schema name
	* @var string */
	public $schema = "";
    /** User Name
    * @var string */
	public $username = "";
    /** Password
    * @var string */
	public $password = "";
    /** Hostname
    * @var string */
	public $hostname = "";
    /** Database port number
    * @var string */
	public $portnumber = "";
    /** Database connection resource
    * @var resource */
	public $dbconn = false;
    /** Set TRUE is a valid connection exists
    * @var boolean */
	public $connected = false;
    /** State of the connection
    * @var string */
	public $SQLState = 0;
    /** An Error message if one exsists
    * @var string */
	public $SQLErrorMSG = "";
	  /** Indicates weather to save the connection
    * @var string */
	public $saveConnection = NULL;
	  /** Indicates whether to use a presistent connection
    * @var string */
	public $usePersistentConnection = USE_PERSISTENT_CONNECTION;
	/** Set TRUE trustedContext is enabled
    * @var boolean */
	public $trustedContextEnabled = false;
	/** Indicated the PHP extension used
	 * set to null if non is needed
	 * @var string */
	public static $requiredDBExtension = false;
	/** Indicated the PHP extension minimum version needed
	 * set to null if non is needed
	 * @var float */
	public static $requiredDBExtensionMinVersion = null;
	/** Database Managment System
	 * @var float */
	public static $isPHPExtension = true;
	public $DBMS = "";
	public static $classDBMS = "parent";
	public static $features = array();
	public $statementClass = "";
	public $maxExecutionTime;
	public function getDBMS() {
		if ( is_object($this) ) 
			return $this->DBMS;
		return null;
	}
	public static function driverCheck() {
		self::setError( -1, "driverCheck function not defined for driver");
		return false;
	}
	abstract public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE);
	/**
	  * Requires a database name, schema, userid and password.
	  * If the hostname and portnumber are also included it will try to connect directly to the database.
	  * With only a database name, it will try to connect through a local DB2 Client.
	*/
	abstract public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false);
	public static function testConnection($database, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {
		self::setError( -1, "testConnection function not defined for driver");
		return false;
	}
	abstract public function setTrustedContextUsers($userName, $password);
	abstract public function testTrustedContextUser($userName, $password);
	/**
	 * Sets the autocommit
	 * @return resource
	 */
	abstract public function setAutoCommit($SQLAdHoc_AutoCommit);
	/**
	 * executs a commit
	 * @return resource
	 */
	abstract public function commit();
	/**
	 * Executs a rollback
	 * @return resource
	 */
	abstract public function rollback();
	/**
	 * Returns TRUE is a valid connection was established.
	 * @return boolean
	 */
	public function connected() {
		return $this->connected;
	}

	/**
	 * Returns TRUE is a valid connection was established.
	 * @return boolean
	 */
	public function dbconn() {
		return $this->dbconn;
	}
	/**
	 * Sets the database schema for all subsequent database requests.
	 *
	 * If the schema variable is blank the schema is set by default
	 * to the schema corresponding to the username.
	 */
	abstract public function setSchema($schema = null);
	
	public function setDescription($description) {
		$this->description = $description;
		TE_session_start();
		$_SESSION['Connections'][USE_DATABASE_CONNECTION]['description'] = $description;
		TE_session_write_close();
	}
	
	public function setFeatures() {
		$features=self::getBaseFeatures();
		self::saveFeatures( $features);
	}
	
	/**
	 * Close the database connection.
	 */
	abstract public function close();

	public function getXMLDefSqlName() {
		return "if (\$type =\"LONG VARGRAPHIC\" or \$type = \"GRAPHIC\" or \$type = \"VARGRAPHIC\"
					) then fn:concat(''cast('', \$columnName , '' as clob)'')
			    else if (\$type = \"LONG VARCHAR\" or \$type = \"CLOB\"
			    	 or \$type = \"CHAR\" or \$type = \"CHARACTER\" or \$type = \"VARCHAR\"
			    	 or \$type = \"BLOB\" or \$type = \"XML\" 
			    	 or \$type = \"SMALLINT\" or \$type = \"INTEGER\" or \$type = \"INT\" or \$type = \"BIGINT\" or \$type = \"DECIMAL\" 
			    	 or \$type = \"NUMERIC\" or \$type = \"DECFLOAT\" or \$type = \"REAL\" or \$type = \"DOUBLE\" or \$type = \"FLOAT\" 
			    	 or \$type = \"DATE\" or \$type = \"TIME\" or \$type = \"TIMESTAMP\"
			    	 or \$type = \"NUMBER\"  
			    	) then \$columnName
			    else fn:concat(''''''Unknown data type:'',\$type,'''''''')
			    ";	
	}
	
	public static function getXMLDefType() {
		return "if(\$type = \"LONG VARCHAR\" or \$type = \"CLOB\" or \$type = \"BLOB\" or \$type = \"XML\" ) then ''l''
			    else if(\$type = \"SMALLINT\" or \$type = \"INTEGER\" or \$type = \"INT\" or \$type = \"BIGINT\" or \$type = \"DECIMAL\" 
			    	 or \$type = \"NUMERIC\" or \$type = \"DECFLOAT\" or \$type = \"REAL\" or \$type = \"DOUBLE\"  or \$type = \"FLOAT\"
			    	 or \$type = \"NUMBER\"
			    	   ) then ''n''
			    else ''s''
			   ";
	}

	public static function getXMLDefColumnsTable() {
		return "SYSCAT.COLUMNS";
	}
	
	public static function getValuesStatement(&$statement) {return "VALUES(".$statement.")";}
	public static function getXMLserializeDocument() {return "";}
	public static function getXMLDefSerializeReturnType() {return "AS CLOB(2M)";}
	public static function getBaseFeatures() {
		$features=array();
		$features["javaBridge"]=JAVA_BRIDGE_ACTIVE;
		$features["javaSQL"]=JAVA_SQL_ENABLED;
		$features["ssh2"]=SSH2_ENABLED;
		$features["costEstimation"]=false;
		return $features;
	}
	public static function saveFeatures($features) {
		TE_session_start();
		$_SESSION['Connections'][USE_DATABASE_CONNECTION]['features'] = $features;
		TE_session_write_close();
		return;
	}
	public function getFeatureDescription(&$feature) {
		return self::$features[$feature]["description"];
	}
	public static function getFeatureList() {
		return implode(', ',$_SESSION['Connections'][USE_DATABASE_CONNECTION]['features']);
	}
	public function getSchemaList() {
		$list=array();
		$TempStmt = connectionManager::getNewStatement("SELECT SCHEMANAME FROM SYSCAT.SCHEMATA ORDER BY SCHEMANAME ASC", FALSE, FALSE);
		if ($TempStmt->execSuccessful())
			while($aSchemaName = $TempStmt->fetchAssocRow())
				$list[]=$aSchemaName['SCHEMANAME'];
		return $list;
	}
	public function setDefaultConnection() {
		if(!FORCE_CONNECTION_WITH_DEFAULT) return false;
		$this->database = DEFAULT_DATABASE;
		TE_session_start();
		$this->schema = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema'] : DEFAULT_DATABASE_SCHEMA;
		TE_session_write_close();
		$this->username = DEFAULT_DATABASE_USERNAME;
		$this->password = DEFAULT_DATABASE_PASSWORD;
		$this->hostname = DEFAULT_DATABASE_HOST_NAME;
		$this->portnumber = DEFAULT_DATABASE_PORT_NUMBER;
		$this->usePersistentConnection = USE_PERSISTENT_CONNECTION;
		return true;
	}
	public static function setError($SQLState,$SQLErrorMSG ) {
		if(isset($this)) {
			$this->SQLState = $SQLState;
			$this->SQLErrorMSG  = $SQLErrorMSG ;
		}
		error_log("DBConnect ".(isset($this)?$this->requiredDBExtension:"")." error state:".$SQLState." error: ".$SQLErrorMSG,0);
	}
	public function getMaxExecutionTime() {return $this->maxExecutionTime;}
	public function setMaxExecutionTime($maxExecutionTime) {
		$this->maxExecutionTime = $maxExecutionTime;
		set_time_limit($maxExecutionTime);
	}
	public static function getAttributes() {
		return array(
				'usePersistentConnection'=>array(
						 'title'=>'Persistent'
						,'name'=>'TE_DATABASE_USE_PERSISTENT_CONNECTION'
						,'type'=>'checkbox'
						,'style'=>'text-align:left;'
						)
				,'database'=>array(
						 'title'=>'Database'
						,'name'=>'TE_DATABASE_LOGIN_DATABASE'
						,'nameActive'=>'ACTIVE_DATABASE'
						,'type'=>'text'
						,'style'=>'width:25em;'
						,'value'=>""
						)
				,'hostname'=>array(
						 'title'=>'Host Name'
						,'name'=>'TE_DATABASE_LOGIN_HOSTNAME'
						,'nameActive'=>'ACTIVE_DATABASE_HOSTNAME'
						,'type'=>'text'
						,'style'=>'width:25em;'
						)
				,'portnumber'=>array(
						 'title'=>'Port Number'
						,'name'=>'TE_DATABASE_LOGIN_PORTNUMBER'
						,'nameActive'=>'ACTIVE_DATABASE_PORTNUMBER'
						,'type'=>'text'
						,'style'=>'width:25em;'
						)
				,'group'=>array(
						'title'=>'Group'
						,'name'=>'TE_DATABASE_LOGIN_GROUP'
						,'nameActive'=>'ACTIVE_DATABASE_LOGIN_GROUP'
						,'type'=>'text'
						,'style'=>'width:25em;'
						,'value'=>""
						)
				,'username'=>array(
						'title'=>'User Name'
						,'name'=>'TE_DATABASE_LOGIN_USERNAME'
						,'nameActive'=>'ACTIVE_DATABASE_LOGIN_USERNAME'
						,'type'=>'text'
						,'style'=>'width:25em;'
						,'value'=>""
						)
				,'password'=>array(
						'title'=>'Password'
						,'name'=>'TE_DATABASE_LOGIN_PASSWORD'
						,'type'=>'password'
						,'style'=>'width:25em;background:#FF7777;'
						,'value'=>""
						,'onkeyup'=>'checkPasswordForDB2Connect(this);'
						)
				,'comment'=>array(
						'title'=>'Comment'
						,'name'=>'TE_DATABASE_LOGIN_COMMENT'
						,'nameActive'=>'ACTIVE_DATABASE_COMMENT'
						,'type'=>'text'
						,'style'=>'width:25em;'
						,'value'=>""
						)
				);
	}
	public static function driverOK() {
		if (!isset($GLOBALS[static::$driverLoaded])) return false;
		return $GLOBALS[static::$driverLoaded];
	}
	public static function driverNotDefined($jarVariable) {
		if(!JAVA_BRIDGE_ACTIVE)
			self::setError( -1, "PHP Java Bridge not installed");
		else if( !defined($jarVariable) )
			self::setError( -1, "The driver class library location not defined in configuration for ".$jarVariable);
		else
			return false;
		return true;
	}
}