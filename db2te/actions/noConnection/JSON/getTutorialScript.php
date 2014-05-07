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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeTutorial.php");

$currentMenuLocation = getParameter('currentMenuLocation', "");
$script = getParameter('script', "");
$tutorial = getParameter('tutorialName', "");

$returnObject = array();

$returnObject['returnCode'] = false;
$returnObject['returnValue'] = 'Unknown error';
try{
	if($tutorial == "" || !preg_match(FILE_VERIFICATION_REGEX, $tutorial))
		throw new Exception('No tutorial was given');
		//These lines setup for menu encoding
	JSONEncodeMenu::$defaultStage = CALLING_PAGE . '_stage';
	JSONEncodeMenu::$defaultWindow = "_blank";	
	if($script!=="") 
		$returnObject['returnValue'] = JSONEncodeTutorial::fromString($script,$currentMenuLocation);
	else if(file_exists("./".$tutorial))
		$returnObject['returnValue'] = JSONEncodeTutorial::fromFile("./",$tutorial);
	else if(file_exists(TUTORIAL_BASE_DIRECTORY.$tutorial))
		$returnObject['returnValue'] = JSONEncodeTutorial::fromFile(TUTORIAL_BASE_DIRECTORY,$tutorial);
	else {
		$GLOBALS['CURRENT_DIRECTORY'] = $currentMenuLocation . "/" . $tutorial . "/";
		$GLOBALS['CURRENT_TUTORIAL'] = $GLOBALS['CURRENT_DIRECTORY'];
		if(strcasecmp(TUTORIAL_BASE_DIRECTORY, substr($GLOBALS['CURRENT_DIRECTORY'], 0, strlen(TUTORIAL_BASE_DIRECTORY))) == 0)
			$GLOBALS['CURRENT_TUTORIAL'] = substr($GLOBALS['CURRENT_DIRECTORY'], strlen(TUTORIAL_BASE_DIRECTORY));
		$tutorialFile = $currentMenuLocation . "/" . $tutorial . "/";
		$returnObject['returnValue'] = JSONEncodeTutorial::fromFile($tutorialFile, "tutorialScript.xml");
	}
	$returnObject['returnCode'] = true;
} catch (Exception $e) {
	$returnObject['returnValue'] = $e->getMessage();
}
echo json_encode($returnObject);