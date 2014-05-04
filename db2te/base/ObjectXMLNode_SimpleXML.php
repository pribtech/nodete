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
		$doc = simplexml_load_string($Document);
		if($doc !== false)
		{
			if(is_a($doc,'SimpleXMLElement'))
			{
				$XMLNode->nodeName = $doc->getName();
				XMLNodeParser::loadXMLInternalNode($doc, $XMLNode);
			}
			return $XMLNode;
		}
		return false;
	}
	
	public static function loadXMLInternalNode($NativeNode, &$XMLNode)
	{

		if(is_a($NativeNode,'SimpleXMLElement'))
		{
			if(count($NativeNode->children()) == 0 && isset($NativeNode[0]))
			{
				$XMLNode->textContent = (string)$NativeNode[0];
			} 
			foreach ($NativeNode->attributes() as $index=>$attr) 
			{
				$XMLNode->attributes[$index] = (string)stripslashes($attr);
			}

			foreach ($NativeNode->children() as $nodeName=>$childNativeNode) 
			{
				$newXMLNode = new XMLNode($XMLNode);
				$XMLNode->childNodes[] = $newXMLNode;
				$newXMLNode->nodeName = trim($nodeName);
				XMLNodeParser::loadXMLInternalNode($childNativeNode, $newXMLNode);
			}
		}
	}
}
