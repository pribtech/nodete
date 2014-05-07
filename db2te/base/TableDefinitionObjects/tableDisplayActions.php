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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['tableDisplayActions'] = 'TableDefinitionObject_tableDisplayActions';

function TableDefinitionObject_tableDisplayActions(&$childNode, &$returnObject, &$displayElements, &$displayColumns, $isMainTableObject=true) {

	if($isMainTableObject && !isset($returnObject["tableDisplayActions"])) $returnObject['tableDisplayActions'] = array();

	foreach ($childNode->childNodes as $subNode) 								
	{
		$nodename = strtolower($subNode->nodeName);
		if(	$nodename == "row_click" || 
			$nodename == "row_contextmenu" || 
			$nodename == "row_dbclick" || 
			$nodename == "row_mousedown"|| 
			
			$nodename == "rowhead_click" || 
			$nodename == "rowhead_contextmenu" || 
			$nodename == "rowhead_dbclick"|| 
			$nodename == "rowhead_mousedown" || 
			
			$nodename == "cell_click" || 
			$nodename == "cell_contextmenu"|| 
			$nodename == "cell_dbclick" || 
			$nodename == "cell_mousedown"|| 
			
			$nodename == "column_click" || 
			$nodename == "column_contextmenu"|| 
			$nodename == "column_dbclick" || 
			$nodename == "column_mousedown"|| 
			
			$nodename == "columnhead_click" || 
			$nodename == "columnhead_contextmenu"|| 
			$nodename == "columnhead_dbclick" || 
			$nodename == "columnhead_mousedown"
		)
		{
			$editNode = array();
			$editNode['enabled'] = null;
			$editNode['action'] = null;
			$editNode['menu'] = null;
			$editNode['javascriptEval'] = null;
			
			$editNode['enabled'] = strtolower($subNode->getAttribute("enabled", 'true')) === 'true' ? true : false;
			$editNode['disableLocal'] = strtolower($subNode->getAttribute("disableLocal", 'true')) === 'true' ? true : false;
			
			foreach ($subNode->childNodes as $mNode) 								
			{
				switch (strtolower($subNode->nodeName))
				{
					case "menu":
						$editNode['menu'] = JSONEncodeMenu::loadDom($mNode, "", "", null, null);
						break;
					case "menuRoot":
						$editNode['menu'] = JSONEncodeMenu::loadFile($mNode->getAttribute("folder"), "", "", null, null);
						break;
					case 'actionscript':
						$editNode['action'] = JSONEncodeAction::fromDOM($mNode);
						break;
					case 'actionscriptfile':
						$editNode['action'] = JSONEncodeAction::fromFile(TABLE_DEFINITION_DIRECTORY, $mNode->getAttribute("fileName"));
						break;
					case 'javascriptEval':
						$editNode['javascriptEval'] = $mNode->textContent;
						break;
				}
			}
			$returnObject["tableDisplayActions"][$nodename] = $editNode;
		}
	}
}