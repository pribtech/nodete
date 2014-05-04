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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['calculationcolumn'] = 'TableDefinitionObject_CALCULATION_COLUMN';

function TableDefinitionObject_CALCULATION_COLUMN(&$childNode, &$returnObject, &$displayElements, &$displayColumns) {
	
	if($isMainTableObject && !isset($returnObject["components"]['calculationcolumn'])) $returnObject["components"]['calculationcolumn'] = array();
	
	$calculationColumn = array();
	$calculationColumn['name'] = strtoupper($childNode->getAttribute("name"));
	
	foreach ($childNode->childNodes as $actionNode) {
		switch (strtolower($actionNode->nodeName)) {
			case 'c_title':
			case 'title':
				$calculationColumn['title'] = trim($actionNode->textContent);
				break;
			case 'formula':
				$calculationColumn['icon'] = trim($actionNode->textContent);
				break;
		}
	}
	if($displayElements != null && $displayColumns != null) {
		if(isset($displayElements['calculationcolumn'])) {
			if(!isset($displayElements['calculationcolumn'][$calculationColumn['name']])) {
				$displayElements['calculationcolumn'][$calculationColumn['name']] = true;
				$aDisplayCol = array();
				$aDisplayCol['name'] = $calculationColumn['name'];
				$aDisplayCol['type'] = 'action'; 
				$aDisplayCol['isVisible'] = false;
				$aDisplayCol['isUserHidden'] = false;
				$displayColumns[] = $aDisplayCol;
			}
		} else {
			$displayElements['calculationcolumn'] = array();
			$displayElements['calculationcolumn'][$calculationColumn['name']] = true;
			$aDisplayCol = array();
			$aDisplayCol['name'] = $calculationColumn['name'];
			$aDisplayCol['type'] = 'action'; 
			$aDisplayCol['isVisible'] = false;
			$aDisplayCol['isUserHidden'] = false;
			$displayColumns[] = $aDisplayCol;
		}
	} else if($displayElements != null && $displayColumns == null)
		$displayElements['calculationcolumn'] = true;

	$returnObject["components"]['calculationcolumn'][$calculationColumn['name']] = $calculationColumn;		
}