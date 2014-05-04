<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
 *
 *  Updated author: Peter Prib
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.
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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['column'] = 'TableDefinitionObject_COLUMN';

function TableDefinitionObject_COLUMN(&$childNode, &$returnObject, &$displayElements, &$displayColumns) {
	
	if(!isset($returnObject["components"]['column'])) $returnObject["components"]['column'] = array();
	
	$componentAvalibility = array();
	$componentAvalibility['value'] = true;
	
	$aColumn = array();

	EncodeVersion($childNode,$aColumn);
	
	$aColumn['nameRaw']		= $childNode->getAttribute("name");
	$aColumn['name']		= strtoupper($aColumn['nameRaw']);
	$aColumn['sql_name']	= $aColumn['name'];
	$aColumn['title']		= $aColumn['name'];
	$aColumn['isSearchable'] = true;
	$aColumn['canDrill'] = true;
	$aColumn['sort_enable']	= true;
	$aColumn["components"] 	= array();
	$aColumn["editable"] = true;
	$aColumn["auto_generated"] = false;
	$aColumn['dimension'] = $childNode->getAttribute("dimension");
	$aColumn['measure'] = strtolower($childNode->getAttribute("measure"));
	$aColumn['isAccumulation'] = (strtoupper($childNode->getAttribute("accumulation"))=='Y');
	$aColumn['compareDefault'] = !(strtoupper($childNode->getAttribute("compareDefault"))=='N');
	$aColumn['nullable'] = !(strtolower($childNode->getAttribute("nullable"))=='false');
	$aColumn['xmlSchema'] = $childNode->getAttribute("xmlSchema");
	if($aColumn['isAccumulation'] && $aColumn['measure'] !=null)
		throw new Exception("Accumulation cannot be measure, column: ".$aColumn['name']);
	$aColumn['isCubeAttribute'] = ($aColumn['measure']!=null||$aColumn['dimension']!=null);
	foreach ($childNode->childNodes as $subNode) 								
		TableDefinitionObject_COLUMN_CORE_PARSER($subNode, $aColumn,$componentAvalibility,$returnObject);
	
	$aColumn['componentAvalibility'] = array_keys($componentAvalibility);
	if($displayElements !== null && $displayColumns !== null) {
		if(isset($displayElements['column'])) {
			if(!isset($displayElements['column'][$aColumn['name']])) {
				$displayElements['column'][$aColumn['name']] = true;
				$aDisplayCol = array();
				$aDisplayCol['name'] = $aColumn['name'];
				$aDisplayCol['type'] = 'column'; 
				$aDisplayCol['isVisible'] = false;
				$aDisplayCol['isUserHidden'] = false;
				$displayColumns[] = $aDisplayCol;
			}
		} else {
			$displayElements['column'] = array();
			$displayElements['column'][$aColumn['name']] = true;
			$aDisplayCol = array();
			$aDisplayCol['name'] = $aColumn['name'];
			$aDisplayCol['type'] = 'column'; 
			$aDisplayCol['isVisible'] = false;
			$aDisplayCol['isUserHidden'] = false;
			$displayColumns[] = $aDisplayCol;
		}
	} else if($displayElements !== null && $displayColumns === null)
		$displayElements['action'] = true;
	if(isset($aColumn['generated']))
		if($aColumn['generated']!="") {
			$aColumn['sql_name']	= null;
			$aColumn["editable"] = false;
		}
	$aColumn['name'] = trim($aColumn['name'], ".");
	$returnObject["components"]["column"][$aColumn['name']] = $aColumn;
}

function TableDefinitionObject_MASK(&$childNode, &$returnObject, &$componentAvalibility) {
	foreach($childNode->childNodes as $baseMaskNode) {
		if(strtolower($baseMaskNode->nodeName) == 'value_mask') {
			$maskNode = array();
			$maskNode['value'] = $baseMaskNode->getAttribute("value");
			foreach($baseMaskNode->childNodes as $maskNodes) {
				$nodeName = strtolower($maskNodes->nodeName);
				switch($nodeName) {
					case "mask":
						$maskNode['mask'] = trim($maskNodes->textContent);
						$componentAvalibility['mask'] = true;
						break;
					case "link":
						$maskNode['link'] = trim($maskNodes->textContent);
						$componentAvalibility['link'] = true;
						break;
					case "image":
						$maskNode['image'] = trim($maskNodes->textContent);
						$componentAvalibility['image'] = true;
						break;
					default:
						if(isset(ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS[$nodeName])) {
							$tempFunction = ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS[$nodeName];
							$nullVaule = null;
							$tempFunction($maskNodes, $maskNode, $componentAvalibility, $nullVaule, false);
						}
						break;
				}
			}
			$returnObject[$maskNode['value']] = $maskNode;
		}
	}
}