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
require_once(JAR_BASE_DIRECTORY . "ssh.php");
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'ObjectSsh.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBConnection.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'DBStatement_SSH.php');

class Connection_SSH extends Connection {
	public static $driverLoaded = "sshDriverLoaded";
	public static $isPHPExtension = false;
	public static $requiredDBExtension = "ssh";
	public static $requiredDBExtensionMinVersion = 1.0;
	public static $classDBMS = "ssh";
	public $statementClass = "Statement_SSH";
	
	public static $features = array(
		  "hadoop"	=> array("DBMS"=>"ssh","description"=>"HADOOP"	,"sql"=>"if [ -d /usr/share/hadoop ] ; then echo true; fi")
		 ,"db2"	  	=> array("DBMS"=>"ssh","description"=>"DB2"		,"sql"=>"if [ -f ~/sqllib/bin/db2 ] ; then echo true; fi")
	);
	
	public static function driverCheck() {
		if(!isset($GLOBALS[self::$driverLoaded]) || ! $GLOBALS[self::$driverLoaded]) {
			self::setError(-1, (JAVA_BRIDGE_ACTIVE?"The SSH class library location not defined or found.":"PHP Java Bridge not installed"));
			return false;
		} 
		return true;
	}
	
	public function newStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE) {
		return new Statement_SSH($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount, $this);
	}

	public function __construct($database, $schema, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION, $enableTrustedContext = false) {
		$this->connected = false;
		$this->DBMS=self::$classDBMS;
		if(!@$this->driverCheck()) return;

		$this->description = $username."@".$hostname.":". $portnumber;
		$this->username = $username;
		$this->password = $password;
		$this->hostname = $hostname;
		$this->portnumber = $portnumber;
		try {
			$this->dbconn = new SshShell( $hostname,$portnumber,$username,$password);
		} catch (Exception $e) {
			$this->setError('?????',$e->getMessage());
		}
		if($this->SQLErrorMSG!="")
			throw new Exception($this->SQLErrorMSG);
	}

	public static function testConnection($database=null, $username, $password, $hostname, $portnumber, $usePersistentConnection = USE_PERSISTENT_CONNECTION) {

		if(!$GLOBALS[self::$driverLoaded])
			return self::$classDBMS." driver not load";
		try{
			$dataSource = new Connection_SSH(null, null , $username, $password, $hostname, $portnumber);
			if($dataSource->dbconn==null)
				return "Connection failed, check PHP logs for details, php java bridge issue";
			if($dataSource->dbconn->failed())
				return "Connection failed: ".$dataSource->dbconn->getLastError();
			$results = $dataSource->dbconn->command("id");
			if($dataSource->dbconn->failed())
				return "id command failed: ".$dataSource->dbconn->getLastError();
		} catch(Exception $e) {
			return "Connection failed: ".$e->getMessage();
		} catch (JavaException $ex) {
			return "Connection failed: ".$e->getMessage();
		}
		$major = 0;
		$minor = 0;
		$sub = 0;
		$returnObject = array();
		$returnObject['dataServerName'] = "???";
		$returnObject['feature'] = array();
		$returnObject['DBMS'] = self::$classDBMS;;
		$returnObject['dataServerSQLConformance'] = 'no';  
		$returnObject['dataServerVersion'] = "???";
		$returnObject['dataServerFixpack'] = "???";
		$returnObject['dataServerInstance'] = "???";
		$returnObject['dataServerCodepage'] = "???";
		$returnObject['dataServerTransactionIsolation'] = "???"; 
		return $returnObject;
	}

	public function close() {
	}

	public function setFeatures() {
		$features=self::getBaseFeatures();
		$connectDBMS=( isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['DBMS'] : null);
		foreach(self::$features as $key => $value)
			$feature[$key]=("true"==$this->dbconn->command($value["sql"]));
		self::saveFeatures( $features);
	}

	public function setTrustedContextUsers($userName, $password) {}
	public function testTrustedContextUser($userName, $password) {return false;}
	public function setAutoCommit($SQLAdHoc_AutoCommit) {}
	public function commit() {}
	public function rollback() {}
	public function setSchema($schema = null) {
		if($schema == null || $schema == "" )
			$schema=$this->schema;
		if($schema == null || $schema == "" )
			return;
		$results = $dataSource->dbconn->command("cd ".$schema);
	}
	public function getSchemaList() {
		$currentSchema = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema'] : connectionManager::getConnection()->username;
		$list=array();
		$prefix=(substr($currentSchema,0,1)=="/"?$currentSchema:"/");
		$TempStmt = connectionManager::getNewStatement("find ".$prefix." -maxdepth 1 -type d -print", FALSE, FALSE);
		return array_filter($TempStmt->resultSetStmt);
	}
	public static function getAttributes() {
	
		$attributes=parent::getAttributes();
		unset($attributes['usePersistentConnection']);
		unset($attributes['database']);
		$attributes['portnumber']['value']=22;
		return $attributes;
	}
}
