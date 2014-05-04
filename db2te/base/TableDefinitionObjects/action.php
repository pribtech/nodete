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

ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS['action'] = 'TableDefinitionObject_ACTION';
ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS['c_action'] = 'TableDefinitionObject_ACTION';

function TableDefinitionObject_ACTION(&$childNode, &$returnObject, &$displayElements, &$displayColumns, $isMainTableObject=true) {
	
	if($isMainTableObject && !isset($returnObject["components"]['action'])) $returnObject["components"]['action'] = array();
	
	$actionScript = array();
	EncodeVersion($childNode,$actionScript);
	$actionScript['name'] = strtoupper($childNode->getAttribute("name"));
	//This is used to indicate if a given action should be excluded from inclusions in the right click menus
	$actionScript['includeInSubMenu'] = strtoupper($childNode->getAttribute("name")) == "FALSE" ? false : true;
	
	foreach ($childNode->childNodes as $actionNode) {
		switch (strtolower($actionNode->nodeName)) {
			case 'c_title':
			case 'title':
				$actionScript['title'] = trim($actionNode->textContent);
				break;
			case 'icon':
				$actionScript['icon'] = trim($actionNode->textContent);
				break;
			case 'actionscript':
				$actionScript['actionScript'] = JSONEncodeAction::fromDOM($actionNode);
				break;
			case 'actionscriptfile':
				$actionScript['actionScript'] = JSONEncodeAction::fromFile(TABLE_DEFINITION_DIRECTORY, $actionNode->getAttribute("fileName"));
				break;
		}
	}
	if($displayElements !== null && $displayColumns !== null) {
		if(isset($displayElements['action'])) {
			if(!isset($displayElements['action'][$actionScript['name']])) {
				$displayElements['action'][$actionScript['name']] = true;
				$aDisplayCol = array();
				$aDisplayCol['name'] = $actionScript['name'];
				$aDisplayCol['type'] = 'action'; 
				$aDisplayCol['isVisible'] = false;
				$aDisplayCol['isUserHidden'] = false;
				$displayColumns[] = $aDisplayCol;
			}
		} else {
			$displayElements['action'] = array();
			$displayElements['action'][$actionScript['name']] = true;
			$aDisplayCol = array();
			$aDisplayCol['name'] = $actionScript['name'];
			$aDisplayCol['type'] = 'action'; 
			$aDisplayCol['isVisible'] = false; 
			$aDisplayCol['isUserHidden'] = false;
			$displayColumns[] = $aDisplayCol;
		}
	} else if($displayElements !== null && $displayColumns === null)
		$displayElements['action'] = true;
	if($isMainTableObject)
		$returnObject["components"]['action'][$actionScript['name']] = $actionScript;	
	else 
		$returnObject['action'] = $actionScript;	
}