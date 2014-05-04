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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['graph'] = 'TableDefinitionObject_GRAPH';

function TableDefinitionObject_GRAPH(&$mainNode, &$returnObject, &$displayElements, &$displayColumns) {
	if(!isset($returnObject["components"]['graph'])) $returnObject["components"]['graph'] = array();
	
	$source = array();
			
	$source['name'] = strtoupper($mainNode->getAttribute("name", "default"));
	if($mainNode->hasChildNodes()) {
		foreach($mainNode->childNodes as $childNode) {
			switch (strtolower($childNode->nodeName)) {								
				case 'title':	
					$source['title'] = $childNode->textContent == "" ? "No Title" : trim($childNode->textContent);
					break;
				case 'type':
					$source['type'] = $childNode->textContent == "" ? "line" : trim($childNode->textContent);
					break;
				case 'style':
					$source['style'] = array();
					foreach($childNode->childNodes as $styleNode) {
						switch(strtolower($styleNode->nodeName)) {
							case 'legend':
								$source['style']['legend'] = array();
								foreach($styleNode->childNodes as $legendNode) {
									switch(strtolower($legendNode->nodeName)) {
										case 'display':
											$source['style']['legend']['display'] = trim($legendNode->textContent) == "" ? "right" : trim($legendNode->textContent);
											break;
									}
								}
								break;
							default:
								if($styleNode->hasChildNodes())
									$source['style'][$styleNode->nodeName] = $styleNode->arrayEncodeXML(false);
								else  {
									$source['style'][$styleNode->nodeName] = $styleNode->textContent;
									if(strtolower($styleNode->textContent) == 'true')
										$source['style'][$styleNode->nodeName] = true;
									else if(strtolower($styleNode->textContent) == 'false')
										$source['style'][$styleNode->nodeName] = false;
								}
						}
					}
					break;
				case 'polling':
					$source['polling'] = trim($childNode->textContent) == "" ? 0 : trim($childNode->textContent);
					break;
			}
		}
	}
	$returnObject["components"]["graph"][$source['name']] = $source;
}

