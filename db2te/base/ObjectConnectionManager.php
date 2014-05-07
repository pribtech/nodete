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
 ********************************************************************************/
/*** modifications by: Peter Prib -  Frygma Pty Ltd (ABN 90 791 388 622 2009) */

include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenu.php");

class connectionManager{

	private static $connection = null;
	private static $connectionName = null;
	public static $lastErrorState = "";
	
	public static function getNewStatement($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE, $localConnection = null) {
		if(!is_subclass_of($localConnection, 'Connection') || $localConnection == null)
			$localConnection = self::getConnection($localConnection);
		if($localConnection == null)
			return null;
		
		return $localConnection->newStatement($stmt_text, $prepare_statment, $verbose, $ForwardOnlyScroll, $getRowCount);
	}
	
	public static function getConnection($ConnectionName = null) {
		if(!is_string($ConnectionName)) $ConnectionName = null;
		
		if ($ConnectionName!==null)
			if(self::$connectionName!==$ConnectionName)
				self::$connection=null;
		if(self::$connection === null) 
			self::retrieveConnection($ConnectionName);
//		if(self::$connection === null) 
//			throw new Exception('No connection for '.$ConnectionName);
		return self::$connection;
	}
	public static function getConnectionDetail() {
		if(self::$connectionName==null) return null;
		return array_merge($_SESSION['Connections'][self::$connectionName],$_SESSION['Connections'][self::$connectionName]['dataServerInfo']);
	}
	public static function getConnectionDetailXML() {
		if(self::$connectionName==null) return null;
		return self::convertConnectionToXMLString($_SESSION['Connections'][self::$connectionName]);
	}
	
	public static function isConnected($ConnectionName = null) {
		if($ConnectionName == null) $ConnectionName = USE_DATABASE_CONNECTION;
		$isconnected = false;
		$sessionStarted = false;
		TE_session_start();
		if(array_key_exists('Connections', $_SESSION)) {
			if(FORCE_CONNECTION_WITH_DEFAULT) {
				if(array_key_exists('defaultConnection', $_SESSION['Connections']))
					$isconnected = $_SESSION['Connections']['defaultConnection']['authenticated'];
			} else {
				if(array_key_exists($ConnectionName, $_SESSION['Connections']))
					if(array_key_exists('authenticated', $_SESSION['Connections'][$ConnectionName]))
						$isconnected = $_SESSION['Connections'][$ConnectionName]['authenticated'];
			}
		}
		TE_session_write_close();
		return $isconnected;
	}

	public static function getDBMS() {
		$connection=self::getConnection();
		if ($connection==null)
			return null;
		return $connection->getDBMS();
	}

	public static function isDBMS($DBMS = null) {
		return self::getDBMS()==$DBMS;
	}

	public static function titleString() {
		return self::isConnected()?self::connectedString():self::notConnectedString();
	}

	public static function getGenericConnectedString() {
		return self::isConnected()?self::genericConnectedString():self::genericNonConnectedString();
	}

	public static function getClientUpdateString() {
		return '
			<script type="text/javascript">
				updateConnectionStatus(' . (self::isConnected() ? "true" : "false") . ', "' . self::titleString() . '", "' . CALLING_PAGE . '");
			</script>
			';
	}

	private static function notConnectedString(){
		return TE_NOT_CONNECTED;
	}

	private static function connectedString(){
		if(FORCE_CONNECTION_WITH_DEFAULT)
			return DEFAULT_DATABASE_USERNAME . "@" . DEFAULT_DATABASE . "." . (DEFAULT_DATABASE_HOST_NAME != "" ? DEFAULT_DATABASE_HOST_NAME . ":" . DEFAULT_DATABASE_PORT_NUMBER : "" );
		if (USE_DATABASE_CONNECTION == null) return "";
		TE_session_start();
		if (!isset($_SESSION['Connections'][USE_DATABASE_CONNECTION])) {
			TE_session_write_close();
			return "";
		}
		$username = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['username']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['username'] : "";
		$database = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['database']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['database'] : "";
		$hostname = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname']) ? strtoupper(trim($_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname']) == "" ? "LOCALHOST" : $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname']) : "";
		TE_session_write_close();
		return "TE Connected: {$database} @ {$hostname} as $username";
	}

	private static function genericConnectedString() {
		return CONNECTION_SYMBOL_START . "&nbsp;" . CONNECTED . "...&nbsp;" . CONNECTION_SYMBOL_END;
	}

	private static function genericNonConnectedString() {
		return NOT_CONNECTION_SYMBOL_START . "&nbsp;" . DISCONNECTED . "...&nbsp;" . NOT_CONNECTION_SYMBOL_END;
	}

	public static function newConnection () {

		if(FORCE_CONNECTION_WITH_DEFAULT)
			return "Operation not permitted!";

		$databaseDriver = trim(getParameter('TE_DATABASE_LOGIN_DATABASE_DRIVER', DEFAULT_DATABASE_DRIVER));
		$username = trim(getParameter('TE_DATABASE_LOGIN_USERNAME', ""));
		$database = trim(getParameter('TE_DATABASE_LOGIN_DATABASE', ""));
		$hostname = trim(getParameter('TE_DATABASE_LOGIN_HOSTNAME', ""));
		$portnumber = trim(getParameter('TE_DATABASE_LOGIN_PORTNUMBER', ""));
		$password = getParameter('TE_DATABASE_LOGIN_PASSWORD', "");
		$comment = getParameter('TE_DATABASE_LOGIN_COMMENT', "");
		$usePersistentConnection = trim(getParameter('TE_DATABASE_USE_PERSISTENT_CONNECTION', ""));
		$group = getParameter('TE_DATABASE_LOGIN_GROUP', "");

		if(!isset($_SESSION['Connections']) || !is_array($_SESSION['Connections'])) {
			TE_session_start();
			$_SESSION['Connections'] = array();
			TE_session_write_close();
		}
		if($password=="") {
			if(isset($_SESSION['ipAddresses'])) 
				if(isset($_SESSION['ipAddresses'][$hostname])) 
					if(isset($_SESSION['ipAddresses'][$hostname][$username]['password'])) 
						$password = $_SESSION['ipAddresses'][$hostname][$username]['password'];
		} else 
			self::setAddress($hostname,$username,$password);
		if($group!="") {
			if($password=="") {
				if(isset($_SESSION['connectionGroup'][$group][$username]['password']))
					$password = $_SESSION['connectionGroup'][$group][$username]['password'];
			} else	
				self::setGroup($group,$username,$password);
		}
		
		$connectionDriver = "Connection_" . $databaseDriver;
		if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
			require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
			try {
				if (version_compare(PHP_VERSION, '5.3.0') >= 0) 
					$connectionStatus = $connectionDriver::testConnection(
				 		$database,
				 		$username,
				 		$password,
				 		$hostname,
				 		$portnumber,
				 		$usePersistentConnection);
				else
					 $connectionStatus = eval('return ' . $connectionDriver . '::testConnection(
						$database,
						$username,
						$password,
						$hostname,
						$portnumber,
						$usePersistentConnection
						);');

			} catch(Exception $e) {
				self::$lastErrorState = 'Connect error: ';
				return false;
			}
		} else {
			self::$lastErrorState = 'Connect driver '. PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php not found";
			return false;
		}

		$dataServerInfo = null;

		if(is_array($connectionStatus) || is_object($connectionStatus)) {
			$dataServerInfo = $connectionStatus;
			$connectionStatus = true;
		} else {
			self::$lastErrorState = $connectionStatus;
			return false;
		}

		$ConnectionName = $databaseDriver.":".$username . "@" . $database . ($hostname != "" ? "." . $hostname . ":" . $portnumber : "");

		TE_session_start();
		$_SESSION['Connections'][$ConnectionName]['description'] = $ConnectionName;
		$_SESSION['Connections'][$ConnectionName]['databaseDriver'] = $databaseDriver;
		$_SESSION['Connections'][$ConnectionName]['database'] = $database;
		$_SESSION['Connections'][$ConnectionName]['schema'] = getParameter('TE_DATABASE_LOGIN_SCHEMA', "");
		$_SESSION['Connections'][$ConnectionName]['username'] = $username;
		$_SESSION['Connections'][$ConnectionName]['password'] = $password;
		$_SESSION['Connections'][$ConnectionName]['hostname'] = $hostname;
		$_SESSION['Connections'][$ConnectionName]['portnumber'] = $portnumber;
		$_SESSION['Connections'][$ConnectionName]['usePersistentConnection'] = $usePersistentConnection;
		$_SESSION['Connections'][$ConnectionName]['comment'] =  $comment;
		$_SESSION['Connections'][$ConnectionName]['connectionStatus'] = $connectionStatus;
		$_SESSION['Connections'][$ConnectionName]['group'] = $group;
		$_SESSION['Connections'][$ConnectionName]['dataServerInfo'] = $dataServerInfo;
		$_SESSION['Connections'][$ConnectionName]['authenticated'] = true;
		$returnObject = $_SESSION['Connections'][$ConnectionName];
		TE_session_write_close();

		self::saveConnectionInStoredConnections($databaseDriver, $database, $username, $hostname, $portnumber, $comment, $group);
		self::getConnection($ConnectionName);
		unset($returnObject['password']);
		return $returnObject;
	}

	public static function UpdateConnectionStatusesAllConnection() {
		TE_session_start();
		if(!isset($_SESSION['Connections']))
			$_SESSION['Connections'] = array();
		else {
			if(!is_array($_SESSION['Connections']))
				$_SESSION['Connections'] = array();
		}
		$connections = $_SESSION['Connections'];
		TE_session_write_close();

		foreach($connections as $key=>$conn) {
			if($key == 'default' || !isset($conn['database']))
				continue;

			if(!isset($conn['databaseDriver'])) $conn['databaseDriver']=DEFAULT_DATABASE_DRIVER;
			$connectionDriver = "Connection_" . $conn['databaseDriver'];
			if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
				require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
				try{
					if (version_compare(PHP_VERSION, '5.3.0') >= 0) 
						$connectionStatus = $connectionDriver::testConnection(
							 $conn["database"]
							,$conn["username"]
							,$conn["password"]
							,$conn["hostname"]
							,$conn["portnumber"]
							);
					else 
						$connectionStatus = eval('return ' . $connectionDriver . '::testConnection(
							 $conn["database"]
							,$conn["username"]
							,$conn["password"]
							,$conn["hostname"]
							,$conn["portnumber"]
							);');
				} catch(Exception $e) {
					throw "Test connection failed. ".-$e->getMessage();
				}
			}

			TE_session_start();
			if(is_array($connectionStatus) || is_object($connectionStatus)) {
				$_SESSION['Connections'][$key]['dataServerInfo'] = $connectionStatus;
				$_SESSION['Connections'][$key]['connectionStatus'] = true;
			} else 
				$_SESSION['Connections'][$key]['connectionStatus'] = $connectionStatus;
			TE_session_write_close();
		}
	}

	public static function newTrustedUser() {
		$connectionToUser = getParameter('TE_DATABASE_LOGIN_DESCRIPTION', "");
		$trustedUserName = getParameter('TRUSTED_CONTEXT_USERNAME', "");
		$trustedUserPassword = getParameter('TRUSTED_CONTEXT_PASSWORD', "");
		$conn = self::retrieveConnection($connectionToUser);

		if($conn == null) return array(false, TE_NO_CONNECTION_FOUND);

		$result = $conn->testTrustedContextUser($trustedUserName, $trustedUserPassword);
		if($result[0] == true) {
			$result[1] = $trustedUserName . "|" . $connectionToUser;
			TE_session_start();
			if(!array_key_exists('trustedContext', $_SESSION['Connections'][$connectionToUser]))
				$_SESSION['Connections'][$connectionToUser]['trustedContext'] = array($trustedUserName => $trustedUserPassword);
			elseif(!is_array($_SESSION['Connections'][$connectionToUser]['trustedContext']))
				$_SESSION['Connections'][$connectionToUser]['trustedContext'] = array($trustedUserName => $trustedUserPassword);
			else
				$_SESSION['Connections'][$connectionToUser]['trustedContext'][$trustedUserName] = $trustedUserPassword;

			self::saveConnectionInStoredConnections($_SESSION['Connections'][$connectionToUser]['databaseDriver'],
																$_SESSION['Connections'][$connectionToUser]['database'],
																 $_SESSION['Connections'][$connectionToUser]['username'],
																 $_SESSION['Connections'][$connectionToUser]['hostname'],
																 $_SESSION['Connections'][$connectionToUser]['portnumber'],
																 $_SESSION['Connections'][$connectionToUser]['comment'],
																 $_SESSION['Connections'][$connectionToUser]['group'],
																 $_SESSION['Connections'][$connectionToUser]['trustedContext']);
			TE_session_write_close();
		}
		return $result;
	}

	/**
	 * Rebuilds a Connection object from session variables.
	 * @return Connection
	 */
	private static function retrieveConnection($ConnectionName = null) {
		$trustedUsername = "";
		$trustedUserPassword = "";
		
		$usePersistentConnection = USE_PERSISTENT_CONNECTION;
		$useTrustedContext = false;
		
		if(FORCE_CONNECTION_WITH_DEFAULT) {

			$connectionDriver = "Connection_" . DEFAULT_DATABASE_DRIVER;
			if(!is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php"))
				return null;
			require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
			self::$connectionName = DEFAULT_DATABASE_USERNAME . "@" . DEFAULT_DATABASE . "." . (DEFAULT_DATABASE_HOST_NAME != "" ? DEFAULT_DATABASE_HOST_NAME . ":" . DEFAULT_DATABASE_PORT_NUMBER : "" );
			try{
				self::$connection = new $connectionDriver(
									DEFAULT_DATABASE,
									DEFAULT_DATABASE_SCHEMA,
									DEFAULT_DATABASE_USERNAME,
									DEFAULT_DATABASE_PASSWORD,
									DEFAULT_DATABASE_HOST_NAME,
									DEFAULT_DATABASE_PORT_NUMBER,
									USE_PERSISTENT_CONNECTION,
									false
								);
			} catch (Exception $e) {return null;}
			return self::$connection;
		}
		
		if($ConnectionName == null) {
			$ConnectionName = USE_DATABASE_CONNECTION;
			if ($ConnectionName == null) return null;
		}

		if(strpos($ConnectionName, '|') !== false) {
			$ConnectionName = explode('|', $ConnectionName);
			$trustedUsername = $ConnectionName[0];
			$ConnectionName = $ConnectionName[1];
			if ($ConnectionName == null) return null;
			TE_session_start();
			if(array_key_exists('trustedContext', $_SESSION['Connections'][$ConnectionName]))
				if(is_array($_SESSION['Connections'][$ConnectionName]['trustedContext']))
					if(array_key_exists($trustedUsername, $_SESSION['Connections'][$ConnectionName]['trustedContext'])) {
						$trustedUserPassword = $_SESSION['Connections'][$ConnectionName]['trustedContext'][$trustedUsername];
						$useTrustedContext = true;
					}
			TE_session_write_close();
			if (!$useTrustedContext) return null;
		}
		TE_session_start();
		unset($connectionDetails);
		if(isset($_SESSION['Connections']))
			if(isset($_SESSION['Connections'][$ConnectionName]))
				$connectionDetails=&$_SESSION['Connections'][$ConnectionName];
		if(!isset($connectionDetails)) {
			TE_session_write_close();
			if(self::$connectionName != null)
				self::$connectionName->close();	
			self::$connectionName=null;
			self::$connection=null;
			return null;
		}
		if(array_key_exists('database', $connectionDetails)) {
			if(!isset($connectionDetails['databaseDriver'])) $connectionDetails['databaseDriver']=DEFAULT_DATABASE_DRIVER;
			$password = $connectionDetails['password'];
			if($password=="") {
				if(isset($_SESSION['ipAddresses'][$connectionDetails['hostname']][$connectionDetails['username']]['password'])) 
					$password = $_SESSION['ipAddresses'][$connectionDetails['hostname']][$connectionDetails['username']]['password'];
			}
			TE_session_write_close();
	
			$connectionDriver = "Connection_" . $connectionDetails['databaseDriver'];
			if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
				require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
				self::$connectionName=$ConnectionName;
				$schemaName = getParameter("schema", "");
				if($schemaName == "")
					$schemaName = getParameter("SCHEMA", "");
				if($schemaName == "")
					$schemaName = $connectionDetails['schema'];
				self::$connection = new $connectionDriver(
										$connectionDetails['database'],
										$schemaName,
										$connectionDetails['username'],
										$password,
										$connectionDetails['hostname'],
										$connectionDetails['portnumber'],
										$connectionDetails['usePersistentConnection'],
										$useTrustedContext
									);		
				if($useTrustedContext)
						self::$connection->setTrustedContextUsers($trustedUsername, $trustedUserPassword);
				return self::$connection;
			}
		}
		TE_session_write_close();
		return null;
	}

	public static function setVCAP_SERVICES($connectionList) {
		if(!($services = getenv('VCAP_SERVICES'))) return;
		foreach(json_decode($services, true) as $serviceName => $service) {
			error_log('test '.var_export($service,true),0);
			if(!isset($service["credentials"]["jdbcurl"])) continue;
			if($service["credentials"]["jdbcurl"]=="") continue;
			error_log('test found',0);
			$connection=array();
			$description = "@".(isset($service["name"])?:"*** not found ***");
			$connection['group'] 					= "VCAP_SERVICE";
			$connection['comment'] 					= "Bluemix service ".$serviceName;
			$connection[$connection]['database'] 	= (isset($service["credentials"]["db"])?$service["credentials"]["db"]:"*** not found ***");
			$connection['hostname'] 				= (isset($service["credentials"]["host"])?$service["credentials"]["host"]:"*** not found ***");
			$connection['portnumber'] 				= (isset($service["credentials"]["port"])?$service["credentials"]["port"]:"*** not found ***");
			$connection['description']				= $description;
			$connection['username'] 				= (isset($service["credentials"]["username"])?$service["credentials"]["username"]:"*** not found ***");
			$connection['password']					= (isset($service["credentials"]["password"])?$service["credentials"]["password"]:"*** not found ***");
			$connection['activeOnFirstLoad'] 		= true;
			$connection['connectionStatus'] 		= false;
			$jdburl=$service["credentials"]["jdbcurl"];
			$connection['databaseDriver'] 			= DEFAULT_DATABASE_DRIVER;
			$connection['connectionStatus']			= true;
			$connectionList[$description]=$connection;
		}
	}

	public static function retrieveStoredConnections()	{
		$connectionList = array();

		if(FORCE_CONNECTION_WITH_DEFAULT) {
			$description = DEFAULT_DATABASE_USERNAME . "@" . DEFAULT_DATABASE . "." . (DEFAULT_DATABASE_HOST_NAME != "" ? DEFAULT_DATABASE_HOST_NAME . ":" . DEFAULT_DATABASE_PORT_NUMBER : "" );
			$connectionList[$description]['comment'] = "Forced Connection";
			$connectionList[$description]['databaseDriver'] = DEFAULT_DATABASE_DRIVER;
			$connectionList[$description]['database'] = DEFAULT_DATABASE;
			$connectionList[$description]['hostname'] = DEFAULT_DATABASE_HOST_NAME;
			$connectionList[$description]['portnumber'] = DEFAULT_DATABASE_PORT_NUMBER;
			$connectionList[$description]['description'] = $description;
			$connectionList[$description]['username'] = DEFAULT_DATABASE_USERNAME;
			$connectionList[$description]['password'] = "";
			$connectionList[$description]['activeOnFirstLoad'] = true;
			$connectionDriver = "Connection_" . DEFAULT_DATABASE_DRIVER;
			$connectionList[$description]['connectionStatus'] = false;
			if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
				require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
				$connectionList[$description]['connectionStatus'] = eval('return ' . $connectionDriver . '::testConnection(
						DEFAULT_DATABASE,
						DEFAULT_DATABASE_USERNAME,
						DEFAULT_DATABASE_PASSWORD,
						DEFAULT_DATABASE_HOST_NAME,
						DEFAULT_DATABASE_PORT_NUMBER,
						USE_PERSISTENT_CONNECTION
					);');
			}
			TE_session_start();
			if(!is_array($_SESSION['Connections']))
				$_SESSION['Connections'] = array();
			if(is_array($connectionList[$description]['connectionStatus']) || is_object($connectionList[$description]['connectionStatus'])) {
				$connectionList[$description]['dataServerInfo'] = $connectionList[$description]['connectionStatus'];
				$connectionList[$description]['connectionStatus'] = true;
				$connectionList[$description]['authenticated'] = true;
				$_SESSION['Connections']['defaultConnection']['authenticated'] = true;
			} else {
				$connectionList[$description]['authenticated'] = false;
				$_SESSION['Connections']['defaultConnection']['authenticated'] = false;
			}
			TE_session_write_close();
			return $connectionList;
		}
		self::setVCAP_SERVICES($connectionList);
		$connectionStoreDoc = self::readSavedConnectionList();
		if($connectionStoreDoc !== false) {
			foreach($connectionStoreDoc->childNodes as $node) {
				$connectionArray = null;
				switch ($node->nodeName) {
					case "RecentConnections" :
						$connectionArray = self::extractConnectionFromNode($node, 'name', "temp");
						break;
					case "SavedConnections" :
						$connectionArray = self::extractConnectionFromNode($node, 'name', "save");
						break;
					default:
						throw new Exception("Connection store, unknown tag ".$node->nodeName);
				}
				foreach($connectionArray as $connection) {
					$preformAutoConnect = true;
					if(isset($_SESSION['Connections'][$connection['description']]))
						if(isset($_SESSION['Connections'][$connection['description']]['connectionStatus']))
							if($_SESSION['Connections'][$connection['description']]['connectionStatus'] == true)
								$preformAutoConnect = false;
					if($connection['autoConnect'] == true && $preformAutoConnect) {
						$connectionStatus = null;
						$connectionDriver = "Connection_" . $connection['databaseDriver'];
						if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
							require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
							$connectionStatus = eval('return ' . $connectionDriver . '::testConnection(
									$connection["database"],
									$connection["username"],
									$connection["password"],
									$connection["hostname"],
									$connection["portnumber"],
									$connection["usePersistentConnection"]
							);');
						}
						$dataServerInfo = null;
						if(is_array($connectionStatus) || is_object($connectionStatus)) {
							$dataServerInfo = $connectionStatus;
							$connectionStatus = true;
						}
						if($connectionStatus === true )	{
							TE_session_start();
							$ConnectionName = $connection['description'];
							$_SESSION['Connections'][$ConnectionName] = $connection;
							$_SESSION['Connections'][$ConnectionName]['connectionStatus'] = true;
							$_SESSION['Connections'][$ConnectionName]['dataServerInfo'] = $dataServerInfo;
							$_SESSION['Connections'][$ConnectionName]['authenticated'] = true;
							TE_session_write_close();
						}
						self::setAddress($connection['hostname'],$connection['username'],$connection['password']);
						if($connection['group']!='')
							self::setGroup($connection['group'],$connection['username'],$connection['password']);
					}
					$connectionList = array_merge($connectionList, $connectionArray);
				}
			}
			ksort($connectionList);
		}
		unset($SessionConnectionList);
		TE_session_start();
		if(isset($_SESSION['Connections']))
			$SessionConnectionList = $_SESSION['Connections'];
		TE_session_write_close();
		if(!isset($SessionConnectionList)) 
			return $connectionList;

		foreach($SessionConnectionList as $connectionKey => $connectionInformation) {
			if($connectionKey == 'default') continue;
			if($connectionInformation == null) continue;
			if(!isset($connectionInformation['description'])) continue;
			$connectionList[$connectionInformation['description']]= $connectionInformation;
			$connectionList[$connectionInformation['description']]['time'] = time();
			$connectionList[$connectionInformation['description']]['password'] = "";
			if(array_key_exists('trustedContext', $connectionInformation)) {
				if(is_array($_SESSION['Connections'][$connectionInformation['description']]['trustedContext']))	{
					if(is_array($connectionInformation['trustedContext']))
						$connectionList[$connectionInformation['description']]['dataServerInfo'] = $connectionInformation['dataServerInfo'];
				} else
					$connectionList[$connectionInformation['description']]['trustedContext'] =  $connectionInformation['trustedContext'];
			}
			$connectionList[$connectionInformation['description']]['authenticated'] = true;
			if(strtolower(USE_DATABASE_CONNECTION) == strtolower($connectionKey))
				$connectionList[$connectionInformation['description']]['activeConnection'] = true;
		}
		ksort($connectionList);
		return $connectionList;
	}

	private static function extractConnectionFromNode($ConnectionNode, $orderBy = 'time', $connectionType) {
		$connectionList = array();
		if(!$ConnectionNode->hasChildNodes()) return $connectionList;

		foreach($ConnectionNode->childNodes as $node) {
 			switch ($node->nodeName) {
 				case "connection" :
					$connectionArray = self::extractConnectionFromNode($node, 'name', "temp");
					continue;
				default:
					break;
			}
 			$connection = array();
 			$connection['connectionTag'] 	= null;
			$connection['connectionType'] 	= $connectionType;
 			$connection['connectionStatus'] = false;
 			$connection['authenticated'] 	= false;
 			$connection['description'] 		= $node->getAttribute('description');
 			$connection['time'] 			= $node->getAttribute('time');
 			$connection['comment'] 			= $node->getChildTextContent('comment');
 			$connection['databaseDriver'] 	= $node->getChildTextContent('databaseDriver');
 			$connection['database'] 		= $node->getChildTextContent('database');
 			$connection['hostname']   		= $node->getChildTextContent('hostname');
 			$connection['portnumber']     	= $node->getChildTextContent('portnumber');
 			$connection['group'] 			= $node->getChildTextContent('group');
 			$connection['username'] 		= $node->getChildTextContent('username');
 			$connection['password'] 		= $node->getChildTextContent('password');
 			$connection['schema'] 			= $node->getChildTextContent('schema');
 			$connection['usePersistentConnection'] = strtolower($node->getChildTextContent('usePersistentConnection')) == 'true' ? true : false;
 			$connection['autoConnect'] = strtolower($node->getChildTextContent('autoConnect')) == 'true' ? true : false;
 			$connection['activeOnFirstLoad'] = $node->getAttribute('activeOnFirstLoad') == 'true' ? true : false;
 			$trustedContextList = $node->findChildNode('trustedContext');
 			if($trustedContextList != null)	{
 				$connection['trustedContext'] = array();
 				foreach($node->childNodes as $userNode) {
	 				if(strcasecmp($node->nodeName, "user") === 0)
	 					$connection['trustedContext'][$node->getAttribute('id')] = $node->getAttribute('password');
		 		}
 			}
 			$connectionList[$connection['description']] = $connection;
	 	}
		return $connectionList;
	}

	private static function extractValueFrom($NodeName, $node)	{
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode)
			{
				if(strcasecmp($childNode->nodeName, $NodeName) == 0)
					return trim($childNode->textContent);
			}
		}
		return "";
	}

	public static function saveConnectionInStoredConnections($databaseDriver, $database, $username = "", $hostname = "", $portnumber = "", $comment = "", $group = "" ,$trustedUserList = null) {
		if(FORCE_CONNECTION_WITH_DEFAULT) return; 
		if($username == ""	) return; 
		if($database == "") return;
		if($group == "VCAP_SERVICE") return;
		
		$connectionList = self::retrieveStoredConnections();
		$connectionKey = $username . "@" . $database . ($hostname != "" ? "." . $hostname . ":" . $portnumber : "");
		$connectionList[$connectionKey]['description'] = $connectionKey;
		$connectionList[$connectionKey]['databaseDriver'] = $databaseDriver;
		$connectionList[$connectionKey]['database'] = $database;
		$connectionList[$connectionKey]['hostname'] = $hostname;
		$connectionList[$connectionKey]['portnumber'] = $portnumber;
		$connectionList[$connectionKey]['username'] = $username;
		$connectionList[$connectionKey]['password'] = "";
		$connectionList[$connectionKey]['autoConnect'] = "";
		$connectionList[$connectionKey]['schema'] = "";
		$connectionList[$connectionKey]['usePersistentConnection'] = "";
		$connectionList[$connectionKey]['comment'] = $comment;
		$connectionList[$connectionKey]['group'] = $group;
		$connectionList[$connectionKey]['time'] = time();
		$connectionList[$connectionKey]['trustedContext'] =  $trustedUserList;
		self::writeConnectionList($connectionList);
	}

	public static function disconnectConnection($connectionName) {
		$connectionName = $connectionName == null ? USE_DATABASE_CONNECTION : $connectionName;
		TE_session_start();
		unset($_SESSION['Connections'][$connectionName]);
		if (self::$connectionName !== $connectionName) { 
			TE_session_write_close();
			return;
		}
		TE_session_write_close();
		if(self::$connection != null) 
			self::$connection->close();	
		self::$connection=null;
		self::$connectionName=null;
	}

	public static function removeConnection($connectionName) {
		if(!is_string($connectionName)) return;

		self::disconnectConnection($connectionName);

		if(CONNECTION_STORE_FILE == false) return; 
		if(FORCE_CONNECTION_WITH_DEFAULT) return;
		if(! ALLOW_CONNECTION_SAVING) return;

		$connectionList = self::retrieveStoredConnections();
		unset($connectionList[$connectionName]);
		self::writeConnectionList($connectionList);
	}
	
	private static function readSavedConnectionList() {
		if(CONNECTION_STORE_FILE !== false && CONNECTION_STORE_STORAGE_TYPE == FILE_SAVE) {
			if(file_exists(CONNECTION_STORE_FILE)) {
				$doc = new XMLNode();
				if($doc->loadXML(file_get_contents(CONNECTION_STORE_FILE)) !== false)
					return $doc;
			}
		} else if(CONNECTION_STORE_STORAGE_TYPE == DATABASE_SAVE) {
			$connectionDriver = "Connection_" . CONNECTION_STORE_DATABASE_DRIVER;
			if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
				require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
				$dbconn = new $connectionDriver(
										CONNECTION_STORE_DATABASE,
										CONNECTION_STORE_DATABASE_SCHEMA,
										CONNECTION_STORE_DATABASE_USERNAME,
										CONNECTION_STORE_DATABASE_PASSWORD,
										CONNECTION_STORE_DATABASE_HOST_NAME,
										CONNECTION_STORE_DATABASE_PORT_NUMBER,
										true
									);
				if($dbconn->connected) {
					$statment = $dbconn->newStatement(CONNECTION_STORE_SELECT_STATEMENT, true);
					
					$bindParameters = array();
					$bindParameters[1] = array();
					$bindParameters[1]['name'] = 'USERNAME';
					$bindParameters[1]['value'] = SESSION_CURRENT_USER_ID;
					$bindParameters[1]['dataType'] = 'string';
					$bindParameters[1]['type'] = 'DB2_PARAM_INOUT';
					$statment->executeStmtWithParameters($bindParameters);
					if(!$statment->statementSucceed) return false;
					$resultRow = null;
					$resultRow = $statment->fetchIndexedRow();
					if($statment->statementSucceed && $resultRow != null && !$statment->fetchIndexedRow()) {
						$doc = new XMLNode();
						if($doc->loadXML($resultRow[0]) !== false)
							return $doc;
					}
				}
			}
		}
		return false;
	}

	private static function writeConnectionList($connectionList) {
		if(! ALLOW_CONNECTION_SAVING) return false;
		if(CONNECTION_STORE_STORAGE_TYPE == FILE_SAVE && CONNECTION_STORE_FILE != false) {
			$file = @fopen(CONNECTION_STORE_FILE, 'w');
			if($file == false) return;
			$XMLConnectionList 	= "<?xml version='1.0'?>\n"
								. "<connectionList>\n"
								. "\t<SavedConnections>\n";
			foreach($connectionList as $connection)
				$XMLConnectionList .= self::convertConnectionToXMLString($connection);
	
			$XMLConnectionList .= "\t</SavedConnections>\n"
								. "</connectionList>\n";
			fwrite($file, $XMLConnectionList);
			fflush($file);
			fclose($file);
			return true;
		} else if(CONNECTION_STORE_STORAGE_TYPE == DATABASE_SAVE) {
			$connectionDriver = "Connection_" . CONNECTION_STORE_DATABASE_DRIVER;
			if(is_file(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php")) {
				require_once(PHP_INCLUDE_BASE_DIRECTORY . "DB" . $connectionDriver . ".php");
				$dbconn = new $connectionDriver(
										CONNECTION_STORE_DATABASE,
										CONNECTION_STORE_DATABASE_SCHEMA,
										CONNECTION_STORE_DATABASE_USERNAME,
										CONNECTION_STORE_DATABASE_PASSWORD,
										CONNECTION_STORE_DATABASE_HOST_NAME,
										CONNECTION_STORE_DATABASE_PORT_NUMBER,
										true
									);
				if($dbconn->connected)	{
					$XMLConnectionList 	= "<?xml version='1.0'?>\n"
								. "<connectionList>\n"
								. "\t<SavedConnections>\n";
					foreach($connectionList as $connection)
						$XMLConnectionList .= self::convertConnectionToXMLString($connection);
			
					$XMLConnectionList .= "\t</SavedConnections>\n"
										. "</connectionList>\n";
					
					$statment = $dbconn->newStatement(CONNECTION_STORE_SELECT_STATEMENT, true);
					$bindParameters = array();
					$bindParameters[1] = array();
					$bindParameters[1]['name'] = 'USERNAME';
					$bindParameters[1]['value'] = SESSION_CURRENT_USER_ID;
					$bindParameters[1]['dataType'] = 'string';
					$bindParameters[1]['type'] = 'DB2_PARAM_INOUT';
					$statment->executeStmtWithParameters($bindParameters);
					if(!$statment->statementSucceed) return false;
					
					$bindParameters[2] = $bindParameters[1];
					
					$bindParameters[1] = array();
					$bindParameters[1]['name'] = 'CONNSTORE';
					$bindParameters[1]['value'] = $XMLConnectionList;
					$bindParameters[1]['dataType'] = 'string';
					$bindParameters[1]['type'] = 'DB2_PARAM_INOUT';
					
					$resultRow = null;
					$resultRow = $statment->fetchIndexedRow();
					if($statment->statementSucceed && $resultRow !== false) 
						$statment = $dbconn->newStatement(CONNECTION_STORE_UPDATE_STATEMENT, true);
					else
						$statment = $dbconn->newStatement(CONNECTION_STORE_INSERT_STATEMENT, true);
					$statment->executeStmtWithParameters($bindParameters);
					if(!$statment->statementSucceed) return false;
				}
			}
			return true;
		}
		return false;
	}

	private static function convertConnectionToXMLString($connection) {
		if(!is_array($connection))	return "";
		if(!isset($connection['databaseDriver'])) $connection['databaseDriver']=DEFAULT_DATABASE_DRIVER;
		
		$characterstToEncode = array('&', '"');
	    $ReplaceWith = array('&amp;','&quot;');
	    $connection['description'] = str_replace($characterstToEncode, $ReplaceWith, $connection['description']);
		$XMLString  = "\t\t<connection description=\"{$connection['description']}\"".(isset($connection['time'])?" time=\"{$connection['time']}\"":"").">\n"
					. "\t\t\t<comment><![CDATA[{$connection['comment']}]]></comment>\n"
					. "\t\t\t<databaseDriver><![CDATA[{$connection['databaseDriver']}]]></databaseDriver>\n"
					. "\t\t\t<database><![CDATA[{$connection['database']}]]></database>\n"
					. "\t\t\t<hostname><![CDATA[{$connection['hostname']}]]></hostname>\n"
					. "\t\t\t<portnumber><![CDATA[{$connection['portnumber']}]]></portnumber>\n"
					. "\t\t\t<group><![CDATA[{$connection['group']}]]></group>\n"
					. "\t\t\t<username><![CDATA[{$connection['username']}]]></username>\n"
					. "\t\t\t<password><![CDATA[{$connection['password']}]]></password>\n"
					;
		if(isset($connection['autoConnect']))
			$XMLString .= "\t\t\t<autoConnect><![CDATA[" . ($connection['autoConnect'] ? "true" : "false") . "]]></autoConnect>\n";
		if(isset($connection['schema']))
			$XMLString .= "\t\t\t<schema><![CDATA[{$connection['schema']}]]></schema>\n";
		if(isset($connection['usePersistentConnection']))
			$XMLString .= "\t\t\t<usePersistentConnection><![CDATA[" . ($connection['usePersistentConnection'] ? "true" : "false") . "]]></usePersistentConnection>\n";
		if(isset($connection['trustedContext']))
			if(is_array($connection['trustedContext'])) {
				$XMLString .= "\t\t\t<trustedContext>\n";
				foreach($connection['trustedContext'] as $key=>$value)
					$XMLString .= "\t\t\t<user id=\"$key\" password=\"\"/>\n";
				$XMLString .= "\t\t\t</trustedContext>\n";
			}
		if(isset($connection['dataServerInfo']))
			if(is_array($connection['dataServerInfo'])) {
				$XMLString .= "\t\t\t<dataServerInfo";
				foreach($connection['dataServerInfo'] as $key=>&$value)
					$XMLString .= " ".$key."=\"".$value."\"";
				$XMLString .= "/>\n";
			}
			
 		return $XMLString."\t\t</connection>\n";
	}
	public static function setAddress($address,$userId,$password) {
		TE_session_start();
		if(!isset($_SESSION['ipAddresses'][$address][$userId])) {
			if(!isset($_SESSION['ipAddresses'])) $_SESSION['ipAddresses'] = array();
			if(!isset($_SESSION['ipAddresses'][$address])) $_SESSION['ipAddresses'][$address] = array();
			$_SESSION['ipAddresses'][$address][$userId] = array();
		}
		$_SESSION['ipAddresses'][$address][$userId]['password'] = $password;
		TE_session_write_close();
	}
	public static function setGroup($group,$userId,$password) {
		TE_session_start();
		if(!isset($_SESSION['connectionGroup'][$group][$userId])) {
			if(!isset($_SESSION['connectionGroup'])) $_SESSION['connectionGroup'] = array();
			if(!isset($_SESSION['connectionGroup'][$group])) $_SESSION['connectionGroup'][$group] = array();
			$_SESSION['connectionGroup'][$group][$userId] = array();
		}
		$_SESSION['connectionGroup'][$group][$userId]['password'] = $password;
		TE_session_write_close();
	}
	public static function unsetAddress($address,$userId) {
		TE_session_start();
		if(isset($_SESSION['ipAddresses'][$address][$userId])) 
			unset($_SESSION['ipAddresses'][$address][$userId]);
		TE_session_write_close();
	}
	public static function unsetGroup($group,$userId) {
		TE_session_start();
		if(isset($_SESSION['connectionGroup'][$group][$userId])) 
			unset($_SESSION['connectionGroup'][$group][$userId]);
		TE_session_write_close();
	}
	public static function rebuildSessionFromStore() {
		TE_session_start();
		$_SESSION['connections']=self::retrieveStoredConnections();
		TE_session_write_close();
	}
	public static function setFeatures() {
		self::getConnection()->setFeatures();
		TE_session_start();
		$returnObject = $_SESSION['Connections'][USE_DATABASE_CONNECTION];
		TE_session_write_close();
		unset($returnObject['password']);
		return $returnObject;
	}
	
}

/*******************************************************************************
 *  Below 
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010-2011 All rights reserved.
 *********************************************************************************/

abstract class ConnectManagerAbstract {
	public function __construct($id) {
		if(!isset($id)) 
			throw new Exception('connectManager id is not specified');
		if($id==null) 
			throw new Exception('connectManager id is null');
		$this->id=$id;
	}
	private $id;
	private $comment;
	private $description;
	public function getId() {return $this->id;}
	public function getComment() {return $this->comment;}
	public function getDescription() {return $this->description;}
	public function getXML() {
		return "\n<".$this->xmlTag
				.$this->getXMLAttribute('id')
				.$this->getXMLAttribute('comment')
				.$this->getXMLAttribute('description')
				.$this->getXMLAttributes()
				.">".$this->getXMLNodes()
				."</".$this->xmlTag.">\n";
	}
	public function getXMLAttributes() {return "";}
	public function getXMLArray($name) {
		$xml="\n<".$name.">"; 
	    foreach ($this->$name as $key => $node) {
			$xml .= $node->getXML();	    	
	    }
	    return $xml."</".$name.">\n";
	}
	public function getXMLAttribute($name) {
		try {return (isset($this->$name)?" ".$name."='".$this->$name."'":"");}
		catch(e $e)	{throw new Exception('attribute: '.$name.' error: '.$e->getMessage());}
	}
	public function getXMLNodes() {return "";}
	public function loadXMLNode(&$node) {
		foreach($node->attributes as $attr ) {
			$this->setXMLAttribute($attr->name,$attr->value);
		}
		if (!$node->hasChildNodes()) {return;}
		foreach($node->childNodes as $childNode) {
			$this->setXMLElement($childNode);
 		}
	}
	public function setComment($comment) {$this->comment=$comment;}
	public function setDescription($description) {$this->description=$description;}
	protected function setXMLAttribute(&$attr,&$value) {
		$setFunction='set'.ucfirst($attr);
		try {
			if(method_exists($this, $setFunction))
				$this->$setFunction($value);
			else
				$this->$attr=$value;
		} catch(e $e) {
				throw new Exception("***error** class: ".get_class($this)." unknown attribute:".$attr->name.' '.$e->getMessage());
		}
	}
	public function setXMLElement(&$node) {
		if($node->nodeType !== XML_ELEMENT_NODE) return;
		if (substr($node->nodeName,-1) == 's' ) {
			$nodes=$node->nodeName;
			if(!isset($nodes) || $nodes==null || $nodes=='')
				throw new Exception("connectManager nodeName not set");
			$this->$nodes=array();
			foreach($node->childNodes as $childNode) {
				if($childNode->nodeType !== XML_ELEMENT_NODE) continue;
				$id=$childNode->getAttribute('id');
				if(!isset($id))
					throw new Exception("connectManager id attribute not found");
				if($id==null)
					throw new Exception("connectManager id attribute is null");
				if($id=='')
					throw new Exception("connectManager id attribute is space");
				if(isset($this->$nodes))
					if(is_array($this->$nodes))
						if(count($this->$nodes)>0)
 							if(isset($this->$nodes[$id]))
								throw new Exception("connectManager ".$nodes." with id ".$id." is not unique" );
				
				$class='connect'.ucfirst($childNode->nodeName);
				$nodeArray=&$this->$nodes;
				$nodeArray[$id]=new $class($id);
				$nodeArray[$id]->loadXMLNode($childNode);
			}
			return;
		}
		$id=$node->getAttribute('id');
		if(!isset($id))
			throw new Exception("connectManager id attribute not found");
		if($id==null)
			throw new Exception("connectManager id attribute is null");
		$class='connect'.ucfirst($node->nodeName);

		$nodes=$node->nodeName;
		$nodesAttr=&$this->$nodes;
		if(!isset($nodesAttr))
			$nodesAttr=new $class($id);
		$nodesAttr->loadXMLNode($node);
	}
}
class connectUser extends ConnectManagerAbstract {
	public function __construct($id,$password=null) {
		parent::__construct($id);
		if($password==null) return;
		$this->setPassword($password);
	}
	protected $xmlTag='user';
	public $authenticated=false;
	public $schema;
	public $time;
	private $password;
	private $violations=0;
	public function authenticate($user,$password) {
		if(!$this->authenticated)
			throw new Exception('User not authenicated');
		if($this->violations++>6)
			throw new Exception('Too many violations');
		if($user!=$this->getId() or $password!=$this->getPassword()) 
			throw new Exception('Invalid user/password');
		return true;
		}
	public function getUserName() {return $this->getId();}
	public function getEncryptedPassword() {return $this->password;}
	public function getPassword() {
		if($this->password==null)
			throw new Exception('Password not set for '.$this->getUserName());
		return cipherDecrypt($this->xmlTag.$this->getUserName(),$this->password);
	}
	public function getXMLAttributes() {return $this->getXMLAttribute('schema');}
	public function setAuthenticated($authenticated) {$this->authenticated=$authenticated;}
	public function setPassword($password) {
		if(!isset($password)) 
			throw new Exception('Password is not specified for user: '.$this->getUserName());
		if($password==null) 
			throw new Exception('Password cannot be null');
		$this->password=cipherEncrypt($this->xmlTag.$this->getUserName(),$password);
	}
	public function setEncryptedPassword($password) {return $this->password=$password;}
	public function setSchema($schema) {$this->schema=$schema;}
	public function setTime($time) {$this->time=$time;}
}
class connecthealthUser extends connectUser {
	protected $xmlTag='healthUser';
	public function getXMLAttributes() {return ' encryptedPassword="'.$this->getEncryptedPassword().'"';}
}
class connectDatabaseUser extends connectUser {
	protected $xmlTag='databaseUser';
	public $connectionStatus;
	public $usePersistentConnection;
	public $autoConnect;
	public function setConnectionStatus($connectionStatus) {$this->connectionStatus=$connectionStatus;}
	public function setUsePersistentConnection($usePersistentConnection) {$this->usePersistentConnection=$usePersistentConnection;}
	public function setAutoConnect($autoConnect) {$this->autoConnect=$autoConnect;}
}
class connectDatabase extends ConnectManagerAbstract {
	protected $xmlTag='database';
	public $healthUser=null;
	public $databaseUsers=array();
	public function addHeathUser($id,$password) {
		if(!isset($this->$heathUser))
			$this->heathUser=new connectUser($id);
		$this->users[$id]->setPassword($password);
	}
	public function addUser($id,$password) {
		if(isset($this->users[$id]))
			throw new Exception("Database user ".$id." already exists");
		$this->users[$id]=new connectDatabaseUser($id,$password);
		return $this->users[$id];
	}
	function authenicate($uri,$nodeNode,$instanceNode) {
		if($nodeNode->getId()!='session') {
			$connectionStatus = self::testConnection(
										 $this->getId()
										,$uri->getUserName()
										,$uri->getPassword()
										,$nodeNode->getId()
										,$instanceNode->getPort()
								);
			if (!is_array($connectionStatus))
				throw new Exception($connectionStatus);
		}
		$this->addUser($uri->getUserName(),$uri->getPassword());
	}
	function checkHealth(&$object,&$healthUser,&$nodeId,&$port,&$dbName,&$databaseDriver) {
		$object->setConnectId($nodeId.":".$port."/".$dbName);
		require_once(PHP_INCLUDE_BASE_DIRECTORY . "DBConnection_" . $databaseDriver . ".php");
		if($this->healthUser==null) {
					if($healthUser==null) {
						$object->setError('No health user set');
						return;
					}
			$username=$healthUser->getId();
			$password=$healthUser->getPassword();
		} else {
			$username=$this->healthUser->getId();
			$password=$this->healthUser->getPassword();
		}
		$class="Connection_".$databaseDriver;
		$connection = new $class(
										$dbName,
										$username,   // schema
										$username,
										$password,
										$nodeId,
										$port
									);		
		if(!$connection->connected()) {
			$object->setError('Did not connect '.$connection->SQLErrorMSG );
			error_log("checkHealth connection isssue user: ".$username." error: ".$connection->SQLErrorMSG ,0);
			return;
		}
		$object->execute($connection);
	}
	function getConnectionDetails($level,$uri){
		if ($level==$this->xmlTag)
			throw new Exception('Database connection details not implemented yet');
		throw new Exception('unknown level: '.$level);
	}
	public function getUser($id) {return (isset($this->users[$id])?$this->users[$id]:null);}
	public function getXMLNodes() {
		return ($this->healthUser==null?"":$this->healthUser->getXML()).$this->getXMLArray('databaseUsers');
	}
}
class connectInstance extends ConnectManagerAbstract {
	protected $xmlTag='instance';
	public $su=false;
	public $sudo=false;
	public $user=null;
	public $port;
	public $name;
	public $version;
	public $fixpack;
	public $instance;
	public $transactionIsolation;
	public $codepage;
	public $sqlConformance;
	public $defaultIsolationLevel;
	public $databaseDriver;
	public $databases=array();
	
	public function addDatabase($id=null) {
		if($id==null) return;
		if(!isset($this->databases[$id]))
			$this->databases[$id]=new connectDatabase($id);
		return $this->databases[$id];
	}
	public function addUser($id,$password) {
		$this->user=new connectUser($id);
		$this->user->setPassword($password);
	}
	function authenicate($uri,$nodeNode) {
		if($uri->isDatabaseSet()) {
			$databaseNode=$this->getDatabase($uri->getDatabase()); 
			if($databaseNode==null) {
				$databaseNode=$this->addDatabase($uri->getDatabase());
				try{$databaseNode->authenicate($uri,$nodeNode,$this);}
				catch(Exception $e) {
					$this->deleteDatabase($uri->getDatabase());
					throw $e;
				}
			} else $databaseNode->authenicate($uri,$nodeNode,$this);
			return true;
		}
		$this->user=null;
		$callArray=array('node'=>$nodeNode->getId());
		if($this->su or $this->sudo) {
			if($nodeNode->user==null)
				throw new Exception("Must set node/host user/password as ".($this->su?"su":"sudo")." access to instance");
			$callArray['username']=$nodeNode->user->getId();
			$callArray['password']=$nodeNode->user->getPassword();
			$callArray['su']=array('username'=>$uri->getUserName(),'password'=>$uri->getPassword());
			$callArray['su']['sudo']=$this->sudo;
			if ($this->sudo)
				$callArray['su']['password']=$callArray['password'];
		} else {
			$callArray['username']=$uri->getUserName();
			$callArray['password']=$uri->getPassword();
		}
		try{$shell = new SshShell($callArray);}
		catch(Exception $e) {
			throw new Exception(($this->su?"su":($this->sudo?"sudo":"ssh"))." access to instance, ".$e->getMessage());
		}
		$this->addUser($uri->getUserName(),$uri->getPassword());
	 	return true;
	}
	function checkHealth(&$object,$healthUser,$nodeId) {
		foreach ($this->databases as $dbName => &$database) {
			$database->checkHealth($object,$healthUser,$nodeId,$this->port,$dbName,$this->databaseDriver);	    	
	    }
	}
	function getConnectionDetails($level=null,$uri) {
		if ($level!==$this->xmlTag) {
			$databaseNode=$this->getDatabase($uri->getDatabase());
			if($databaseNode==null)
				throw new Exception("connect at database level and database ".$uri->getDatabase()." not found or null (not specified)");
			return $databaseNode->getConnectionDetails($level,$uri);
		}
		if($this->su or $this->sudo) {
			$callArray=array('username'=>$uri->getUserName(),'password'=>$uri->getPassword());
			if($this->user==null)
				throw new Exception("Must set node/host user/password as ".($this->su?"su":"sudo")." for instance ".$uri->getInstanceURI());
			$callArray['su']=array('username'=>$this->user->getUserName(),'password'=>$this->user->getPassword());
			$callArray['su']['sudo']=$this->sudo;
			if ($this->sudo)
				$callArray['su']['password']=$callArray['password'];
			return $callArray;
		} 
		if($this->user==null)
			throw new Exception("Must set user/password for instance ".$uri->getInstanceURI());
		$uri->setUser($this->user);
		return array('username'=>$uri->getUserName(),'password'=>$uri->getPassword());
	}
	public function getDatabase($id) {return (isset($this->databases[$id])?$this->databases[$id]:null);}
	public function getPort() {return (isset($this->port)?$this->port:$this->getId());}
	public function getXMLAttributes() {
		return ConnectManagerAbstract::getXMLAttribute('name')
			.ConnectManagerAbstract::getXMLAttribute('port')
			.ConnectManagerAbstract::getXMLAttribute('version')
			.ConnectManagerAbstract::getXMLAttribute('fixpak')
			.ConnectManagerAbstract::getXMLAttribute('instanceName')
			.ConnectManagerAbstract::getXMLAttribute('transactionIsolation')
			.ConnectManagerAbstract::getXMLAttribute('codepage')
			.ConnectManagerAbstract::getXMLAttribute('sqlConformance')
			.ConnectManagerAbstract::getXMLAttribute('defaultIsolationLevel')
			.ConnectManagerAbstract::getXMLAttribute('databaseDriver')
			.($this->su?" su='true'":"")
			.($this->sudo?" sudo='true'":"");
	}
	public function getXMLNodes() {
		return $this->getXMLArray('databases').($this->user==null?'':$this->user->getXML());
	}
	public function setDatabaseDriver($databaseDriver) {
		$this->databaseDriver=$databaseDriver;
	}
	public function setDataServerInfo($dataServerInfo) {
		$this->name=(isset($dataServerInfo['dataServerName'])?$dataServerInfo['dataServerName']:null);
		$this->version=(isset($dataServerInfo['dataServerVersion'])?$dataServerInfo['dataServerVersion']:null);
		$this->fixpak=(isset($dataServerInfo['dataServerFixpack'])?$dataServerInfo['dataServerFixpack']:null);
		$this->instanceName=(isset($dataServerInfo['dataServerInstance'])?$dataServerInfo['dataServerInstance']:null);
		$this->transactionIsolation=(isset($dataServerInfo['dataServerTransactionIsolation'])?$dataServerInfo['dataServerTransactionIsolation']:null);
		$this->codepage=(isset($dataServerInfo['dataServerCodepage'])?$dataServerInfo['dataServerCodepage']:null);
		$this->sqlConformance=(isset($dataServerInfo['dataServerSQLConformance'])?$dataServerInfo['dataServerSQLConformance']:null);
		$this->defaultIsolationLevel=(isset($dataServerInfo['dataServerDefaultIsolationLevel'])?$dataServerInfo['dataServerDefaultIsolationLevel']:"?");
	}
	public function setName($name) {
		$this->user=new connectUser($name);
	}
	public function setPort($port) {
		if($port==null) return;
		if($port=="") return;
		$this->port=$port;
	}
	public function setSu() {$this->su=true;}
	public function setSuDo() {$this->sudo=true;}
}
class connectNode extends ConnectManagerAbstract {
	protected $xmlTag='node';
	public $user;
	public $userDatabaseDefault;
	public $healthUser=null;
	public $instances=array();
	public function addInstance($service) {
		if(!isset($this->instances[$service]))
			$this->instances[$service]=new connectInstance($service);
		return $this->instances[$service];
	}
	public function addUser($id,$password) {
		$this->user=new connectUser($id);
		$this->user->setPassword($password);
		if(!isset($this->userDatabaseDefault))
			$this->userDatabaseDefault=$this->user;
	}
	public function addUserDatabaseDefault($id,$password) {
		$this->userDatabaseDefault=new connectUser($id,$password);
	}
	function authenicate($uri) {
		if(!$uri->isInstanceSet()) {
			unset($this->user);
			if($this->getId()!='session')
				$shell = new SshShell(array('node'=> $this->getId(),'username'=>$uri->getUserName(),'password'=>$uri->getPassword()));
			$this->addUser($uri->getUserName(),$uri->getPassword());
			return true;
		}
		$instanceNode=$this->getInstance($uri->getInstance()); 
		if($instanceNode==null) {
			$instanceNode=$this->addInstance($uri->getInstance());
			try{$instanceNode->authenicate($uri,$this);}
			catch(Exception $e) {
				$this->deleteInstance($uri->getInstance());
				throw $e;
			}
		} else $instanceNode->authenicate($uri,$this);
		return true;
	}
	function checkHealth(&$object,&$healthUser,$nodeId) {
		foreach ($this->instances as $service => &$instance) {
			$instance->checkHealth($object,($this->healthUser==null?$healthUser:$this->healthUser),$nodeId);	    	
	    }
	}
	public function deleteInstance($nodeID) {if(isset($this->instances[$nodeID])) unset($this->instances[$nodeID]);}
	function getConnectionDetails($level,$uri) {
		$uri->setUser($this->user);
		if($level==$this->xmlTag) {
			if($uri->isUserSet()) 
				return array("node" => $this->getId(),"username" => $uri->getUserName(),"password" => $uri->getPassword());
			throw new Exception('No user authenicated at node/host level');
		}
		$instanceNode=$this->getInstance($uri->getInstance());
		if($instanceNode==null)
			throw new Exception('instance "'.$uri->getInstance().'" not found for connection url "'.$uri->getURI().'" at level "'.$level.'"');
		return  array_merge(array("node" => $this->getId()),$instanceNode->getConnectionDetails($level,$uri));
	}
	public function getInstance($service) {return (isset($this->instances[$service])?$this->instances[$service]:null);}
	public function getUser($id) {return (isset($this->users[$id])?$this->users[$id]:null);}
	public function getXMLNodes() {
		return ($this->healthUser==null?"":$this->healthUser->getXML()).$this->getXMLArray('instances');
	}
}
class ConnectUri {
	private $userName=null;
	private $password=null;
	private $node=null;
	private $instance=null;
	private $database=null;
	public function __construct($uriIn=null) {
		if ($uriIn==null) 
	 		throw new Exception('URI not specified and is required');
	 	$uri=$uriIn;
		if(strpos($uri, "@")!==false) {
			list($this->userName, $uri) = explode("@", $uri,2);
			if(strpos($this->userName, "/")!==false) 
				list($this->userName, $this->password) = explode("/", $this->userName,2);
		}
		if(strpos($uri, "/")!==false)
			list($uri, $this->database) = explode("/", $uri,2);
		if(strpos($uri, ":")==false) 
			$this->node=$uri;
		else 
			list($this->node, $this->instance) = explode(":", $uri,2);
// added for backwards compatibility on db2te
		if($this->database=="") $this->database=null;
		if($this->database==null)
			if(strpos($this->node, ".")!==false) {
				@session_start();
				if(isset($_SESSION['Connections'][$uriIn])) {
					$this->node=$_SESSION['Connections'][$uriIn]['hostname'];
					$this->instance=$_SESSION['Connections'][$uriIn]['portnumber'];				
					$this->database=$_SESSION['Connections'][$uriIn]['database'];				
				}
				session_write_close();
			}
	}
	public function getUserName() {return $this->userName;}
	public function getPassword() {return $this->password;}
	public function getNode() {return $this->node;}
	public function getInstance() {return $this->instance;}
	public function getInstanceURI() {return $this->node.':'.$this->instance;}
	public function getDatabase() {return $this->database;}
	public function getURI() {return ($this->userName==null?'':$this->userName.($this->password==null?'':'/*********@'))
									.$this->node.($this->instance==null?'':':'.$this->instance)
									.($this->database==null?'':'/'.$this->database);
							}
	public function isNodeSet() {return $this->node!=null;}
	public function isInstanceSet() {return $this->instance!=null;}
	public function isDatabaseSet() {return $this->database!=null;}
	public function isUserNameSet() {return $this->userName!=null;}
	public function setUser($user) {
		if ($user==null) return;
		if ($user->getUsername()=='') return;
		$this->userName=$user->getUsername();
		$this->password=$user->getPassword();
	}
}
class connectManagerNodes {
	private $name= 'connectManagerNodes';
	private $file= 'connectionStore/connectionProfile.xml';
	public $nodes;
	public $user;
	public $healthUser;
	public $uri4Authentication='';
	public $lastUsedTime=0;
	public function __construct($useSession=true) {
		include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectSsh.php");
		if(defined('CONNECTION_STORE_FILE'))
			$this->file=str_ireplace('.xml','.newMethod.xml',CONNECTION_STORE_FILE);
		if($useSession) {
			$this->loadSession();
			if(!isset($this->nodes)) 
				$this->rebuild();
			return;
		}
		$connProfile = apc_fetch('connectionProfile');
//		if ( $connProfile==false ) {
			if(!isset($this->file)) 
				throw new Exception('No connection profile file set');
			if(!file_exists($this->file)) 
				throw new Exception('Connection profile file "'.$this->file.'" does not exists');
			$this->load();
			$connProfile=serialize($this->nodes);
			apc_store('connectionProfile',$connProfile,2);
			return;
//		}
//		$this->nodes=unserialize($connProfile);
//		return;
	}
	public function addNode($nodeID) {
		if(!isset($this->nodes[$nodeID]))
    		$this->nodes[$nodeID]=new connectNode($nodeID);
    	return $this->nodes[$nodeID];
	}
	function authenicate($uriIn=null) {
		$sessionSignon=false;
		$uri= new ConnectUri($uriIn);
		if ($uri->isNodeSet()) 
			$this->checkActive();
		else {
			if($this->user!=null) {
				$this->user->authenticate($uri->getUsername(),$uri->getPassword());
				$this->saveSession();
				return true;
			}			
			$uri= new ConnectUri($uri->getUserName().'/'.$uri->getPassword().'@'.($this->uri4Authentication==''?'session':$this->uri4Authentication));
			$sessionSignon=true;
		}
		$nodeNode=$this->getNode($uri->getNode()); 
		if($nodeNode==null) {
			try{$this->addNode($uri->getNode())->authenicate($uri);}
			catch(Exception $e) {
				$this->deleteNode($uri->getNode());
		 		throw $e;
			}
		} else 
			$nodeNode->authenicate($uri);
		if($sessionSignon) {
			if($this->user==null) 
				$this->user=new connectUser($uri->getUserName());
			$this->user->setPassword($uri->getPassword());
			$this->user->setAuthenticated(true);
		}
		$this->saveSession();
		return true;
	}
	private function checkActive() {
		if ((time()-$this->lastUsedTime)>3600) 
			throw new Exception('Session expired, signon to session required');
	}
	function checkHealth(&$object) {
		if(!isset($object)) return;
		if(!isset($this->nodes)) return;
		foreach ($this->nodes as $nodeId => &$node) {
			$node->checkHealth($object,$this->healthUser,$nodeId);	    	
	    }
	}
	public function convertConnections($connects) {
		foreach ($connects as $ConnectionName => $connection) {
			if(!isset($connection['hostname'])) continue;
			if($connection['hostname']=="") continue;
			$nodeID=$connection['hostname'];
			$this->addNode($nodeID); 
	    	$node=$this->getNode($nodeID);
	    	$node->addInstance($connection['portnumber']);
			$instance=$node->getInstance($connection['portnumber']);
			if(isset($connection['dataServerInfo'])) 
				$instance->setDataServerInfo($connection['dataServerInfo']);
	    	$instance->setPort($connection['portnumber']);
			$instance->setDatabaseDriver($connection['databaseDriver']);
			$instance->addDatabase($connection['database']);
			$database=$instance->getDatabase($connection['database']);
			if($database==null) return;
			$userDatabase=$database->getUser($connection['username']);
			if($userDatabase==null) 
				if(isset($connection['username']) && $connection['username']!='') 
					$userDatabase=$database->addUser($connection['username'],$connection['password']); 
			if(!isset($userDatabase)) return;
	    	$userDatabase->setDescription($ConnectionName );
	    	$userDatabase->setComment($connection['comment']);
			$userDatabase->setSchema($connection['schema']);
			$userDatabase->setConnectionStatus($connection['connectionStatus']);
			if(isset($connection['time'])) 
				$userDatabase->setTime($connection['time']);
			$userDatabase->setUsePersistentConnection($connection['usePersistentConnection']);
			$userDatabase->setAuthenticated($connection['authenticated']);
			if(isset($connection['autoConnect'])) 
				$userDatabase->setAutoConnect($connection['autoConnect']);
		}
	}
	public function convertActive() {
		if(isset($_SESSION['ipAddresses'])) 
    		foreach ($_SESSION['ipAddresses'] as $nodeID => $nodeValue) {
    			$this->addNode($nodeID);
    			foreach ($nodeValue as $user => $value) {
					$this->getNode($nodeID)->addUserDatabaseDefault($user,$nodeValue[$user]['password']);
    			}
			}
		if(isset($_SESSION['Connections'])) 
			$this->convertConnections($_SESSION['Connections']);
	}
	public function deleteNode($nodeID) {if(isset($this->nodes[$nodeID])) unset($this->nodes[$nodeID]);}
	function getConnectionDetails($level='database',$uriIn=null) {
		$this->checkActive();
		if ($uriIn==null) 
			return array();
		$uri=new ConnectUri($uriIn);
		$nodeNode=$this->getNode($uri->getNode()); 
		if($nodeNode==null)
			throw new Exception('Node/hostname "'.$uri->getNode().'" not set up');
		$uri->setUser($this->user);
		if($this->user==null) 
			throw new Exception('Requires session sign on');
		return array_merge(array("session"=>$this->user->getId()),$nodeNode->getConnectionDetails($level,$uri));
	}
	public function getNode($nodeID) {return (isset($this->nodes[$nodeID])?$this->nodes[$nodeID]:null);}
	public function getXML() {
		$xml="<".$this->name.(isset($this->uri4Authentication)?" uri4Authentication='".$this->uri4Authentication."'":"").">".($this->healthUser==null?"":$this->healthUser->getXML()); 
		if(isset($this->nodes))
		    foreach ($this->nodes as $key => $node)
				$xml .= $node->getXML();	    	
	    return $xml."</".$this->name.">";
	}
	public function load() {
		if(!file_exists($this->file)) return;
		$this->updateXML(file_get_contents($this->file));
	}
	private function loadSession() {
		@session_start();
		if(isset($_SESSION[$this->name])) { 
			$this->convertActive();
			$this->nodes=unserialize($_SESSION[$this->name]['nodes']);
			$this->user=unserialize($_SESSION[$this->name]['user']);
			$this->uri4Authentication=$_SESSION[$this->name]['uri4Authentication'];
			$this->lastUsedTime=$_SESSION[$this->name]['lastUsedTime'];
		}
		session_write_close();
	}
	public function rebuild() {
		$this->load();
		@session_start();
		$this->convertConnections(connectionManager::retrieveStoredConnections());
		$this->convertActive();
		$this->saveSession();
	}
	public function save() {
		$this->saveSession();
		$file = @fopen($this->file, 'w');
		if($file == false) 
			throw new Exception('Cannot open write access to '.$this->file);
		$bytes=fwrite($file, "<?xml version='1.0'?>\n"
							.$this->getXML());
		if(!fclose($file))
			throw new Exception('Cannot close write access to '.$this->file);
	}
	private function saveSession() {
		$this->setLastUsed();
		@session_start();
		$_SESSION[$this->name]['nodes']=serialize($this->nodes);
		$_SESSION[$this->name]['user']=serialize($this->user);
		$_SESSION[$this->name]['uri4Authentication']=$this->uri4Authentication;
		$_SESSION[$this->name]['lastUsedTime']=$this->lastUsedTime;
		session_write_close();
	}
	private function setLastUsed() {$this->lastUsedTime=time();}
	function updateXML($xml) {
		if($xml == null)
			throw new Exception('no xml');
		$doc = new DOMDocument();
		$doc->loadXML($xml);
		if($doc == false)
			throw new Exception('Cannot load xml');
		foreach($doc->childNodes as $managerNode) 	{
		    if($managerNode->nodeType == XML_ELEMENT_NODE) { 
				foreach($managerNode->attributes as $attr ) {
					$attrName=$attr->name;
					try{$this->$attrName=$attr->value;}
					catch(e $e)	{
						$setFunction='set'.ucfirst($attrName);
						try{$this->$setFunction($attr->value);}
						catch(e $e2) {
							throw new Exception("***error** class: ".get_class($this)." unknown attribute:".$attrName.' '.$e->getMessage().' and '.$e2->getMessage());
						}
					}				
				}
				$this->nodes= array();
				foreach($managerNode->childNodes as $node) 	{
					if($node->nodeType !== XML_ELEMENT_NODE) continue;
					$id=$node->getAttribute('id');
					if(!isset($id))
						throw new Exception("connectManager Node id attribute not found");
					if($id==null)
						throw new Exception("connectManager Node id attribute is null");
					$this->nodes[$id]=new connectNode($id);
					$this->nodes[$id]->loadXMLNode($node);
				}
		    }
 		}
	}
}

