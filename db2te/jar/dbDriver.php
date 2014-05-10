<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.
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
require_once(JAR_BASE_DIRECTORY . "java.php");
if(!JAVA_BRIDGE_ACTIVE) 
	throw new Exception('Requires Java Bridge');
java_last_exception_clear();

try {
	if(!isset($GLOBALS["javaClass"])) 
		$GLOBALS["javaClass"] = new Java('java.lang.Class');
	if(!isset($GLOBALS["javaSqlDriverManager"])) 
		$GLOBALS["javaSQLDriverManager"] = new Java('java.sql.DriverManager');
	if(!isset($GLOBALS["javaSqlDriver"]))
		$GLOBALS["javaSqlDriver"] = new Java('java.sql.Driver'); 
	if(!isset($GLOBALS["javaSqlConnection"]))
		$GLOBALS["javaSqlConnection"] = new Java('java.sql.Connection'); 
	if(!isset($GLOBALS["java.lang.reflect.Array"]))
		$GLOBALS["java.lang.reflect.Array"] = new Java('java.lang.reflect.Array'); 
	if(!isset($GLOBALS["java.lang.Byte"]))
		$GLOBALS["java.lang.Byte"] = new Java('java.lang.Byte'); 
	if(!isset($GLOBALS["java.lang.String"]))
		$GLOBALS["java.lang.String"] = new Java('java.lang.String'); 

	if(JAVA_DB_DRIVER_DERBY != null) {
		if(!isset($GLOBALS["DerbyDriverLoaded"])) {
			$GLOBALS["derbyClassLoader"] = new JavaClassLoader(JAVA_DB_DRIVER_DERBY);
			$GLOBALS["derbyClassLoader"]->getClass('org.apache.derby.jdbc.ClientDataSource');
			if($GLOBALS["org.apache.derby.jdbc.ClientDataSource"]!=null) {
				$GLOBALS["derbyDataSource"]=$GLOBALS["org.apache.derby.jdbc.ClientDataSource"]->newInstance();
				$GLOBALS["DerbyDriverLoaded"]=($GLOBALS["derbyDataSource"]!=null);
			}
		}
	}
	if(is_file(JAVA_DB_DRIVER_DB2)) {
		if(!isset($GLOBALS["DB2DriverLoaded"])) {
			$GLOBALS["db2ClassLoader"] = new JavaClassLoader(JAVA_DB_DRIVER_DB2,JAVA_DB_DRIVER_DB2_LICENSE);
			$GLOBALS["db2ClassLoader"]->getClass('com.ibm.db2.jcc.DB2ConnectionPoolDataSource');
			$GLOBALS["DB2DriverLoaded"]=true;
		}
	}
	if(is_dir(JAVA_DB_DRIVER_JSON_NOSQL_DB2)) {
		if(isset($GLOBALS["DB2DriverLoaded"]) && !isset($GLOBALS["jsonNoSqlDB2DriverLoaded"])) {
			$GLOBALS["jsonNoSqlDB2DriverLoaded"] = new JavaClassLoader(JAVA_DB_DRIVER_DB2,JAVA_DB_DRIVER_DB2_LICENSE,JAVA_DB_DRIVER_JSON_NOSQL_DB2);
			$GLOBALS["jsonNoSqlDB2DriverLoaded"]->getClass('com.ibm.nosql.json.api.NoSQLClient');
			$GLOBALS["jsonNoSqlDB2DriverLoaded"]->getClass('com.ibm.nosql.json.cmd.NoSqlCmdLine');
//			$GLOBALS["jsonNoSqlDB2DriverLoaded"]->getClass('com.ibm.nosql.json.api.DB');
			$GLOBALS["jsonNoSqlDB2DriverLoaded"]=true;
		}
	}
} catch (JavaException $e) {
	throw new Exception('Error loading dbDriver error:'.$e->getMessage().'  jar directory: '.JAVA_DB_DRIVER_JSON_NOSQL.', check java bridge working correctly');
} 
?>