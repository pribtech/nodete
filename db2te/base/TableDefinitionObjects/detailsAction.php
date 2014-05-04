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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['detailaction'] = 'TableDefinitionObject_DETAIL_ACTION';

function TableDefinitionObject_DETAIL_ACTION(&$childNode, &$returnObject, &$displayElements, &$displayColumns, $isMainTableObject=true) {
	
	$actionScript = array();
	foreach ($childNode->childNodes as $actionNode) 								
	{
		switch (strtolower($actionNode->nodeName))
		{
			case 'actionscript':
				$actionScript = JSONEncodeAction::fromDOM($actionNode);
				break;
			case 'actionscriptfile':
				$actionScript = JSONEncodeAction::fromFile(TABLE_DEFINITION_DIRECTORY, $actionNode->getAttribute("fileName"));
				break;
		}
	}
	$returnObject["detailsAction"] = $actionScript;
}