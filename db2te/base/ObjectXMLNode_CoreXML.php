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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNodeBaseObject.php");

class XMLNodeParser implements XMLNodeParser_Interface 
{
	
	public static function loadXML($Document, &$XMLNode)
	{
		$baseData = array();
    	$parser = xml_parser_create('');
		xml_parser_set_option($parser, XML_OPTION_TARGET_ENCODING, "UTF-8");
	    xml_parser_set_option($parser, XML_OPTION_CASE_FOLDING, 0);
	    xml_parser_set_option($parser, XML_OPTION_SKIP_WHITE, 1);
		xml_parse_into_struct($parser, $Document, $baseData);

		XMLNodeParser::loadXMLInternalNode($baseData, $XMLNode);

		xml_parser_free($parser);
		return $XMLNode;

	}
	
	public static function loadXMLInternalNode($NativeNode, &$XMLNode)
	{
		$firstNode = true;
		$currentParent = $XMLNode;
		$currentNode = $XMLNode;
		$stack = array();
		foreach($NativeNode as $node)
		{
			if($node['type'] == 'complete' || $node['type'] == 'open')
			{
				
				$currentNode = $firstNode ? $currentNode : new XMLNode($currentParent);
				if(!$firstNode)
					$currentParent->childNodes[] = $currentNode;
				$firstNode = false;
				$currentNode->nodeName = $node['tag'];
				$currentNode->textContent = isset($node['value']) ? $node['value'] : null;
			}

			if(isset($node['attributes']))
			{
				foreach ($node['attributes'] as $index=>$attr) 
				{
					$currentNode->attributes[$index] = stripslashes($attr);
				}
			}
			
			if($node['type'] == 'open')
			{
				array_push($stack, $currentParent);
				$currentParent = $currentNode;
			}
			else if($node['type'] == 'close')
			{
				$currentParent = array_pop($stack);
			}
		}
		
	}
}
