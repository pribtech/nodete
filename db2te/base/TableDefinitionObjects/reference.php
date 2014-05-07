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

ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS['reference'] = 'TableDefinitionObject_REFERENCE';
ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS['c_reference'] = 'TableDefinitionObject_REFERENCE';

function TableDefinitionObject_REFERENCE(&$childNode, &$returnObject, &$displayElements, &$displayColumns, $isMainTableObject=true) {
	
	if($isMainTableObject && !isset($returnObject["components"]['reference'])) $returnObject["components"]['reference'] = array();
	
	$references = array();
	$references['name'] = strtoupper($childNode->getAttribute("name"));
	$references['navigator'] = strtoupper($childNode->getAttribute("navigator"));
	//This is used to indicate if a given reference should be excluded from inclusions in the right click menus
	$references['includeInSubMenu'] = strtoupper($childNode->getAttribute("name")) == "FALSE" ? false : true;
	$references['ref'] = array();
	
	EncodeVersion($childNode,$returnObject);
	
	foreach ($childNode->childNodes as $actionNode) {
		switch (strtolower($actionNode->nodeName)) {
			case 'c_title':
			case 'title':
				$references['title'] = trim($actionNode->textContent);
				break;
			case 'reftype':
				$references['reftype'] = trim($actionNode->textContent);
				break;
			case 'refvalue':
				$references['refvalue'] = trim($actionNode->textContent);
				break;
			case 'icon':
				$references['icon'] = trim($actionNode->textContent);
				break;
			case 'displaycolumnsset':
				$references['displayColumnsSet'] = trim($actionNode->textContent);
				break;
			case 'panel':
			case 'frame':
				$references['frame'] = trim($actionNode->textContent);
				break;
			case 'window':
				$references['window'] = trim($actionNode->textContent);
				break;
			case 'stage':
				$references['stage'] = trim($actionNode->textContent);
				break;
			case 'refaction':
				$references['refaction'] = trim($actionNode->textContent);
				break;
			case 'reference':
			case 'ref':
				$ref = array();
				$ref['foreign_column_name'] = $actionNode->getAttribute("foreign_column_name");
				if($ref['foreign_column_name']=='')
					$ref['foreign_column_name'] = $actionNode->getAttribute("foreignColumnName");
				foreach ($actionNode->childNodes as $aNode) {
					switch (strtolower($aNode->nodeName)){
						case 'localcolumnname':
						case 'local_column_name':
							$ref['local_column_name'] = trim($aNode->textContent);
							break;
						case 'value':
							$ref['value'] = trim($aNode->textContent);
							break;
						case 'comparetype':
							$ref['comparetype'] = trim($aNode->textContent);
							break;
						case 'expression':
						case 'operator':
							include_once(PHP_INCLUDE_BASE_DIRECTORY . "ArrayEncodeExpression.php");
							$ref['expression'] =ArrayEncodeExpression($aNode);
							break;
					}
				}
				$references['ref'][] = $ref;
				break;
		}
	}
	if($displayElements !== null && $displayColumns !== null) {
		if(isset($displayElements['reference'])) {
			if(!isset($displayElements['reference'][$references['name']])) {
				$displayElements['reference'][$references['name']] = true;
				$aDisplayCol = array();
				$aDisplayCol['name'] = $references['name'];
				$aDisplayCol['type'] = 'reference'; 
				$aDisplayCol['isVisible'] = false;
				$aDisplayCol['isUserHidden'] = false;
				$displayColumns[] = $aDisplayCol;
			}
		} else {
			$displayElements['reference'] = array();
			$displayElements['reference'][$references['name']] = true;
			$aDisplayCol = array();
			$aDisplayCol['name'] = $references['name'];
			$aDisplayCol['type'] = 'reference'; 
			$aDisplayCol['isVisible'] = false;
			$aDisplayCol['isUserHidden'] = false;
			$displayColumns[] = $aDisplayCol;
		}
	} else if($displayElements !== null && $displayColumns === null)
		$displayElements['reference'] = true;
	if($isMainTableObject)
		$returnObject["components"]['reference'][$references['name']] = $references;
	else 
		$returnObject['reference'] = $references;
}