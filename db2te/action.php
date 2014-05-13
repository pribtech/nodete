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

require_once("./config.php");

/**
 * The following is to trap time outs and report these issues.
**/
function actionShutDown() {
	if(defined("TRACE_ACTION_CALLS"))
		if(TRACE_ACTION_CALLS) {
			error_log("action trace request: ".var_export($_GET,true),0); 
			error_log("action trace last error: ".var_export(error_get_last(),true),0); 
			error_log("action trace response (max 100 chars): ".substr(ob_get_contents(),0,100),0); 
		}
	$errormsg = error_get_last();
	if($errormsg==null || $errormsg=="") {
		if(ob_get_length()>0) exit();
		$error="Timed out as it was running too long, refresh or change request";
	} else {
		error_log("action raised error call: ".var_export($_GET,true)." error: ".var_export($errormsg,true),0); 
		$error=$errormsg['message'];
	}
	if(ob_get_length()>0) exit();
	if(RETURN_TYPE == "JSON") {
		$errormsgEncoded = rawurlencode($error);
		echo <<<JSON
			{
				flagGeneralError: true,
				connectionError:false,
				returnCode: "false",
				returnValue: "$errormsgEncoded"
			}
JSON;
	} else
		print($error);
}
ob_start();
register_shutdown_function('actionShutDown');

$metaConn = false;

$action = getParameter("action", "");
$tableName = NULL;
$schemaName = NULL;

$table = NULL;

$tableName   = getParameter("table");
$schemaName  = getParameter("schema", "");
if($schemaName == "")
	$schemaName  = getParameter("SCHEMA", "");
/**
 ****************************NOTE*******************************
 * DANGER THE FOLLOWING ACTION CAN BE A POTENTIAL SECURITY HOLE
 ***************************************************************
 * Do not trust user input, a well formed parameter could run any PHP
 * script with the code below if not checked.
 *
 * So... the following rules will apply to an action command
 * it can only be composed of Alphabetic, Numeric and the characters '_'
 * and '-'. Any action command that contains anything else should
 * run the default action
 */
try {
	if(!preg_match('/^[a-zA-Z0-9_\/-]+$/', $action))
		throw new Exception("Poorly formed action: ".$action);
	if(file_exists(ACTION_DIRECTORY_ACTIVE_CONNECTION . "/" . RETURN_TYPE . "/" . $action . ".php"))
		if(connectionManager::isConnected())  {
			callAction(ACTION_DIRECTORY_ACTIVE_CONNECTION . "/" . RETURN_TYPE . "/" . $action . ".php");
			exit();
		}
	if( file_exists(ACTION_DIRECTORY_NO_CONNECTION . "/" . RETURN_TYPE . "/" . $action . ".php"))  {
		callAction(ACTION_DIRECTORY_NO_CONNECTION . "/" . RETURN_TYPE . "/" . $action . ".php");
		exit();
	}
	
	if(file_exists(ACTION_DIRECTORY_ACTIVE_CONNECTION . "/" . RETURN_TYPE . "/" . $action . ".php")) {
		if(RETURN_TYPE == "JSON")
			NoConnectionMessageJSON();
		else
			NoConnectionMessageHTML();
		exit();
	}
} catch(Exception $err){
	if(RETURN_TYPE == "JSON") {
		$errormsg = rawurlencode($err);
			echo <<<JSON
			{
				flagGeneralError: true,
				connectionError:false,
				returnCode: "false",
				returnValue: "$errormsg"
			}
JSON;
	} else 
		print($err);
	exit();
}

if(RETURN_TYPE == "JSON") {
	$returnObject = array();
	$returnObject['flagGeneralError'] = true;
	$returnObject['connectionError'] = false;
	$returnObject['returnCode'] = "false";
	if(!isset($action) || $action=='' || $action==null)
		$returnObject['returnValue'] = 'No action parameter found, call GET: '.var_export($_GET,true).' POST: '.var_export($_GET,true);
	else
		$returnObject['returnValue'] = str_replace('?ACTION?', $action, ACTION_NOT_FOUND_W_NAME);
	echo json_encode($returnObject);
	exit();
}

my_header(ACTION_NOT_FOUND, "");
if(!isset($action) || $action=='' || $action==null)
	echo "\n<table style='width:100%;height:100%'><tr><td align='center'>" . 'No action parameter found, call GET: '.var_export($_GET,true).' POST: '.var_export($_GET,true) . "</td></tr></table>";
else
	echo "\n<table style='width:100%;height:100%'><tr><td align='center'>" . str_replace('?ACTION?', $action, ACTION_NOT_FOUND_W_NAME) . "</td></tr></table>";
?>