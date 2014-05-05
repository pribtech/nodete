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

function is_XMLNode($node) {
	if($node == null) return false;
	if(!is_object($node)) return false;
	if(get_class($node) !== "XMLNodeBaseObject") return false;
	return true;
}

interface XMLNodeParser_Interface {
	public static function loadXML($Document, &$XMLNode); // Return value: This node or false on error
	public static function loadXMLInternalNode($NativeNode, &$XMLNode);
}

class XMLNode {
	public $UID = null;
	public $nodeName = "";
	public $parentNode = null;
	public $textContent = "";
	public $childNodes = array();
	public $attributes = array();
	
	public final function __construct($parentNode = null, $Document = "") {
		$parentNode = $parentNode;
		$UID = uniqid();
		if($Document != "" && $Document != null)
			if($this->loadXML($Document) == false)
				error_log('XMLNode loadXML failed for '.$Document);
		return $this;
	}
	
	public final function loadXML($document) {
		if(is_string($document))
			return XMLNodeParser::loadXML($document, $this);
		return false;
	}
		
	public final function loadXMLFile($fileName) { // Return value: This node or false on error
		if(is_string($fileName))
			if(is_file($fileName) && is_readable($fileName))
				return $this->loadXML(file_get_contents($fileName));
		return false;	
	}
	
	public final function outputXML() { // Return value: String representation of the XML node and all children
		$attributes = "";
		foreach($this->attributes as $key=>$value)
			$attributes .= htmlspecialchars($key,  ENT_QUOTES, "UTF-8") . '="' . htmlspecialchars($value,  ENT_QUOTES, "UTF-8") . '" ';
		
		$returnString = "		
<{$this->nodeName} {$attributes}";
		
		if($this->textContent != "" && count($this->childNodes) > 0) {
			$returnString = ">\n".$this->textContent != "" ? "<![CDATA[" . $this->textContent . "]]>\n" : "";
	
			foreach($this->childNodes as $node)
					$returnString .= $node->outputXML();
			
			$returnString = "
	</{$this->nodeName}>
";
		} else 
			$returnString .= "/>";
	}
	
	public final function outputXMLFile($fileName) { // Return value: boolean
		if(is_string($fileName))
			if(is_writable($fileName))
				return file_put_contents($fileName, $this->outputXML());
		return false;
	}
	
	public final function getAttribute($attributeName, $defaultAttributeValue = "") { //Return value: attribut Value or the default value if none is found
		if($attributeName != null && $attributeName != "" && is_string($attributeName))
			if(array_key_exists($attributeName, $this->attributes))
				return $this->attributes[$attributeName];
		return $defaultAttributeValue;
	}
	
	public final function setAttribute($attributeName, $attributeValue) { //Return value: attribut Value or false on failure
		if(is_array($attributeValue) || is_object($attributeValue))
			return false;
			
		if(!is_string($attributeValue))
			$attributeValue = strval($attributeValue);
		
		if($attributeName != null && $attributeName != "" && is_string($attributeName)) {
			$this->attributes[$attributeName] = $attributeValue;
			return $this->attributes[$attributeName];
		}
		return false;
	}
	
	public final function removeAttribute($attributeName) {
		if($attributeName != null && $attributeName != "" && is_string($attributeName)) {
			unset($this->attributes[$attributeName]);
			return true;
		}
		return false;
	}
	
	public final function getElementsByTagName($nodeName) { //Return value: XMLNodeBaseObject if found or false if not
		$nodeList = array();
		foreach($this->childNodes as $node)
			if($node->nodeName == $nodeName)
				$nodeList[] = $node;
		return $nodeList;
	}
	
	
	public final function createNewChild($nodeName) { //Return value: created XMLNodeBaseObject if successful or false on failure 
		$newNode = new XMLNode();
		$this->childNodes[] = $newNode;
	}
	
	public function isSameNode($node) {
		return ($this->UID == $node->UID);
	}
	
	public function hasChildNodes() {
		return (count($this->childNodes) > 0);
	}
	
	public function findChildNode($NodeName) {
		if(count($this->childNodes) > 0)
			foreach ($this->childNodes as $childNode)
				if(strcasecmp($childNode->nodeName, $NodeName) == 0)
					return $childNode;
		return null;
	}
	
	public function getChildTextContent($NodeName, $defaultValue = "")	{
		if(count($this->childNodes) > 0)
			foreach ($this->childNodes as $childNode)
				if(strcasecmp($childNode->nodeName, $NodeName) == 0)
					return trim($childNode->textContent);
		return $defaultValue;
	}
	
	public final function arrayEncodeXML($maskText = true) {
		$returnObject = array();
		
		if(count($this->childNodes) === 0 && count($this->attributes) === 0) {
			$value = trim($this->textContent);
			if(strtolower($value) == 'true')
				$value = true;
			elseif(strtolower($value) == 'false')
				$value = false;
				
			if($maskText)
				$returnObject['@text'] = $value;
			else 
				$returnObject = $value;
		} else {
			if(count($this->attributes) > 0)
				$returnObject['@attributes'] = $this->attributes;
			if(count($this->childNodes) > 0)
			{
				foreach($this->childNodes as $childNode)
				{
					if(array_key_exists($childNode->nodeName, $returnObject) === false)
						$returnObject[$childNode->nodeName] = $childNode->arrayEncodeXML($maskText);
					else if(is_array($returnObject[$childNode->nodeName])) {
						if(!array_key_exists(0, $returnObject[$childNode->nodeName]))
							$returnObject[$childNode->nodeName] = array($returnObject[$childNode->nodeName], $childNode->arrayEncodeXML());
						else 
							$returnObject[$childNode->nodeName][] = $childNode->arrayEncodeXML($maskText);
					}
					else 
						$returnObject[$childNode->nodeName] = array($returnObject[$childNode->nodeName], $childNode->arrayEncodeXML());
				}
			} else 
				$returnObject['@text'] = trim($this->textContent);
		}
		return $returnObject;
	}
	
	public final function JSONEncodeXML() {
		return json_encode(this.arrayEncodeXML());
	}
}
?>