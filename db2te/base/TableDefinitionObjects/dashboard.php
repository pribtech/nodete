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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['dashboard'] = 'TableDefinitionObject_DASHBOARD';

function TableDefinitionObject_DASHBOARD(&$mainNode, &$returnObject, &$displayElements, &$displayColumns) {
	if(!isset($returnObject["components"]['dashboard'])) $returnObject["components"]['dashboard'] = array();

	$dashboardNode = array();
	
	$dashboardNode['type'] = strtoupper($mainNode->getAttribute("type", "default"));
	$dashboardNode['name'] = strtoupper($mainNode->getAttribute("name", "default"));
	$dashboardNode['gauges'] = array();
	
	if($mainNode->hasChildNodes())
	{
		foreach($mainNode->childNodes as $childNode)
		{
			switch (strtolower($childNode->nodeName))
			{
				
				case 'keycolumn':
					$dashboardNode['keycolumn'] = trim($childNode->textContent) == "" ? null : strtoupper(trim($childNode->textContent));
					break;					
				case 'rotatedcolumninfo':
					$dashboardNode['rotatedcolumninfo']	= array();						
					foreach($childNode->childNodes as $rotateInfoNode)
					{
						switch(strtolower($rotateInfoNode->nodeName))
						{
							case 'namecolumn':
								$dashboardNode['rotatedcolumninfo']['nameColumn'] = $rotateInfoNode->textContent == "" ? null : trim($rotateInfoNode->textContent);
								break;
							case 'valuecolumn':
								$dashboardNode['rotatedcolumninfo']['valueColumn'] = $rotateInfoNode->textContent == "" ? null : trim($rotateInfoNode->textContent);
								break;
						}
					}
					break;
				case 'gauge':
					$guage = array();
					$guage['dataType'] = strtoupper($childNode->getAttribute("dataType", "text")); //text, num, or percent
					$guage['dataColumn'] = strtoupper(strtoupper($childNode->getAttribute("dataColumn", null)));
					$guage['dataIdentifyer'] = strtoupper($childNode->getAttribute("dataIdentifyer", null));
					$guage['calculation'] = strtoupper($childNode->getAttribute("calculation ", "name/100.0"));
					$guage['displayValues'] = array();
					$guage['title'] = "";
					foreach($childNode->childNodes as $childGuageNode)
					{
						switch(strtolower($childGuageNode->nodeName))
						{
							case 'display':
								$guage['displayType'] = $childGuageNode->textContent == "text" ? null : trim($childGuageNode->textContent); //text, inlinebar, historical
								break;
							case 'info':
								$guage['info'] = trim($childGuageNode->textContent) == "" ? null : trim($childGuageNode->textContent);
								break;
							case 'title':
								$guage['title'] = $childGuageNode->textContent == "" ? null : trim($childGuageNode->textContent);
								break;
						}
					}
					$dashboardNode['gauges'][] = $guage;
					break;
			}
		}
	}
	$returnObject["components"]["dashboard"][$dashboardNode['name']] = $dashboardNode;
}

