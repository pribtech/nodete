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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['dynamiccolumnsimple'] = 'TableDefinitionObject_DYNAMCI_COLUMN_SIMPLE';

function TableDefinitionObject_DYNAMCI_COLUMN_SIMPLE(&$childNode, &$returnObject, &$displayElements, &$displayColumns) {
	
	if(!isset($returnObject["components"]['dynamiccolumnsimple'])) $returnObject["components"]['dynamiccolumnsimple'] = array();

	$componentAvalibility = array();
	$componentAvalibility['value'] = true;
	
	$dynamiccolumnsimple = array();
	$dynamiccolumnsimple['name'] = strtoupper($childNode->getAttribute("name", "dynamiccolumnsimple"));
	$dynamiccolumnsimple['type'] = strtoupper($childNode->getAttribute("type", "rate"));
	$dynamiccolumnsimple['interval'] = strtoupper($childNode->getAttribute("interval", "1"));
	$dynamiccolumnsimple['column'] = strtoupper($childNode->getAttribute("column"));
	$dynamiccolumnsimple['columnSecondary'] = strtoupper($childNode->getAttribute("columnSecondary", ""));
	$dynamiccolumnsimple['dataType'] = strtoupper($childNode->getAttribute("dataType", ""));
	$dynamiccolumnsimple['title'] = $childNode->getAttribute("title", "Dynamic : " . $dynamiccolumnsimple['type']);
	$dynamiccolumnsimple['sort_enable'] = false;
	$dynamiccolumnsimple['isSearchable'] = false;
	$dynamiccolumnsimple['canDrill'] = false;
	$dynamiccolumnsimple["components"] 	= array();
	$dynamiccolumnsimple['fieldType'] = 'n';
	
	
	foreach ($childNode->childNodes as $subNode) 								
	{
		TableDefinitionObject_COLUMN_CORE_PARSER($subNode, $dynamiccolumnsimple,$componentAvalibility,$returnObject);
	}

	$dynamiccolumnsimple['componentAvalibility'] = array_keys($componentAvalibility);
	
	if($displayElements !== null && $displayColumns !== null)
	{
		if(isset($displayElements['dynamiccolumnsimple']))
		{
			if(!isset($displayElements['dynamiccolumnsimple'][$dynamiccolumnsimple['name']]))
			{
				$displayElements['dynamiccolumnsimple'][$dynamiccolumnsimple['name']] = true;
				$aDisplayCol = array();
				$aDisplayCol['name'] = $dynamiccolumnsimple['name'];
				$aDisplayCol['type'] = 'dynamiccolumnsimple'; 
				$aDisplayCol['isVisible'] = false;
				$aDisplayCol['isUserHidden'] = false;
				$displayColumns[] = $aDisplayCol;
			}
		}
		else 
		{
			$displayElements['dynamiccolumnsimple'] = array();
			$displayElements['dynamiccolumnsimple'][$dynamiccolumnsimple['name']] = true;
			$aDisplayCol = array();
			$aDisplayCol['name'] = $dynamiccolumnsimple['name'];
			$aDisplayCol['type'] = 'dynamiccolumnsimple'; 
			$aDisplayCol['isVisible'] = false;
			$aDisplayCol['isUserHidden'] = false;
			$displayColumns[] = $aDisplayCol;
		}
	} else if($displayElements !== null && $displayColumns === null)
	{
		$displayElements['dynamiccolumnsimple'] = true;
	}

	$returnObject["components"]['dynamiccolumnsimple'][$dynamiccolumnsimple['name']] = $dynamiccolumnsimple;		
}