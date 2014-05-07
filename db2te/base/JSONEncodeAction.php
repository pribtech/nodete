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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "EncodeVersion.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenu.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class JSONEncodeAction {
	
	static function addArrayAttributes(&$node,&$array) {
		foreach ($node->attributes as $index=>$attr) 
			$array["$".$index] = $attr;
	}

	static function fromFile($directory, $filename) {
		if(file_exists($directory.$filename))
			return JSONEncodeAction::fromString(file_get_contents($directory . $filename));
		return null;
	}
	
	static function fromString($actionXML) {
		if($actionXML == "") return null;
		try  {
				$doc = new XMLNode();
				if($doc->loadXML($actionXML) !== false)
					return JSONEncodeAction::fromDOM($doc);
			} catch (Exception $e) {
			}
		return null;		
	}
	
	static function fromDOM($actionXMLnode) {
		if(is_object($actionXMLnode)) {
			if($actionXMLnode->hasChildNodes()) {
				$returnObject = array();
				self::addArrayAttributes($actionXMLnode,$returnObject);
				EncodeVersion($actionXMLnode,$returnObject);
				$returnObject["suppressAutomaticErrors"] = $actionXMLnode->getAttribute("suppressAutomaticErrors");
				$returnObject["suppressAutomaticErrors"] = $returnObject["suppressAutomaticErrors"] == "true" ?  true : false;
				
				$returnObject["lockScreen"] = $actionXMLnode->getAttribute("lockScreen");
				$returnObject["lockScreen"] = strtolower($returnObject["lockScreen"]) == "true" ? true : false;

				$returnObject["type"] = "action";
				$returnObject["name"] = $actionXMLnode->getAttribute("name");
				$returnObject["actionType"] = $actionXMLnode->getAttribute("type");
				$returnObject["message"] = $actionXMLnode->getChildTextContent("message");
				$returnObject["parameterList"] = JSONEncodeAction::encodeParameterList($actionXMLnode);
				$returnObject["schema"] = $actionXMLnode->getChildTextContent("schema");
				$returnObject["tasks"] = JSONEncodeAction::encodeFollowOnAction($actionXMLnode);
				return $returnObject;
			}
		}
		return null;
	}
	
	static function encodeParameterList($node) {
		$returnObject = array();
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				if(strcasecmp($childNode->nodeName, "parameterList") == 0) {
					if($childNode->hasChildNodes()) {
						foreach ($childNode->childNodes as $parameterNode) {
							if(strcasecmp($parameterNode->nodeName, "parameter") == 0)
								$returnObject[] = JSONEncodeAction::encodeParameterNode($parameterNode);
						}
					}
				}
			}
		}
		return $returnObject;
	}

	static function encodeParameters($node) {
		$returnObject = array();
		if($node->hasChildNodes())
			foreach ($node->childNodes as $parameterNode)
				if(strcasecmp($parameterNode->nodeName, "parameter") == 0)
					$returnObject[] = JSONEncodeAction::encodeParameterNode($parameterNode);
		return $returnObject;
	}
	
	static function encodeFollowOnAction($node) {
		$returnObject = array();
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				if(strcasecmp($childNode->nodeName, "followOnAction") == 0 || strcasecmp($childNode->nodeName, "if") == 0 || strcasecmp($childNode->nodeName, "ifNot") == 0)
					$returnObject[] = JSONEncodeAction::encodeFollowOnActionNode($childNode);
				if(strcasecmp($childNode->nodeName, "task") == 0)
					$returnObject[] = array("type" => "task", "taskList" => JSONEncodeAction::encodeTask($childNode));
				if(strcasecmp($childNode->nodeName, "declareActions") == 0) {
					$taskList = JSONEncodeAction::encodeTask($childNode);
					array_unshift($taskList["tasks"], array("type"=>"break"));
					$returnObject[] = array("type" => "task", "taskList" => $taskList);
				}
			}
		}
		return $returnObject;
	}
	
	static function encodeFollowOnActionNode($childNode) {
		$returnObject = array();
		$negCon = strtolower($childNode->getAttribute("negCondition"));
		$negCon = strtolower($negCon) == "true" ? true : (strcasecmp($childNode->nodeName, "ifNot") == 0 ? true : false);
		
		$conditionCompareType = $childNode->getAttribute("conditionCompairType");
		$conditionCompareType = $conditionCompareType == "" ? $childNode->getAttribute("conditionCompareType") : $conditionCompareType;
		$conditionCompareType = $conditionCompareType == "" ? $childNode->getAttribute("op") : $conditionCompareType;
		
		$returnObject["type"] = "IF";
		$returnObject["name"] = $childNode->getAttribute("name");
		$returnObject["originalAction"] = "$childNode->nodeName";
		$returnObject["negCondition"] = $negCon;
		$returnObject["compareOn"] = $childNode->getAttribute("compareOn");
		$returnObject["compareOnType"] = $childNode->getAttribute("compareOnType");
		$returnObject["condition"] = $childNode->getAttribute("condition");
		$returnObject["conditionType"] = $childNode->getAttribute("conditionType");
		$returnObject["conditionCompareType"] = $conditionCompareType;
		
		self::setAttribute($childNode,"valueA"		,"compareOn","RAW");
		self::setAttribute($childNode,"valueB"		,"condition","RAW");
		self::setAttribute($childNode,"blockA"		,"compareOn","BLOCKVALUE");
		self::setAttribute($childNode,"blockB"		,"condition","BLOCKVALUE");
		self::setAttribute($childNode,"paramA"		,"compareOn","CONSTANT");
		self::setAttribute($childNode,"paramB"		,"condition","CONSTANT");
		self::setAttribute($childNode,"returnValueA"	,"compareOn","RETURNOBJECT");
		self::setAttribute($childNode,"returnValueB"	,"condition","RETURNOBJECT");
		self::setAttribute($childNode,"fixedA"		,"compareOn","FIXED");
		self::setAttribute($childNode,"fixedB"		,"condition","FIXED");
		
		$returnObject["taskList"] = JSONEncodeAction::encodeTaskList($childNode);
		return $returnObject;
		
	}
	
	static function getAttribute (&$childNode,$name,$default=null) {
		$value = $childNode->getAttribute($name);
		if($value==null)
		 	return $default;
		return $value;
	}
	
	static function setAttribute (&$childNode,$name,$action,$type) {
		$value = $childNode->getAttribute($name);
		if($value == "") return;
		$returnObject[$action] = $value;
		$returnObject[$action."Type"] = $type;
	}
	
	static function encodeParameterNode($node) {
		if($node == null)
			return null;
		$returnObject = array();
		self::addArrayAttributes($node,$returnObject);
		$returnObject["type"] = $node->nodeName;
		$returnObject["name"] = $node->getAttribute("name");
		$returnObject["parameterType"] = $node->getAttribute("type");
		$returnObject["title"] = $node->getAttribute("title");
		$returnObject["transform"] = $node->getAttribute("transform");
		$returnObject["value"] = $node->getChildTextContent("value");
		$returnObject["defaultValue"] = $node->getChildTextContent("defaultValue");
		$returnObject["check"] = JSONEncodeAction::encodeCheckNode($node->findChildNode("check"));
		$returnObject["xpathBaseNode"] = $node->getAttribute("xpathBaseNode");
		$returnObject["xpathName"] = $node->getAttribute("xpathName");
		$returnObject["xpathValue"] = $node->getAttribute("xpathValue");
		return $returnObject;
	}
	
	static function encodeCheckNode($node) {
		if($node == null)
			return null;
		
		$returnObject = array();
		
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				$negCondition = null;
				switch ($childNode->nodeName) {	
					case "if":
					case "onMatch":
						$negCondition = false;
						break;
					case "ifNot":
					case "onNonMatch":
						$negCondition = true;
						break;	
				}
				if($negCondition !== null) {
					$MatchNode = array();
					EncodeVersion($childNode,$MatchNode);
					$conditionCompareType = $childNode->getAttribute("conditionCompairType");
					$conditionCompareType = $conditionCompareType == "" ? $childNode->getAttribute("conditionCompareType") : $conditionCompareType;
					$MatchNode["originalAction"] = "$childNode->nodeName";
					$MatchNode["type"] = "IF";
					$MatchNode["negCondition"] = $negCondition;
					$MatchNode["condition"] = $childNode->getAttribute("condition");
					$MatchNode["conditionType"] = $childNode->getAttribute("conditionType");
					$MatchNode["conditionCompareType"] = $conditionCompareType;
					$MatchNode["taskList"] = JSONEncodeAction::encodeTaskList($childNode);
					$returnObject[] = $MatchNode;
				}
			}
		}
			
		return $returnObject;
	}
	
	static function encodeMath($taskNode) {
		$returnObject = array();
		$returnObject["type"] = $taskNode->nodeName;
		$returnObject["operator"] = $taskNode->getAttribute("operator");		
		$returnObject["expression_id"] = $taskNode->getAttribute("expression_id");
		$returnObject["parameters"] = array();
		if(preg_match(ACCEPTED_OPERATORS, $returnObject["operator"])){		
			foreach($taskNode->childNodes as $childNode) {
				switch($childNode->nodeName) {
				case "parameter":		
					$returnObject["parameters"][] = JSONEncodeAction::encodeParameterNode($childNode);
					break;		
				case "set":
					$returnObject["parameters"][] = JSONEncodeAction::encodeMath($childNode);
					break;				
				}
			}
		} else
			 $returnObject = array("type"=>"alert", "message" => str_replace(array('?NODE?', '?PARAMETER_NAME?'), array($taskNode->outputXML(),$returnObject["operator"]), INVALID_PARAMETER));

		return $returnObject;
	}
	
	static function encodeTaskList($node) {
		$returnObject = array();
		if($node->hasChildNodes())
			foreach ($node->childNodes as $childNode) 
				if(strcasecmp($childNode->nodeName, "task") == 0)
					$returnObject[] = JSONEncodeAction::encodeTask($childNode);
		return $returnObject;
	}
	
	static function encodeTask($childNode) {
		$returnObject = array();
		$returnObject["type"] = "taskList";
		$returnObject["repeat"] = $childNode->getAttribute("repeat");
		if($returnObject["repeat"] == null) $returnObject["repeat"] = 1;
		$returnObject["tasks"] = array();
		EncodeVersion($childNode,$returnObject);
		
		foreach ($childNode->childNodes as $taskNode) {
			switch ($taskNode->nodeName) {
				case "for":
					$returnObject["tasks"][] = array("type"=>"forbegin","iterate"=>$taskNode->getAttribute("iterate"),"source"=>$taskNode->getAttribute("source"));
					$returnObject["tasks"][] = array(
							 "type"=>$taskNode->nodeName
							,"taskList"=>JSONEncodeAction::encodeTaskList($taskNode)
						);
					$returnObject["tasks"][] = array("type"=>"forend");
					break;
				case "if":
				case "ifNot":
				case "followOnAction":
					$returnObject["tasks"][] = JSONEncodeAction::encodeFollowOnActionNode($taskNode);
					break;
				case "alert":
					$returnObject["tasks"][] = array("type"=>"alert", "message" => trim($taskNode->textContent));
					break;
				case "sendConsole":
				case "sendconsole":
				case "echo":
					$returnObject["tasks"][] = array("type"=>"sendconsole", "message"=> trim($taskNode->textContent));
					break;
				case "math":
					$returnObject["tasks"][] = JSONEncodeAction::encodeMath($taskNode);
					break;
				case "newWindow":
					$returnObject["tasks"][] =array_merge(JSONEncodeAction::encodeParameterNode($taskNode)
														,array(  "dataType"=> self::getAttribute($taskNode,"dataType")
																,"fileName"=> self::getAttribute($taskNode,"fileName")
																,"disposition"=> self::getAttribute($taskNode,"disposition")
																,"base64"=> self::getAttribute($taskNode,"base64","false")
																,"headerOptions"=> self::getAttribute($taskNode,"headerOptions","")
																)
														);
					break;
				case "setGlobal":
				case "assignSharedConstant":
				case "setLocal":
				case "assignLocalParameter":
					$returnObject["tasks"][] = JSONEncodeAction::encodeParameterNode($taskNode);
					break;					
				case "action":
					$returnObject["tasks"][] = JSONEncodeAction::fromDOM($taskNode);
					break;
				case "loadPage":
					$returnObject["tasks"][] = array("type" => "loadPage",
										"links" => JSONEncodeMenu::retrieveLinksFromDOM($taskNode),
										"pageLayouts"=> JSONEncodeMenu::encodePageWindowsFromDOM($taskNode));
					break;
				case "setActionReturn":
					$returnObject["tasks"][] = array("type"=>"setActionReturn", "value"=> $taskNode->getAttribute("value"), "parameterType"=> $taskNode->getAttribute("type", "fixed"));
					break;
				case "breakIf":
				case "breakControlGroup":
					$returnObject["tasks"][] = array("type"=>"breakControlGroup");
					break;
				case 'windowReload' :
				case "blockUpdate":
				case "break":
				case "breakCheck":
				case "return":
				case "exit":
				case "lock":
				case "lockScreen":
				case "unlock":
				case "unlockScreen":
				case "displayLocalVariables":
					$returnObject["tasks"][] = array("type"=>$taskNode->nodeName);
					break;
				case "callAction":
				case "gotoAction":
					$returnObject["tasks"][] = array("type"=>"callAction", "name"=> $taskNode->getAttribute("name"));
					break;
				case "callGlobalAction":
					$returnObject["tasks"][] = array("type"=>$taskNode->nodeName, "name"=> $taskNode->getAttribute("name")
							,"parameter"=>JSONEncodeAction::encodeParameters($taskNode)
						);
					break;
				case "panelReload":
				case "retry":
				case "setContext":
					$returnObject["tasks"][] = array("type"=>$taskNode->nodeName, "name"=> $taskNode->getAttribute("name"));
					break;
				case "openContextMenu":
					$returnObject["tasks"][] = array("type"=>"openContextMenu", "baseDir"=>$taskNode->getAttribute("baseDir"));
					break;
				case "getConnection":
					$returnObject["tasks"][] = JSONEncodeAction::encodeParameterNode($taskNode);
					break;
				case "runJavaScript":
					$returnObject["tasks"][] = array("type"=>$taskNode->nodeName, "value"=> $taskNode->getAttribute("value"));
					break;
				case "wait":
				case "pause":
					$returnObject["tasks"][] = array("type"=>"wait", "seconds"=> $taskNode->getAttribute("seconds"));
					break;
				case "parallel":
					$tasks=array();
					foreach($taskNode->childNodes as $childNode)
						switch($childNode->nodeName) {
							case "task":		
								$tasks[] = array("type" => "task", "taskList" => JSONEncodeAction::encodeTask($childNode));
								break;	
						}
					$returnObject["tasks"][] = array("type"=>$taskNode->nodeName,"tasks"=>$tasks);
					break;
				default:
					$returnObject["tasks"][] = array("type"=>"unknownTask","nodeName"=>$taskNode->nodeName);				}
		}
		return $returnObject;
	}
}
	
?>