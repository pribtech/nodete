<?php
/******************************************************************************
 *  USER PREFERENCES DIRECTORY
 *****************************************************************************/

/** User Configuration folder
* @var  string USER_PREFERENCES_DIRECTORY */

@define("DEFAULT_DATABASE_DRIVER", "IBM_DB2");
@define("DEFAULT_DATABASE", "");
@define("DEFAULT_DATABASE_USERNAME", "");
@define("DEFAULT_DATABASE_HOST_NAME", "");
@define("DEFAULT_DATABASE_PORT_NUMBER", "");
@define("DEFAULT_DATABASE_PASSWORD", "");

@define("FILE_SAVE", 0);
@define("DATABASE_SAVE", 1);
@define("CONNECTION_STORE_STORAGE_TYPE", FILE_SAVE);
@define("CONNECTION_STORE_FILE", "C:\Program Files\Zend\Apache2\htdocs\connectionStore\connStore.xml");

/** Database driver to connect with
* @var  string CONNECTION_STORE_DATABASE_DRIVER*/
@define("CONNECTION_STORE_DATABASE_DRIVER", "IBM_DB2");
@define("CONNECTION_STORE_DATABASE", "");
@define("CONNECTION_STORE_DATABASE_USERNAME", "");
@define("CONNECTION_STORE_DATABASE_SCHEMA", "");
@define("CONNECTION_STORE_DATABASE_HOST_NAME", "");
@define("CONNECTION_STORE_DATABASE_PORT_NUMBER", "");
@define("CONNECTION_STORE_DATABASE_PASSWORD", "");

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
@define("CONNECTION_STORE_SELECT_STATEMENT", "SELECT connstore FROM TE.USER_CONN_STORE where username = ?");

/** This is the insert statement used to store a users connection store file for the first time
*
* Parameters
* 1 - String - connection store XML
* 2 - String - USER ID
* @var  string - SQL STATEMENT - CONNECTION_STORE_SELECT_STATEMENT*/
@define("CONNECTION_STORE_INSERT_STATEMENT", "INSERT INTO TE.USER_CONN_STORE (connstore, username) VALUES (?, ?)");

/** This is a update statement used to update a users connection store file.
*
* Parameters
* 1 - String - connection store XML
* 2 - String - USER ID
* @var  string - SQL STATEMENT - CONNECTION_STORE_SELECT_STATEMENT*/
@define("CONNECTION_STORE_UPDATE_STATEMENT", "UPDATE TE.USER_CONN_STORE SET connstore = ? where username = ?");

/******************************************************************************
 * SESSION SETTINGS
 *****************************************************************************/

@define("SESSION_TIMEOUT_IN_MIN", 60);
@define("ENABLE_VERBOSE", true);
@define("ENABLE_APD_DEBUG", true);
@define("ALLOW_DEVELOPER_VIEW", true);
@define("ALLOW_DISPLAY_OF_XML", true);
@define("ENABLE_VIEW_QUERY", true);
@define("COMPARE_ENABLED_BY_DEFAULT", true);
@define("MAIN_MENU_ROOT_DIRECTORY", "./menu/DeveloperSwitch");
@define("HADOOP_JARS", null);
setDefine("DEVELOPMENT_MODE", true);
//setDefineDirectory("JAVA_DB_DRIVER_JSON_NOSQL_DB2", "C:\\Program Files\\IBM\\SQLLIB_E105\\json\\lib");
@define("TRACE_ACTION_CALLS", true);


