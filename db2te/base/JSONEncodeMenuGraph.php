<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2009 All rights reserved.
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

require_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeAction.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class JSONEncodeMenuGraph {
	
	static $defaultTarget = "_self";
	static $defaultWindow = "_self";
	static $defaultStage = null;
	
	static function encodeGraph($rootNode)
	{
		$graphDef = null;
		if($rootNode != null && $rootNode->hasChildNodes())
		{
			$graphDef['title'] = "No Title";
			$graphDef = array();
			foreach($rootNode->childNodes as $childNode)
			{
				switch(strtolower($childNode->nodeName))
				{
					case 'title':
						$graphDef['title'] = trim($childNode->textContent);
						break;
					case 'graphtype':
						$graphDef['graphType'] = trim($childNode->textContent);
						break;
					case 'xfield':
						$graphDef['xField'] = trim($childNode->textContent);
						break;
					case 'yfield':
						$graphDef['yField'] = trim($childNode->textContent);
						break;
					case 'datafield':
						$graphDef['dataField'] = trim($childNode->textContent);
						break;
					case 'categoryfield':
						$graphDef['categoryField'] = trim($childNode->textContent);
						break;
					case 'responseschema':
						$graphDef['responseSchema']['Fields'] = array();
						foreach($childNode->childNodes as $schemaField)
						{
							$graphDef['responseSchema']['Fields'][] = trim($schemaField->textContent);
						}
						break;
					case 'style':						
						foreach($childNode->childNodes as $style)
						{
							if($style->hasChildNodes())
							{
								foreach($style->childNodes as $styleSubNode)
								{
									$graphDef['style'][$style->nodeName][$styleSubNode->nodeName] = trim($styleSubNode->textContent);
								}
							}
							else
							{
								$graphDef['style'][$style->nodeName] = trim($style->textContent);
							}
						}
						break;
					case 'seriesdefinitions':
						$graphDef['seriesDef'] = array();
						foreach($childNode->childNodes as $key=>$series)
						{
							$graphDef['seriesDef'][$key] = array();
							foreach($series->childNodes as $details)
							{								
								if(strcasecmp($details->nodeName, "style") == 0)
								{
									$graphDef['seriesDef'][$key]['style'] = array();
									foreach($details->childNodes as $style)
									{
										$graphDef['seriesDef'][$key]['style'][$style->nodeName] = trim($style->textContent);
									}
								}
								else
								{
									$graphDef['seriesDef'][$key][$details->nodeName] = trim($details->textContent);
								}
							}
						}
						break;
					case 'datasets':
						$graphDef['datasets'] = array();
						$tmpArray = array();
						foreach($childNode->childNodes as $dataset)
						{
							foreach($dataset->childNodes as $data)
							{
								if(is_numeric($data->getAttribute('value')))
								{								
									$tmpArray[$data->getAttribute('field')] = intval($data->getAttribute('value', 0));
								}
								else
								{
									$tmpArray[$data->getAttribute('field')] = $data->getAttribute('value', 0);
								}						
							}
							$graphDef['datasets'][] = $tmpArray;
						}				
						break;
					default:
						break;
				}
			}
		}
		return $graphDef;		
	}
}
