<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved..
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

$actionFile = rawurldecode(getParameter('file',""));
$actionXML  = getParameter('XML',"");

try {
	if($actionFile != "") {
		if(file_exists(TE_SCRIPTS_BASE_DIRECTORY.$actionFile.'.xml')) {
			$actionXML=file_get_contents(TE_SCRIPTS_BASE_DIRECTORY.$actionFile.'.xml');
		} else if(file_exists(TE_SCRIPTS_BASE_DIRECTORY.$actionFile)) {
			$actionXML=file_get_contents(TE_SCRIPTS_BASE_DIRECTORY.$actionFile);
		} else throw new Exception('File "'.$actionFile.'" in directory "'.TE_SCRIPTS_BASE_DIRECTORY.'" not found');
	} 
	if($actionXML != "")  {
		$nodeType=substr(strrchr($actionXML, '<'),2);
		$nodeType = strtolower(trim(strstr($nodeType, '>', true)));
		switch ($nodeType) {
			case 'action':
			case 'actionscript':
				$returndata['scriptType'] = 'action';
				$returndata['returnValue'] = JSONEncodeAction::fromString($actionXML);
				break;
			case 'tutorial':
				include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeTutorial.php");
				JSONEncodeMenu::$defaultStage = CALLING_PAGE . '_stage';
				JSONEncodeMenu::$defaultWindow = "_blank";
				$returndata['scriptType'] = 'tutorial';
				$returndata['returnValue'] = JSONEncodeTutorial::fromString($actionXML,TE_SCRIPTS_BASE_DIRECTORY);
				break;
			default:
				throw new Exception("loadaction unknown type: ".$nodeType);
		}
	} else throw new Exception("Both file and XML are not specified");
	$returndata['returnCode'] = "true";
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	$returndata['returnValue'] = "Failed: ".$e->getmessage();
}

echo json_encode($returndata);

?>

