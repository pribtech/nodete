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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeAction.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeTutorial.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class ArrayEncodeActionPanel {
	
	static function fromFile($filename) {
		if(file_exists($filename))
			return ArrayEncodeActionPanel::fromString(file_get_contents($filename));
		return FILE_NOT_FOUND;
	}
	
	static function fromString($actionXML) {
		if($actionXML != "") {
			try  {
				$doc = new XMLNode();
				if($doc->loadXML($actionXML) == false)
					return XML_LOAD_ERROR;
     			return ArrayEncodeActionPanel::fromDOM($doc);
			} catch (Exception $e) {
				return UNKNOWN_ERROR;
			}
		}
		return EMPTY_FILE;		
	}
	
	static function fromDOM($actionXMLnode) {
		$OLDDefaultStage = JSONEncodeMenu::$defaultStage;
		$stageID = uniqid(); 
		JSONEncodeMenu::$defaultStage = $stageID ;
		$actionPanel = array();
		if($actionXMLnode->hasChildNodes()) {
			$actionPanel['stage'] = $stageID;
			$actionPanel['flow'] = strtolower($actionXMLnode->getChildTextContent("flow", "controlled")) == "free" ? false : true;
			$actionPanel['useConsole'] = $actionXMLnode->getChildTextContent("useConsole", false);
			$actionPanel['overview'] = trim($actionXMLnode->getChildTextContent("overview", false), '"');
			$actionPanel['tasks'] = ArrayEncodeActionPanel::encodeTaskList($actionXMLnode);
		}
		JSONEncodeMenu::$defaultStage = $OLDDefaultStage;
		EncodeVersion($actionXMLnode,$actionPanel);
		
		return $actionPanel;
	}
	
	static function encodeTaskList($node) {
		$Value = array();
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $taskListNode) {
				if(strcasecmp($taskListNode->nodeName, "taskList") == 0) {
					if($taskListNode->hasChildNodes()) {
						foreach ($taskListNode->childNodes as $taskNode) {
							if(strcasecmp($taskNode->nodeName, "task") == 0) {
								$task = array();
								$task['id'] = CALLING_PAGE . "_" . uniqid();
								$task['name'] = $taskNode->getAttribute("name");
								$task['description'] = trim($taskNode->getChildTextContent("discription", $taskNode->getChildTextContent("description", false)), '"');
								$task['action'] =  JSONEncodeAction::fromDOM($taskNode->findChildNode("action", $taskNode));
								$Value[] = $task;
							}
						}
					}
				}
			}
		}
		return $Value;
	}
}
