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

?>

var GLOBAL_CONSTANTS = $H();
var DB2MC_SERVER = location.href.substr(0, location.href.lastIndexOf('/')); 
GLOBAL_CONSTANTS.set("DB2MC_SERVER", DB2MC_SERVER.replace("http://", ""));
<?php
writeJSConstant(
		array(
			'ACTION_PROCESSOR',
			'AD_HOC_DISPLAY_XML',
			'AD_HOC_DISPLAY_XML_AS_INLINE',
			'AD_HOC_DISPLAY_CLOB',
			'AD_HOC_DISPLAY_CLOB_AS_INLINE',
			'AD_HOC_DISPLAY_BLOB',
			'AD_HOC_DISPLAY_DBCLOB',
			'AD_HOC_TERMINATION_CHAR',
			'AD_HOC_USER_FORWARD_ONLY_CURSOR',
			'AD_HOC_COMMIT_PER_STMT',
			'AD_HOC_NUMBER_OF_ROWS_TO_RETURN',
			'AD_HOC_MAX_EXECUTION_TIME',
			'AD_HOC_SCRIPT_MODE',
			'ALLOW_DISPLAY_OF_XML',
			'ALLOW_DEVELOPER_VIEW',
			'CONNECTION_VERIFIER',
			'CONNECTED',
			'DEBUG_LOG_2_CONSOLE',
			'DEFAULT_FLOATING_WINDOW_HEIGHT',
			'DEFAULT_FLOATING_WINDOW_WIDTH',
			'DEFAULT_ICON_WIDTH',
			'DEVELOPMENT_MODE',
			'DISCONNECTED',
			'DMC_IS_PUBLICLY_HOSTED',
			'ENABLE_VIEW_QUERY',
			'ENABLE_VERBOSE',
			'FORCE_CONNECTION_WITH_DEFAULT',
			'HTML_BASE_DIRECTORY',
			'IE_SPEED_EXTENSION',
			'IMAGE_BASE_DIRECTORY',
			'JAVA_SSH_AVAILABLE',
			'JAVA_SSH_ENABLED',
			'JAVA_SQL_ENABLED',
			'JS_BASE_DIRECTORY',
			'LONG_FIELD_MAX',
			'MAJOR_VERSION',
			'MENU_PROCESSOR',
			'MINOR_VERSION',
			'SUB_VERSION',
			'PHPSECLIB_SSH_AVAILABLE',
			'PHPSECLIB_SSH_ENABLED',
			'SHELL_COMMAND_MAX_RUN_TIME',
			'SHELL_COMMAND_TERM_CHAR',
			'SHOW_IE_PERFORMANCE_WARNING',
			'SSH2_ENABLED',
			'SSH_PHP_EXTENSION_AVAILABLE',
			'SSH_PHP_EXTENSION_ENABLED',
			'TUTORIAL_BASE_DIRECTORY'
		)
	);
@define("INDEX_LOAD", true);
$TableDefinitionObjectsDirectory = dir(USER_PREFERENCES_DIRECTORY); 
$includeFile = "";
while(($includeFile = $TableDefinitionObjectsDirectory->read()) !== false) 
{ 
	 if (preg_match("/^config_.+\\.php$/", $includeFile))
	  	 include_once(USER_PREFERENCES_DIRECTORY . $includeFile);
} 
	
$TableDefinitionObjectsDirectory = dir("./"); 
$includeFile = "";
while(($includeFile = $TableDefinitionObjectsDirectory->read()) !== false) 
{
	if (preg_match('/^config_(.)+\.php$/', $includeFile) >= 1)
	  	 include_once("./" . $includeFile);
}
?>

var CONNECTED_DATABASE = null; 
GLOBAL_CONSTANTS.set("CONNECTED_DATABASE", null);
var CONNECTED_DATABASE_VERSION = null; 
GLOBAL_CONSTANTS.set("CONNECTED_DATABASE_VERSION", null);