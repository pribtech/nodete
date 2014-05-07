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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['dataManipulation'] = 'TableDefinitionObject_dataManipulation';

function TableDefinitionObject_dataManipulation(&$childNode, &$returnObject, &$displayElements, &$displayColumns, $isMainTableObject=true) {

	if($isMainTableObject && !isset($returnObject["dataManipulation"])) $returnObject['dataManipulation'] = array();

	foreach ($childNode->childNodes as $subNode) 								
	{
		$nodename = strtolower($subNode->nodeName);
		if(	$nodename == "edit" || 
			$nodename == "delete" || 
			$nodename == "create" || 
			$nodename == "createlike" ||
			$nodename == 'inlineedit'
		)
		{
			$editNode = array();
			$editNode['enabled'] = null;
			$editNode['type'] = null;
			$editNode['data'] = null;
			
			
			$editNode['enabled'] = strtolower($subNode->getAttribute("enabled", 'true')) === 'true' ? true : false;
			
			foreach ($subNode->childNodes as $mNode) 								
			{
				switch (strtolower($subNode->nodeName))
				{
					case "menu":
						$editNode['type'] = 'menu';
						$editNode['data'] = JSONEncodeMenu::loadDom($mNode, "", "", null, null);
						break;
					case "menuRoot":
						$editNode['type'] = 'menu';
						$editNode['data'] = JSONEncodeMenu::loadFile($mNode->getAttribute("folder"), "", "", null, null);
						break;
					case 'actionscript':
						$editNode['type'] = 'action';
						$editNode['data'] = JSONEncodeAction::fromDOM($mNode);
						break;
					case 'actionscriptfile':
						$editNode['type'] = 'action';
						$editNode['data'] = JSONEncodeAction::fromFile(TABLE_DEFINITION_DIRECTORY, $mNode->getAttribute("fileName"));
						break;
					case 'javascriptEval':
						$editNode['type'] = 'js';
						$editNode['data'] = $mNode->textContent;
						break;
				}
			}
			$returnObject["dataManipulation"][$nodename] = $editNode;
		}
	}
}