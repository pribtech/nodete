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

function setDefine($var,$value=null) {
	if (defined($var)) return;
	@define($var, $value);
}
function setDefineFile($var,$valueWindows=null,$valueLinux=null) {
	if (defined($var)) return;
	$value=(substr(php_uname(), 0, 7) == "Windows"?$valueWindows:$valueLinux);
	@define($var, $value);
}
function setDefineDirectory($var,$valueWindows,$valueLinux=null) {
	if (defined($var)) return;
	$value=(substr(php_uname(), 0, 7) == "Windows"?$valueWindows:$valueLinux);
	@define($var, $value);
}

/******************************************************************************
 * VERSION INFORMATION
 *****************************************************************************/

@define("MAJOR_VERSION", 5);
@define("MINOR_VERSION", 0);
@define("SUB_VERSION", "1953");
@define("TE_VERSION", "v".MAJOR_VERSION.".".MINOR_VERSION);

/******************************************************************************
 * END - VERSION INFORMATION
 *****************************************************************************/
if( getenv('TE_SETTINGS') )
	try{
		$settings =  json_decode(getenv('TE_SETTINGS'), true);
		foreach ($settings as $key => $value) {
			error_log("Env set ".$key." = ".$value,0);
			@define($key,$value);
		}
	} catch (Exception $e){
		error_log('Error loading env settings, exception: '.$e->getMessage(),0);
	}
	
/*********************************************************************************
 *********************************************************************************
 *********************************************************************************

           IT IS NO LONGER RECOMENDED THAT YOU CHANGE CONFIGURATIONS IN
                                   THIS FILE!

           To add or edit configuration create the file "config.php" in
           the user preferences folder. Unless changed the directory it
           will be "./preferences/".

           With in the file add the tag '<?php' to the vary top of the
           file.

           Below the tag copy congfigurations from this file into
           your user configuration file and set it there.

           This will allow you to upgrade the TE without overwriting your
           custom settings.

 *********************************************************************************
 *********************************************************************************
 *********************************************************************************/

/******************************************************************************
 *  USER PREFERENCES DIRECTORY
 *****************************************************************************/

/** User Configuration folder
* @var  string USER_PREFERENCES_DIRECTORY */
@define("USER_PREFERENCES_DIRECTORY", "./preferences/");


/** User configuration file Import
 */
if(is_file(USER_PREFERENCES_DIRECTORY . "config.php") && is_readable(USER_PREFERENCES_DIRECTORY . "config.php")) {
		include_once(USER_PREFERENCES_DIRECTORY . "config.php");
}

/******************************************************************************
 * END - USER PREFERENCES DIRECTORY
 *****************************************************************************/

/******************************************************************************
 * GENERAL CONFIGURATION PARAMETERS
 *****************************************************************************/

/** Identifies if the TE is publicly hosted, Items like droping the schema
 * at then end of a tutorial will automaticly be run for you
* @var  string bool DMC_IS_PUBLICLY_HOSTED */
setDefine("DMC_IS_PUBLICLY_HOSTED", "false");

/** Identifies if the TE should raise a warning before the browser reloads or
*   navigates away from the TE
* @var  bool ENABLE_CONFIRM_LEAVE_VIA_BROWSER_NAVAGATION */
@setDefine("ENABLE_CONFIRM_LEAVE_VIA_BROWSER_NAVIGATION", true);

/** XML Parsing Engine
* @var  string XML_PARSING_ENGINE */
setDefine("XML_PARSING_ENGINE", "DOM");

/** Speeds up IE by degrading functionality
* @var  boolean IE_SPEED_EXTENSION */
setDefine("IE_SPEED_EXTENSION", true);

/** Shows warning a warning notifing an IE user how slow there browser really it
* @var  boolean SHOW_IE_PERFORMANCE_WARNING */
setDefine("SHOW_IE_PERFORMANCE_WARNING", true);

/** enable PHP extension check, This will indicate to users that they do
 * not have the need PHP extension installed.
* @var  boolean ENABLE_PHP_EXTENSION_CHECK */
setDefine("ENABLE_PHP_EXTENSION_CHECK", true);

/******************************************************************************
 * END - GENERAL CONFIGURATION PARAMETERS
 *****************************************************************************/

/******************************************************************************
 * DEFAULT CONNECTION SETTINGS
 *****************************************************************************/

setDefine("TE_LANGUAGE", "en_US");

setDefine("BASE_LANGUAGE_DIRECTORY", "language/");

setDefine("TE_CHARACTER_SET", "UTF-8");

setDefine('JS_COMPRESSED_FILES_ENABLED', false);

setDefine('JS_GROUP_FILES_ENABLED', false);

/** Use of a persistent connection will increases performance but at a
 * cost. Use of a non persistent connection will add 0.25-2s in time
 * per action call because a new connection needs to be established each
 * time. Persistent connection will form a permanent connection to the
 * database which will no be closed generally unless apache is restarted
 * (e.g. I have no way to close the connection). There is also a problem
 * that if the connection is forced off for any reason, there is currently
 * no internal mechanism to recover and the web server will need to be
 * restarted.
* @var  boolean USE_PERSISTENT_CONNECTION */
setDefine("USE_PERSISTENT_CONNECTION", false);

/** Foces a connection using the default connection information
 * if enabled you can not connect to any other systems
* @var  boolean FORCE_CONNECTION_WITH_DEFAULT */
setDefine("FORCE_CONNECTION_WITH_DEFAULT", false);

/** Default database name
* @var  string DEFAULT_DB2_DATABASE*/
setDefine("DEFAULT_DATABASE_DRIVER", "IBM_DB2");

/** Default database name
* @var  string DEFAULT_DB2_DATABASE*/
setDefine("DEFAULT_DATABASE", "");

/** Default database the username
* @var  string DEFAULT_DB2_DATABASE_USERNAME */
setDefine("DEFAULT_DATABASE_USERNAME", "");

/** Default schema name, if omitted the schema will be set to the username
* @var  string DEFAULT_DB2_DATABASE_SCHEMA */
setDefine("DEFAULT_DATABASE_SCHEMA", "");

/** Default host name, only used for direct connections
* @var  string DEFAULT_DB2_DATABASE_HOST_NAME */
setDefine("DEFAULT_DATABASE_HOST_NAME", "");

/** Default database port number, only used for direct connections
* @var  string DEFAULT_DB2_DATABASE_PORT_NUMBER */
setDefine("DEFAULT_DATABASE_PORT_NUMBER", "");

/** Default password only used when a connection is forced
* @var  string DEFAULT_DB2_DATABASE_PASSWORD */
setDefine("DEFAULT_DATABASE_PASSWORD", "");

/**
 * Indicates if we can save connectioned
 * @var  boolean ALLOW_CONNECTION_SAVING
 */
setDefine("ALLOW_CONNECTION_SAVING", true);

/**
 * Defines where the connection store information is saved 
 * FILE_SAVE - save the conneciton information in a file
 * DATABASE_SAVE save the connection information in a database
 * @var  string CONNECTION_STORE_STORAGE_TYPE
 */
setDefine("FILE_SAVE", 0);
setDefine("DATABASE_SAVE", 1);
setDefine("CONNECTION_STORE_STORAGE_TYPE", FILE_SAVE);

/**
 * Default connection store file where connection are saved
 * @var  string CONNECTION_STORE_FILE
 */
setDefine("CONNECTION_STORE_FILE", "./connectionStore/connStore.xml");

/** Use of a persistent connection will increases performance
* @var  boolean CONNECTION_STORE_USE_PERSISTENT_CONNECTION */
setDefine("CONNECTION_STORE_USE_PERSISTENT_CONNECTION", true);

/** Database driver to connect with
* @var  string CONNECTION_STORE_DATABASE_DRIVER*/
setDefine("CONNECTION_STORE_DATABASE_DRIVER", "IBM_DB2");

/** Default database name
* @var  string DEFAULT_DB2_DATABASE*/
setDefine("CONNECTION_STORE_DATABASE", "");

/** Default database the username
* @var  string DEFAULT_DB2_DATABASE_USERNAME */
setDefine("CONNECTION_STORE_DATABASE_USERNAME", "");

/** Default schema name, if omitted the schema will be set to the username
* @var  string DEFAULT_DB2_DATABASE_SCHEMA */
setDefine("CONNECTION_STORE_DATABASE_SCHEMA", "");

/** Default host name, only used for direct connections
* @var  string DEFAULT_DB2_DATABASE_HOST_NAME */
setDefine("CONNECTION_STORE_DATABASE_HOST_NAME", "");

/** Default database port number, only used for direct connections
* @var  string DEFAULT_DB2_DATABASE_PORT_NUMBER */
setDefine("CONNECTION_STORE_DATABASE_PORT_NUMBER", "");

/** Default password only used when a connection is forced
* @var  string DEFAULT_DB2_DATABASE_PASSWORD */
setDefine("CONNECTION_STORE_DATABsetDefine(WORD", "");

/** the following statement are based off of the the table:
 * CREATE TABLE TE.USER_CONN_STORE (connstore CLOB INLINE LENGTH 3000, username VARCHAR(512) PRIMARY KEY NOT NULL)

/** This is the select statement used to retrive the connection store from the database
* It is expected that the authentication has been completed and the querie only requiers
* one parameter.
*
* Parameters
* 1 - String - USER ID
*
* Return
* - One row, one column containing the connection store XML, if more then one row is
*   returned a read error will be returned.
* @var  string - SQL STATEMENT - CONNECTION_STORE_SELECT_STATEMENT*/
setDefine("CONNECTION_STORE_SELECT_STATEMENT", "SELECT connstore FROM TE.USER_CONN_STORE where username = ?");

/** This is the insert statement used to store a users connection store file for the first time
*
* Parameters
* 1 - String - connection store XML
* 2 - String - USER ID
* @var  string - SQL STATEMENT - CONNECTION_STORE_SELECT_STATEMENT*/
setDefine("CONNECTION_STORE_INSERT_STATEMENT", "INSERT INTO TE.USER_CONN_STORE (connstore, username) VALUES (?, ?)");

/** This is a update statement used to update a users connection store file.
*
* Parameters
* 1 - String - connection store XML
* 2 - String - USER ID
* @var  string - SQL STATEMENT - CONNECTION_STORE_SELECT_STATEMENT*/
setDefine("CONNECTION_STORE_UPDATE_STATEMENT", "UPDATE TE.USER_CONN_STORE SET connstore = ? where username = ?");

/**
 * Default RSS feed file where connection are saved
 * @var  string FEED_SOURCE_FILE
 */
setDefine("FEED_SOURCE_FILE", "./connectionStore/feedSourceList.xml");

/**
 * Designates a not connected symbol
 * @var  boolean CONNECTION_SYMBOL
 */
setDefine("CONNECTED", "Connected");

/**
 * Designates a not connected symbol
 * @var  boolean CONNECTION_SYMBOL
 */
setDefine("DISCONNECTED", "Disconnected");

/******************************************************************************
 * END - DEFAULT CONNECTION SETTINGS
 *****************************************************************************/

/******************************************************************************
 * SESSION SETTINGS
 *****************************************************************************/

/**
 * The IP address to only allow connection from or boolean false to disable
 * @var  string LOCK_ON_IP_ADDRESS
 */
setDefine("LOCK_ON_IP_ADDRESS", false);

/**
 * In addition to the session key verify the users on his user agent
 * @var boolean VERIFY_ON_USER_AGENT
 */
setDefine("VERIFY_ON_USER_AGENT", true);

/**
 * In addition to the session key verify the users on his IP address
 * @var boolean VERIFY_ON_CLIENT_ADDR
 */
setDefine("VERIFY_ON_CLIENT_ADDRESS", true);

/**
 * Cycles the session ID of the user,
 * Good protection against session hijacking.
 * @var boolean VERIFY_ON_CLIENT_ADDR
 */
setDefine("CYCLE_SESSION_ID", false);

/**
 * The time in which a given session will time out. Set to boolean false to disable.
 * @var  int SESSION_TIMEOUT_IN_MIN */
setDefine("SESSION_TIMEOUT_IN_MIN", 30);

/*
 * If this is on, TE will use named sessions. Name of the session will be based
 * on the browser URL (that is, if two TE copies are run on the same domain and
 * accessed by the same user, the sessions will be different). */
setDefine("SESSION_UNIQUE_PATH_ID", false);

/******************************************************************************
 * END - SESSION SETTINGS
 *****************************************************************************/

/******************************************************************************
 * DEVELOPER SETTINGS
 *****************************************************************************/
/** Show errors that would normaly be suppresed
* @var  boolean ENABLE_VERBOSE */
setDefine("ENABLE_VERBOSE", false);

/** Show errors that would normaly be suppresed
* @var  boolean ENABLE_VERBOSE */
setDefine("ENABLE_APD_DEBUG", false);

/**
* @var  boolean ALLOW_DEVELOPER_VIEW */
setDefine("ALLOW_DEVELOPER_VIEW", false);

/** Allows Users to view the base XML used to display a table
* @var  boolean ALLOW_DISPLAY_OF_XML */
setDefine("ALLOW_DISPLAY_OF_XML", true);

/** Only allows access through a https connection
* @var  boolean FORCE_SECURE_CONNECTION */
setDefine("FORCE_SECURE_CONNECTION", false);

/** Forces a connection using the default connection information
 * if enabled you can not connect to any other systems
 */
setDefine("ENABLE_VIEW_QUERY", true);

/** log in PHP log all action calls on finalisation */
setDefine("TRACE_ACTION_CALLS", false);
/** log set debug messages to browser console */
setDefine("DEBUG_LOG_2_CONSOLE", false);

/** db2te development mode, forces by pass of browser cache */
setDefine("DEVELOPMENT_MODE", false);

/******************************************************************************
 * END - DEVELOPER SETTINGS
 *****************************************************************************/

/******************************************************************************
 * SECURITY SETTINGS
 *****************************************************************************/


/** The Regex used to ensure filenames are valid
* @var  string FILE_VERIFICATION_REGEX */
setDefine("FILE_VERIFICATION_REGEX", '/^([\.]?[a-zA-Z0-9_\/-]+)+$/');


/******************************************************************************
 * END - SECURITY SETTINGS
 *****************************************************************************/

/******************************************************************************
 * BASE FOLDERS AND FILES
 *****************************************************************************/

/** This is the default page that is displayed when opening a new tab
* This file contains a slandered menu
* @var  string TE_DEFAULT_PAGE */
setDefine("CUSTOM_TE_NEW_TAB", USER_PREFERENCES_DIRECTORY . "/menu_CUSTOM_TE_NEW_TAB.xml");

/** This is the page that is displayed when first loading the TE
 * This file contains only a XML of a PageWindow
* @var  string TE_HOME_PAGE */
setDefine("CUSTOM_TE_HOME_PAGE_LAYOUT", "/TE_HOME_PAGE.xml");


/** This is the page that is displayed when first loading the TE 
 ************ FOR TOUCH SYSTEMS (iPad) ********************
 * This file contains only a XML of a PageWindow
* @var  string TE_HOME_PAGE */
setDefine("CUSTOM_TE_TOUCH_HOME_PAGE_LAYOUT", "/TE_HOME_PAGE.xml");


/**
 * Base action directory when there is no connection - These action can be run when no connection has been registered
 * @var  string ACTION_DIRECTORY
 */
setDefine("ACTION_DIRECTORY_NO_CONNECTION", "./actions/noConnection/");

/**
 * Base action directory for active connection - These action can be run only when you have a active connection to the database
 * @var  string ACTION_DIRECTORY_ACTIVE_CONNECTION
 */
setDefine("ACTION_DIRECTORY_ACTIVE_CONNECTION", "./actions/activeConnection/");

/**
 * Base table definition directory
 * @var  string TABLE_DEFINITION_DIRECTORY
 */
setDefine("TABLE_DEFINITION_DIRECTORY", "./tableDefinitions/");

/**
 * Defines the root of the main root menu
 * @var  string MAIN_MENU_ROOT_DIRECTORY
 **/
setDefine("MAIN_MENU_ROOT_DIRECTORY", "./menu/");

/**
 * Defines the root of the main root menu
 * @var  string MAIN_RIGHT_MENU_ROOT_DIRECTORY
 **/
setDefine("MAIN_RIGHT_MENU_ROOT_DIRECTORY", "./menu/righthandMenu/");

/**
 * The directory where all saved and predefined
 * queries are stored
 * @var  string QUERY_FILES_DIRECTORY
 */
setDefine("QUERY_FILES_DIRECTORY", "./queryfiles/");

/**
 * Base directory for all html files
 *
 *
 * DO NOT CHANGE
 *
 * The HTML directory needs to be in the same
 * directory as the CSS directory. Since the
 * HTML files will need to reference to the
 * CSS files and they are not intelligent enough
 * to handle directory changes.
 *
 * @var  string HTML_BASE_DIRECTORY
 */
define("HTML_BASE_DIRECTORY", "./html/");

/**
 * Base directory for all css files
 *
 * The CSS directory needs to be in the same
 * directory as the HTML directory. Since the
 * HTML files will need to reference to the
 * CSS files and they are not intelligent enough
 * to handle directory changes.
 *
 * @var  string CSS_BASE_FILE
 */
setDefine("CSS_BASE_FILE", "./css/default.css");

/**
 * Base directory for all js files
 *
 * @var  string CSS_BASE_DIRECTORY
 */
setDefine("JS_BASE_DIRECTORY", "./js/");

/**
 * Base directory for all image files
 *
 *
 * DO NOT CHANGE
 *
 * NOTE: The HTML directory has its' own
 * image directory
 *
 * @var  string IMAGE_BASE_DIRECTORY
 */
define("IMAGE_BASE_DIRECTORY", "./images/");

/**
 * Base directory for all PHP base include files
 * @var  string PHP_INCLUDE_BASE_DIRECTORY
 */
setDefine("PHP_INCLUDE_BASE_DIRECTORY", "./base/");

/** Default action processor
* @var  string ACTION_PROCESSOR */
setDefine("ACTION_PROCESSOR", "action.php");

/** Default menu processor
* @var  string MENU_PROCESSOR */
setDefine("MENU_PROCESSOR", ACTION_PROCESSOR . "?action=menu");

/**
 * Base directory for all tutorials
 *
 * DO NOT CHANGE
 *
 * @var  string TUTORIAL_BASE_DIRECTORY
 */
define("TUTORIAL_BASE_DIRECTORY", "./tutorials/");

/**
 * Base directory for all tutorials
 * @var  string TUTORIAL_BASE_DIRECTORY
 */
setDefine("TE_SCRIPTS_BASE_DIRECTORY", "./TEScripts/");

/**
 * Base directory for all DBConnetion and DBStatement Files
 * @var  string TE_DRIVERS_BASE_DIRECTORY
 */
setDefine("TE_DRIVERS_BASE_DIRECTORY", PHP_INCLUDE_BASE_DIRECTORY);

/** used to aquier you current connection status and connection information.
* @var  string CONNECTION_VERIFIER */
setDefine("CONNECTION_VERIFIER", ACTION_PROCESSOR . "?action=DBConnectionCheck&returnType=JSON");


/***
 *  Java related objects
 */
try{
   if( class_exists("Java") ) {
	   $GLOBALS["javaClass"] = new Java('java.lang.Class');
	   setDefine("JAVA_BRIDGE_ACTIVE", true);
	} else
   	setDefine("JAVA_BRIDGE_ACTIVE", false);
} catch (JavaException $e) {
	setDefine("JAVA_BRIDGE_ACTIVE", false);
}

setDefine("JAR_BASE_DIRECTORY", __DIR__."/jar/");

/** used to specify the location of the Derby JDBC driver.
* @var  string JAVA_DB_DRIVER_DERBY */
setDefine("JAVA_DB_DRIVER_DERBY", __DIR__."/jar/derby/derbyclient.jar");

/** used to specify the location of the DB2 JDBC driver.
 * @var  string JAVA_DB_DRIVER_DB2 */
setDefineFile("JAVA_DB_DRIVER_DB2", "C:\\Program Files\\IBM\\SQLLIB\\java\\db2jcc4.jar","/home/db2inst1/SQLLIB/java/db2jcc4.jar");
setDefineFile("JAVA_DB_DRIVER_DB2_LICENSE", "C:\\Program Files\\IBM\\SQLLIB\\java\\db2jcc_license_cu.jar","/home/db2inst1/SQLLIB/java/db2jcc_license_cu.jar");
setDefineDirectory("JAVA_DB_DRIVER_JSON_NOSQL_DB2", "C:\\Program Files\\IBM\\SQLLIB\\json\\lib","/home/db2inst1/SQLLIB/json/lib/");

/******************************************************************************
 * END -  BASE FOLDERS AND FILES
 *****************************************************************************/

/******************************************************************************
 * TABLE DISPLAY SETTINGS
 *****************************************************************************/
/** The maximum number of rows to check if exists when the row count does not work
* @var  integer SQL_MAX_ROW_LOOK_AHEAD */
setDefine("SQL_MAX_ROW_LOOK_AHEAD", 500);

/** Default width of an icon
* @var  integer DEFAULT_ICON_WIDTH */
setDefine("DEFAULT_ICON_WIDTH", 20);

/** Maximum number of characters in long fields.
* @var  int LONG_FIELD_MAX */
setDefine("LONG_FIELD_MAX", 60);

/** Number of table row alternating colors
* @var  array NUMBER_OF_TABLE_ALT_COLORS
*/
setDefine("NUMBER_OF_TABLE_ALT_COLORS", 2);

/** Table row alternating colors #1
* @var  array TABLE_ALT_COLORS_0
*/
setDefine("TABLE_ALT_COLORS_0", 'id="TableRowA"');

/** Table row alternating colors #2
* @var  array TABLE_ALT_COLORS_1
*/
setDefine("TABLE_ALT_COLORS_1", 'id="TableRowB"');

/** Table title row color
* @var  array TABLE_TITLE_COLOR
*/
setDefine("TABLE_TITLE_COLOR", 'id="TableTitlerRow"');

/** Enables the table compare option by default
*@var bool COMPARE_ENABLED_BY_DEFAULT
*/
setDefine("COMPARE_ENABLED_BY_DEFAULT", false);


/******************************************************************************
 * END - TABLE DISPLAY SETTINGS
 *****************************************************************************/

/******************************************************************************
 * Ad Hoc SQL SETTINGS
 *****************************************************************************/

/**
* @var  boolean JAVA_SQL_ENABLED */
setDefine("JAVA_SQL_ENABLED", false);
/**
* @var  boolean SSH2_ENABLED */
setDefine("SSH2_ENABLED", true);

/**
* @var  boolean AD_HOC_DISPLAY_XML */
setDefine("AD_HOC_DISPLAY_XML", false);

/**
* @var  boolean AD_HOC_DISPLAY_XML_AS_INLINE */
setDefine("AD_HOC_DISPLAY_XML_AS_INLINE", false);

/**
* @var  boolean AD_HOC_DISPLAY_CLOB */
setDefine("AD_HOC_DISPLAY_CLOB", false);

/**
* @var  boolean AD_HOC_DISPLAY_CLOB_AS_INLINE */
setDefine("AD_HOC_DISPLAY_CLOB_AS_INLINE", false);

/**
* @var  boolean AD_HOC_DISPLAY_BLOB */
setDefine("AD_HOC_DISPLAY_BLOB", false);

/**
* @var  boolean AD_HOC_DISPLAY_DBCLOB */
setDefine("AD_HOC_DISPLAY_DBCLOB", false);

/**
* @var  char AD_HOC_TERMINATION_CHAR */
setDefine("AD_HOC_TERMINATION_CHAR", ";");

/**
* @var boolean AD_HOC_CURSOR */
setDefine("AD_HOC_USER_FORWARD_ONLY_CURSOR", true);

/**
* @var boolean AD_HOC_COMMIT_PER_STMT */
setDefine("AD_HOC_COMMIT_PER_STMT", false);

/**
* @var integer AD_HOC_NUMBER_OF_ROWS_TO_RETURN */
setDefine("AD_HOC_NUMBER_OF_ROWS_TO_RETURN", 100);

/**
* @var integer AD_HOC_MAX_EXECUTION_TIME */
setDefine("AD_HOC_MAX_EXECUTION_TIME", 300);

/**
* @var integer SHELL_COMMAND_MAX_RUN_TIME */
setDefine("SHELL_COMMAND_MAX_RUN_TIME", 10);

/**
* @var integer SHELL_COMMAND_TERM_CHAR */
setDefine("SHELL_COMMAND_TERM_CHAR", "");

/**
* @var string AD_HOC_SCRIPT_MODE */
setDefine("AD_HOC_SCRIPT_MODE", "SQL");
/******************************************************************************
 * END - Ad Hoc SQL SETTINGS
 *****************************************************************************/

/******************************************************************************
 * SSH SETTINGS
*****************************************************************************/
/** PHP-Java bridge for SSH availability
 * @var	bool JAVA_SSH_AVAILABLE */
setDefine("JAVA_SSH_AVAILABLE", class_exists("Java"));

/** Use PHP-Java bridge for SSH when available
 * @var	bool JAVA_SSH_ENABLED */
setDefine("JAVA_SSH_ENABLED", true);

/** Use phpseclib's Net_SSH2 for SSH availability
 * @var bool PHPSECLIB_SSH_AVAILABLE */
//@include_once('Net/SSH2.php');
setDefine("PHPSECLIB_SSH_AVAILABLE", class_exists("Net_SSH2"));
setDefine("PHPSECLIB_SSH_ENABLED", true);
setDefine("SSH_PHP_EXTENSION_AVAILABLE", extension_loaded("ssh2"));
setDefine("SSH_PHP_EXTENSION_ENABLED", true);
/******************************************************************************
 * END - SSH SETTINGS
*****************************************************************************/

/******************************************************************************
 * Start - Floating Window Options
 *****************************************************************************/
/**
* @var integer DEFAULT_FLOATING_WINDOW_HEIGHT */
setDefine("DEFAULT_FLOATING_WINDOW_HEIGHT", 500);

/**
* @var integer DEFAULT_FLOATING_WINDOW_WIDTH */
setDefine("DEFAULT_FLOATING_WINDOW_WIDTH", 700);

/******************************************************************************
 * END - Floating Window Options
 *****************************************************************************/
 
/******************************************************************************
 * Start - Math Options
 *****************************************************************************/
/**
* @var string ACCEPTED MATH OPERATIONS */
setDefine("ACCEPTED_OPERATORS", '/[+*\/\\%-]/');

/******************************************************************************
 * END - Math Options
 *****************************************************************************/

/******************************************************************************
 * Start - MQ Options
*****************************************************************************/

setDefineDirectory("MQ_JARS", "C:\\Program Files\\IBM\WebSphere MQ\\java\\lib", "/opt/IBM/WebSphere MQ/java/lib");

/******************************************************************************
 * END - MQ Options
*****************************************************************************/

/******************************************************************************
 * Start - HADOOP Options
*****************************************************************************/
setDefineDirectory("HADOOP_HOME","C:\\cygwin\\usr\\share\\hadoop\\","/usr/share/hadoop/");

/******************************************************************************
 * END - HADOOP Options
*****************************************************************************/

/******************************************************************************
 * Define command function
*****************************************************************************/
setDefine("EXCEPTION_LOG_LEVEL", 'E');
function logAndThrowException($message) {
	$errorLevel=strtolower(substr($message,0,1));
	$log=false;
	switch ($errorLevel) {
		case 'i':
			if(strtolower(EXCEPTION_LOG_LEVEL)!='i') break;
		case 'w':
			if(strtolower(EXCEPTION_LOG_LEVEL)=='i') break;
		case 'e':
			if(strtolower(EXCEPTION_LOG_LEVEL)=='i') break;
			if(strtolower(EXCEPTION_LOG_LEVEL)=='w') break;
		default:
			$log=true;
	}
	if($log) error_log($message,0);
	throw new Exception($message);
}

/**
* This line initialize the session it should be the last thing to be done in this file
*/
require_once(PHP_INCLUDE_BASE_DIRECTORY . "initializeSession.php");
require_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectConnectionManager.php");
