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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['dynamiccolumn'] = 'TableDefinitionObject_DYNAMCI_COLUMN';

function TableDefinitionObject_DYNAMCI_COLUMN(&$childNode, &$returnObject, &$displayElements, &$displayColumns) {
	
	if(!isset($returnObject["components"]['dynamiccolumn'])) $returnObject["components"]['dynamiccolumn'] = array();

	$componentAvalibility = array();
	$componentAvalibility['value'] = true;
	
	$dynamicColumn = array();
	$dynamicColumn['name'] = strtoupper($childNode->getAttribute("name", "dynamiccolumn"));
	$dynamicColumn['type'] = strtoupper($childNode->getAttribute("type", "rate"));
	$dynamicColumn['interval'] = strtoupper($childNode->getAttribute("interval", "1"));
	$dynamicColumn['column'] = strtoupper($childNode->getAttribute("column"));
	$dynamicColumn['columnSecondary'] = strtoupper($childNode->getAttribute("columnSecondary", ""));
	$dynamicColumn['dataType'] = strtoupper($childNode->getAttribute("dataType", ""));
	$dynamicColumn['title'] = $childNode->getAttribute("title", "Dynamic : " . $dynamicColumn['type']);
	$dynamicColumn['sort_enable'] = true;
	$dynamicColumn["components"] 	= array();
	$dynamicColumn['fieldType'] = 'n';
	
	foreach ($childNode->childNodes as $subNode) 								
		TableDefinitionObject_COLUMN_CORE_PARSER($subNode, $dynamicColumn,$componentAvalibility,$returnObject);

	$dynamicColumn['componentAvalibility'] = array_keys($componentAvalibility);
	
	if($displayElements !== null && $displayColumns !== null) {
		if(isset($displayElements['dynamiccolumn'])) {
			if(!isset($displayElements['dynamiccolumn'][$dynamicColumn['name']])) {
				$displayElements['dynamiccolumn'][$dynamicColumn['name']] = true;
				$aDisplayCol = array();
				$aDisplayCol['name'] = $dynamicColumn['name'];
				$aDisplayCol['type'] = 'dynamiccolumn'; 
				$aDisplayCol['isVisible'] = false;
				$aDisplayCol['isUserHidden'] = false;
				$displayColumns[] = $aDisplayCol;
			}
		} else {
			$displayElements['dynamiccolumn'] = array();
			$displayElements['dynamiccolumn'][$dynamicColumn['name']] = true;
			$aDisplayCol = array();
			$aDisplayCol['name'] = $dynamicColumn['name'];
			$aDisplayCol['type'] = 'dynamiccolumn'; 
			$aDisplayCol['isVisible'] = false; 
			$aDisplayCol['isUserHidden'] = false;
			$displayColumns[] = $aDisplayCol;
		}
	} else if($displayElements !== null && $displayColumns === null)
		$displayElements['dynamiccolumn'] = true;

	$returnObject["components"]['dynamiccolumn'][$dynamicColumn['name']] = $dynamicColumn;		
}