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

putenv("LANG=" . (TE_CHARACTER_SET != "" || TE_CHARACTER_SET != null ? TE_LANGUAGE . "." . TE_CHARACTER_SET : TE_LANGUAGE));
putenv("LC_ALL=". (TE_CHARACTER_SET != "" || TE_CHARACTER_SET != null ? TE_LANGUAGE . "." . TE_CHARACTER_SET : TE_LANGUAGE));
putenv("Graphic=2");

include_once(PHP_INCLUDE_BASE_DIRECTORY . "UtilGeneric.php");

$INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH = 0;

function TE_session_start() {
    if (version_compare(PHP_VERSION, '5.4.0') >= 0) {
		if (session_status() == PHP_SESSION_ACTIVE)
			session_write_close();;
	} else if (session_id() !== "") 
		session_write_close();;
		
    if (isset($SESSION_UNIQUE_PATH_ID) && $SESSION_UNIQUE_PATH_ID == true) {
        $path = getServerPath($_SERVER['SERVER_NAME'], $_SERVER['REQUEST_URI'], __FILE__);
        session_name($path);
    }

	global $INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH;
	$returnValue = @session_start();
	$INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH++;
	return $returnValue;
}

function TE_session_write_close() {
	global $INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH;
	$INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH--;
	if($INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH <= 0) {
		@session_write_close();
		$INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH = 0;
	}
}

function TE_absolute_session_write_close() {
	global $INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH;
	$INTERNAL_SESSION_START_COUNT_DO_NOT_TOUCH = 0;
	@session_write_close();
}

TE_session_start();

$language = getParameter("language");
if($language != "") {
	if(is_dir(PHP_INCLUDE_BASE_DIRECTORY . '/' . BASE_LANGUAGE_DIRECTORY . '/' . $language)) {
		@define("CURRENT_TE_LANGUAGE", $language);
	}
} else if(isset($_SESSION['CURRENT_TE_LANGUAGE'])) {
	@define("CURRENT_TE_LANGUAGE", trim($_SESSION['CURRENT_TE_LANGUAGE']) == "" && !is_dir(PHP_INCLUDE_BASE_DIRECTORY . '/' . BASE_LANGUAGE_DIRECTORY . '/' . trim($_SESSION['CURRENT_TE_LANGUAGE'])) ? TE_LANGUAGE : $_SESSION['CURRENT_TE_LANGUAGE']);
} else {
	@define("CURRENT_TE_LANGUAGE", TE_LANGUAGE);
}

include_once(PHP_INCLUDE_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY . CURRENT_TE_LANGUAGE . '/messages.php');

if(!defined('TOUCH_CONNECTION'))
	define("TOUCH_CONNECTION", strtolower(getParameter('touchConnection', 'true')));

if(!defined('RETURN_TYPE'))
  define("RETURN_TYPE", strtoupper(getParameter('returntype', 'HTML')));

define("USE_DATABASE_CONNECTION", getParameter('USE_CONNECTION', null));

define("DETAILED_VIEW", getParameter('details', 'no'));

if(!isset($_SESSION['Connections']))
	$_SESSION['Connections'] = array();

if(!isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]))
	$_SESSION['Connections'][USE_DATABASE_CONNECTION] = array();

if(array_key_exists('_LOGOUT',$_GET))
	$_SESSION['Connections'][USE_DATABASE_CONNECTION] = array();
	
if(RETURN_TYPE == "JSON")
	header('Content-type: application/json; charset=UTF-8');
else 
	header('Content-Type: text/html; charset=UTF-8');

header("Cache-control: private"); // IE 6 Fix.


if(FORCE_SECURE_CONNECTION) {
	if($HTTP_SERVER_VARS['HTTPS'] != "on") {
		header("location: https://" . $_SERVER['SERVER_NAME'] . $_SERVER['REMOTE_ADDR']);
		exit;
	}
}

/******************************************************************************
 * CALLING PANEL INFORMATION - DO NOT TOUCH
 *****************************************************************************/

/** The ID of the Page who called this link
* @var  string CALLING_PANEL */
define("CALLING_PAGE", (array_key_exists('uniqueID',$_POST) ?	$_POST['uniqueID']   : ""));

/** The stage who called this link
* @var  string CALLING_PANEL */
define("CALLING_STAGE", (array_key_exists('stageID',$_POST) ?	$_POST['stageID']   : ""));

/** The window who called this link
* @var  string CALLING_WINDOW */
define("CALLING_WINDOW", (array_key_exists('windowID',$_POST) ?	$_POST['windowID']   : ""));

/** The panel who called this link
* @var  string CALLING_PANEL */
define("CALLING_PANEL", (array_key_exists('panelID',$_POST) ?	$_POST['panelID']   : ""));

/******************************************************************************
 * END - CALLING PANEL INFORMATION - DO NOT TOUCH
 *****************************************************************************/	

/** Allows Users to view the base XML used to display a table
* @var  boolean ALLOW_DISPLAY_OF_XML */
@define("DEBUG_MODE_ENABLED", false);

if(isset($_SERVER['PHP_AUTH_USER']))
	@define("SESSION_CURRENT_USER_ID",  @$_SERVER['PHP_AUTH_USER']);
else 
	@define("SESSION_CURRENT_USER_ID",  null);
	
if(isset($_SERVER['PHP_AUTH_PW']))
	@define("SESSION_CURRENT_USER_PASSWORD", @$_SERVER['PHP_AUTH_PW']);
else
	@define("SESSION_CURRENT_USER_PASSWORD",  null);

if(	   !isset($_SESSION['CLIENT_TIME_OUT']) 
	|| !isset($_SESSION['CLIENT_USER_AGENT']) 
	|| !isset($_SESSION['CLIENT_ADDRESS'])
	) {
		$_SESSION['CLIENT_TIME_OUT'] = time();
		if( isset($_SERVER['HTTP_USER_AGENT']) )
			$_SESSION['CLIENT_USER_AGENT'] = $_SERVER['HTTP_USER_AGENT'];
		$_SESSION['CLIENT_ADDRESS'] = $_SERVER['REMOTE_ADDR'];
//		$_SESSION['PHP_AUTH_USER'] = @$_SERVER['PHP_AUTH_USER'];
//		if(isset($_SERVER['PHP_AUTH_PW']))
//			$_SESSION['PHP_AUTH_PW'] = @$_SERVER['PHP_AUTH_PW'];
}

if( 	(($_SERVER['REMOTE_ADDR'] !== $_SESSION['CLIENT_ADDRESS'] && VERIFY_ON_CLIENT_ADDRESS) 
	|| 	(isset($_SERVER['HTTP_USER_AGENT']) && $_SERVER['HTTP_USER_AGENT'] !== $_SESSION['CLIENT_USER_AGENT'] && VERIFY_ON_USER_AGENT) 
	||	($_SERVER['REMOTE_ADDR'] !== LOCK_ON_IP_ADDRESS && LOCK_ON_IP_ADDRESS !== false)) 
	) {
	foreach ($_SESSION as $key=>$value)
		$_SESSION[$key] = null;
	
	$_SESSION = array();
	session_unset();
	session_destroy();
	exit;
}
if( 	SESSION_TIMEOUT_IN_MIN !== false 
	||	(@$_SERVER['PHP_AUTH_USER'] !== @$_SESSION['PHP_AUTH_USER']) 
	||	(@$_SERVER['PHP_AUTH_PW'] !== @$_SESSION['PHP_AUTH_PW'])
	) {
	if($_SESSION['CLIENT_TIME_OUT'] < (time() - SESSION_TIMEOUT_IN_MIN * 60) ){
		foreach ($_SESSION as $key=>$value)
			$_SESSION[$key] = null;
		
		$_SESSION = array();
		session_destroy();
		session_unset();
		session_start();
	}
}
if(TOUCH_CONNECTION == "true")
	$_SESSION['CLIENT_TIME_OUT'] = time();	

if(CYCLE_SESSION_ID)
	session_regenerate_id(true);	

$_SESSION['CURRENT_TE_LANGUAGE'] = CURRENT_TE_LANGUAGE;
TE_absolute_session_write_close();
