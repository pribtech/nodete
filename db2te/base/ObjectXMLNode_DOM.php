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

class XMLNodeParser implements XMLNodeParser_Interface {

	static function HandleXmlError($errno, $errstr, $errfile, $errline) {
		if ($errno==E_WARNING && (substr_count($errstr,"DOMDocument::loadXML()")>0))
			throw new Exception( "error xml load: ".$errstr);
		else
			return false;
	}
	
	
	public static function loadXML($Document="", &$XMLNode) {
		try {
			if($Document=="") throw new Exception( "Null or empty xml");
			$doc = new DOMDocument();
			set_error_handler('XMLNodeParser::HandleXmlError');
			if(@$doc->loadXML($Document)) {
				restore_error_handler();
				foreach ($doc->childNodes as $childNativeNode)  {
					if($childNativeNode->nodeType == XML_ELEMENT_NODE && $childNativeNode->nodeType != XML_COMMENT_NODE) {
						XMLNodeParser::loadXMLInternalNode($childNativeNode, $XMLNode);
						break;
					}
 				}
				return $XMLNode;
			}
			error_log('XMLNodeParser::loadXML exception xml: '.$Document,0);
			return false;
		} catch (Exception $e)	{
			restore_error_handler();
			error_log("XMLNodeParser::loadXML error: ".$e->getMessage()." Document: ".$Document,0);
			error_log("Stack trace: ".var_export($e->getTrace(),true));
			throw $e;
		}
	}
	
	public static function loadXMLInternalNode($NativeNode, &$XMLNode) {
		
		$XMLNode->nodeName = $NativeNode->nodeName;
		$XMLNode->textContent = $NativeNode->textContent;

		if($NativeNode->attributes != null)
			foreach ($NativeNode->attributes as $index=>$attr) 
				$XMLNode->attributes[$index] = stripslashes($attr->value);

		if($NativeNode->childNodes != null)
			foreach ($NativeNode->childNodes as $childNativeNode) 
				if($childNativeNode->nodeType == XML_ELEMENT_NODE && $childNativeNode->nodeType != XML_COMMENT_NODE) {
					$newXMLNode = new XMLNode($XMLNode);
					$XMLNode->childNodes[] = $newXMLNode;
					XMLNodeParser::loadXMLInternalNode($childNativeNode, $newXMLNode);
				}
	}
}
