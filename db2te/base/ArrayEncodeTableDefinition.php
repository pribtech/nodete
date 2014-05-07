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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "EncodeVersion.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenu.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'JSONEncodeAction.php');
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'JSONEncodeMenu.php');

//This code includes all php file in the folder TableDefinitionObjects under the base directory
$TableDefinitionObjectsDirectory = dir(PHP_INCLUDE_BASE_DIRECTORY . 'TableDefinitionObjects/'); 
$includeFile = "";
while(($includeFile = $TableDefinitionObjectsDirectory->read()) !== false) { 
 if (substr($includeFile, -4) == '.php') 
 	 include_once(PHP_INCLUDE_BASE_DIRECTORY . 'TableDefinitionObjects/' . $includeFile);
} 
$TableDefinitionObjectsDirectory->close();
$includeFile = "";

class ArrayEncodeTableDefinition {
	
	static $GENERIC_XML_OBJECTS  = array(); // can be used both in the root of the object and as a column mask
	static $ROOT_XML_OBJECTS = array(); // can only appear in the root of the object
	
	static function fromFile($directory, $filename) {
		if(file_exists($directory.$filename))
			return ArrayEncodeTableDefinition::fromString(file_get_contents($directory . $filename));
		return null;
	}
	
	static function fromString($actionXML) {
		if($actionXML == "") return null;
		try {
			$doc = new XMLNode();
			if($doc->loadXML($actionXML) == false) return null;
			return array_merge( ArrayEncodeTableDefinition::fromDOM($doc) , array("sourceXML" => $actionXML ) );
		} catch (Exception $e){	}
		error_log('ArrayEncodeTableDefinition::fromString exception xlm: '.$actionXML,0);
		return null;
	}
	
	static function fromDOM(&$tableDefNode) {
		if(is_object($tableDefNode)) {
			if($tableDefNode->hasChildNodes()) {
				$displayElements = array();
				
				$returnObject = array();
				
				$returnObject["queryType"] = "table";
				$returnObject["tableName"] = 'Not Given';
				$returnObject["singularName"] = "";
				$returnObject["pluralName"] = "";
				$returnObject["description"] = "";
				$returnObject["edit"] = "N";
				$returnObject["new"] = "N";
				$returnObject["rowsPerPage"] = 100;
				$returnObject["max_execution_time"] = AD_HOC_MAX_EXECUTION_TIME;
				$returnObject["dynamicInterval"] = 1;
				$returnObject["orderBy"] = array();
				$returnObject["baseQuery"] = '';
				$returnObject["commonTableExpressions"] = array();
				$returnObject["otherTablesToInclude"] = array();
				$returnObject["displayColumns"] = array();
				$returnObject['parameters'] = array();
				$returnObject["renderBase"] = array();
				$returnObject["primaryKeys"] = array();
				$returnObject["components"] = array();
				$returnObject["modules"] = array();
				$returnObject["moduleOverride"] = array();
				$returnObject["history"] = null;
				$returnObject["compare"] = array();
				$returnObject["enableCompare"] = COMPARE_ENABLED_BY_DEFAULT;
				$returnObject["output"] = array();
				$returnObject["ignoreSQLWarnings"] = (strtolower($tableDefNode->getAttribute("ignoreSQLWarnings")) == 'true' ? true : false);
				$returnObject["useConnectWithTag"] = $tableDefNode->getAttribute("useConnectWithTag", null);
				$returnObject["tableMenu"] = null; 
				$returnObject["baseResultSet"] = 0;
				$returnObject["messages"] = array();
				
				$returnObject['reloadindicator'] = array();
				$returnObject['reloadindicator']['ageIndicator'] = true;
				$returnObject['reloadindicator']['fullScreenNotifier'] = false;
				$returnObject['reloadindicator']['threshHold'] = 0;
				
				foreach ($tableDefNode->childNodes as $childNode) {
					switch (strtolower($childNode->nodeName)) {
						case "dynamicinterval":
							$dynamicColumn['dynamicInterval'] = intval($childNode->getAttribute("time", "1"));
							break;
						case "menu":
							if($returnObject["tableMenu"] == null) $returnObject["tableMenu"] = array();
							$returnObject["tableMenu"][] = JSONEncodeMenu::loadDom($childNode, "", "", null, null);
							break;
						case "dataretrievalaction":
							$returnObject["dataRetrievalAction"] = $childNode->getAttribute("name");
						case "commontableexpressions":
							foreach ($childNode->childNodes as $commonTableExpression) {
								switch(strtolower($commonTableExpression->nodeName)) {
									case "inline":
										$returnObject["commonTableExpressions"][] = trim($commonTableExpression->textContent);
										break;
									case "externalfile":
										$returnObject["commonTableExpressions"][] = file_get_contents(TABLE_DEFINITION_DIRECTORY . $commonTableExpression->getAttribute("fileName"));
										break;
									case "externalqueryfile":
										$returnObject["commonTableExpressions"][] =  $commonTableExpression->getAttribute("tablename") . "(" . $commonTableExpression->getAttribute("columnList") . ") as (" . file_get_contents(TABLE_DEFINITION_DIRECTORY . $commonTableExpression->getAttribute("fileName")) . ")";
										break;
								}
							}
							break;
						case "baseresultset":
							$returnObject["baseResultSet"] = $childNode->getAttribute("index", 0);
						case "rowstylefile":
							if(is_readable(TABLE_DEFINITION_DIRECTORY . $childNode->getAttribute("fileName")))
							$returnObject["rowStyle"] = ArrayEncodeTableDefinition::ParseRowStyle( new XMLNode(null, file_get_contents(TABLE_DEFINITION_DIRECTORY . $childNode->getAttribute("fileName"))));
							$interfaceColumn = $childNode->getAttribute("interfaceColumn");
							if($interfaceColumn != null)
								$returnObject["rowStyle"]['interfaceColumn'] = $interfaceColumn;
							break;
						case "rowstyle":
							$returnObject["rowStyle"] = ArrayEncodeTableDefinition::ParseRowStyle($childNode);
							break;
						case "sqlname":
						case "sql_name":
						case "tablename":
							$returnObject["tableName"] = trim($childNode->textContent);
							$index = strrchr($returnObject["tableName"], '.');
							if($index !== false)
								$returnObject["tableName"] = substr($index, 1);
							if($returnObject["queryType"] == "table")
								$returnObject["baseQuery"] = ArrayEncodeTableDefinition::ParseValues($childNode);
							break;
						case "singular_name":
						case "singularname":
							$returnObject["singularName"] = trim($childNode->textContent);
							break;
						case "plural_name":
						case "pluralname":
							$returnObject["pluralName"] = trim($childNode->textContent);
							break;
						case "description":
							$returnObject["description"] = trim($childNode->textContent);
							break;
						case "edit":
							$returnObject["edit"] = strtoupper(trim($childNode->textContent));
							break;
						case "new":
							$returnObject["new"] = strtoupper(trim($childNode->textContent));
							break;
						case "rows_per_page":
						case "rowsperpage":
							$returnObject["rowsPerPage"] = trim($childNode->textContent);
							break;
						case "queryoptimisation":
						case "queryoptimization":
						case "queryopt":
							$returnObject["queryOpt"] = trim($childNode->textContent);
							break;
						case "max_execution_time":
							$returnObject["maxExecutionTime"] = trim($childNode->textContent);
							break;
						case "function":
							$returnObject["queryType"] = "function";
							$returnObject["baseQuery"] = ArrayEncodeTableDefinition::ParseValues($childNode);
							$returnObject["edit"] = "N";
							$returnObject["new"] = "N";
							break;
						case "queryfile":
							$fileName = trim($childNode->textContent);
							if(is_readable(QUERY_FILES_DIRECTORY . $fileName)) {
								$returnObject["queryType"] = "inlinequery";
								$returnObject["baseQuery"] = file_get_contents(QUERY_FILES_DIRECTORY . $fileName);
								$returnObject["edit"] = "N";
								$returnObject["new"] = "N";
							}
							break;
						case "history":
							$history = array();
							$history['data'] = array();
							$history['depth'] = $childNode->getAttribute("depth");
							if($history['depth']==null) $history['depth'] = 1;
							$history['timestampColumn'] = strtoupper($childNode->getAttribute("time"));
							$returnObject["history"] = $history;
							break;
						case "inlinequery":
							$returnObject["queryType"] = "inlinequery";
							$returnObject["baseQuery"] = ArrayEncodeTableDefinition::ParseValues($childNode);
							$returnObject["edit"] = "N";
							$returnObject["new"] = "N";
							break;
						case "messages":
							foreach ($childNode->childNodes as $message) {
								switch ($message->getAttribute("action")) {
									case 'script': 
										$returnObject["messages"][strtoupper($message->nodeName)] = array(
											"actionscript" => JSONEncodeAction::fromDOM($message)
											);
										break;
									case 'scriptfile':
									case 'file':
										$returnObject["messages"][strtoupper($message->nodeName)] = array(
											"actionscript" => JSONEncodeAction::fromFile(TABLE_DEFINITION_DIRECTORY,trim($message->textContent))
											);
										break;
									case 'menu': 
										$type=strtoupper($message->getAttribute("type","embeddedBranch"));
										if($type=="BRANCH") $message->setAttribute("type","EMBEDDEDBRANCH");
										$returnObject["messages"][strtoupper($message->nodeName)] = array(
											"menu" => array(JSONEncodeMenu::encodeMenuNode($message, "", "", null, null))
											);
										break;
									case 'retry': 
										$returnObject["messages"][strtoupper($message->nodeName)] = array(
											"retry" => trim($message->textContent)
											);
										break;
									default:
										$returnObject["messages"][strtoupper($message->nodeName)] = trim($message->textContent);
								}
								if($message->getAttribute("message")!=null)
									$returnObject["messages"][strtoupper($message->nodeName)]["message"] = $message->getAttribute("message");
							}
							break;
						case "order_by_index":
						case "orderby":
							$orderbyReturn = array();
							$orderbyReturn['column'] = strtoupper($childNode->getAttribute("name"));
							$orderbyReturn['direction'] = $childNode->getAttribute("direction");
							if($orderbyReturn['column'] != "")
								$returnObject["orderBy"][] = $orderbyReturn;
							break;
						case "reloadindicator":
							$returnObject['reloadindicator']['ageIndicator'] = (strtolower($childNode->getAttribute("ageIndicator")) == 'false' ? false : true);
							$returnObject['reloadindicator']['fullScreenNotifier'] = (strtolower($childNode->getAttribute("fullScreenNotifier")) == 'true' ? true : false);
							$returnObject['reloadindicator']['threshHold'] = intval($childNode->getAttribute("threshHold"));
						case "parameters":
							foreach ($childNode->childNodes as $paramNode) 	{
								$compair = strtolower($paramNode->nodeName);
								if($compair == 'parm' || $compair == 'param') {
									$param = array();
									$param['name'] = $paramNode->getAttribute("name");
									$param['title'] = $param['name'];
									$param['value'] = "";
									$param['ordinal'] = $paramNode->getAttribute("ordinal");
									$param['mode'] = $paramNode->getAttribute("mode");
									
									$param['disabled'] = $paramNode->getAttribute("disabled", 'false');
									$param['visible'] = $paramNode->getAttribute("visible", 'true');

									foreach ($paramNode->childNodes as $aNode) {
										switch (strtolower($aNode->nodeName)) {
											case 'title':
												$param['title'] = trim($aNode->textContent);
												break;
											case 'value':
												$param['value'] = trim($aNode->textContent);
												break;
											case 'type':
												$param['type'] = trim($aNode->textContent);
												break;
											case 'info':
												$param['info'] = trim($aNode->textContent);
												break;
										}
									}
									
									$returnObject['parameters'][] = $param;
								}
							}
							break;
						case "display_columns":
						case "displaycolumns":
							if($childNode->getAttribute("name")=="") 
								$displayReturn=&$returnObject["displayColumns"];
							else {
								$displayName=$childNode->getAttribute("name");
								if(!isset($returnObject["displayColumnsSet"])) 
									$returnObject["displayColumnsSet"]=array();
								$displayReturn=&$returnObject["displayColumnsSet"][$displayName];
							}

							$displayReturn[]=array("control" => true , "titleDepth" => $childNode->getAttribute("titleDepth") );
								
							foreach ($childNode->childNodes as $DisplayColumnNode) {
								if($DisplayColumnNode->nodeName == "col") {
									$aDisplayCol = array(
											'control' 	=> false , 
											'name'  	=> strtoupper($DisplayColumnNode->getAttribute("name")), // Create array with order of columns for table display
											'type' 		=> strtolower($DisplayColumnNode->getAttribute("type")), // Create array indicating whether the column is a value or a link for table display
											'break' 	=> strtolower($DisplayColumnNode->getAttribute("break")), 
											'transform' => strtolower($DisplayColumnNode->getAttribute("transform")), 
											'title' 	=> str_replace( "\\n" , "<br/>" , $DisplayColumnNode->getAttribute("title") ), 
											'maxSize'   => $DisplayColumnNode->getAttribute("maxSize"), 
											'isVisible' => true,
											'isUserHidden'  => false
											);
									$displayReturn[] = $aDisplayCol;
									
									if( isset($displayElements[$aDisplayCol['type']]) ) {
										if(!isset($displayElements[$aDisplayCol['type']][$aDisplayCol['name']]))
											$displayElements[$aDisplayCol['type']][$aDisplayCol['name']] = true;
									} else 
										$displayElements[$aDisplayCol['type']] = array( $aDisplayCol['name'] => true );
								}
							}
							break;
						case "enablecompare":
							$returnObject["enableCompare"] = true;
							break;
						case "disablecompare":
							$returnObject["enableCompare"] = false;
							break;
						case "compare":
							$returnObject["enableCompare"] = true;
							$returnObject["compare"]["menu"] = trim($childNode->getAttribute("menu"));
							break;
						case "output":
							foreach ($childNode->childNodes as $outputNode) {
								switch(strtolower($outputNode->nodeName)) {
									case "type":
										$outputName = strtoupper(trim($outputNode->getAttribute("name")));
										if ($outputName == "" ) break;
										$returnObject["output"][$outputName]=array();
										$returnObject["output"][$outputName]['action'] = trim($outputNode->getAttribute("action")); 
										$returnObject["output"][$outputName]['destination'] = trim($outputNode->getAttribute("destination")); 
										$returnObject["output"][$outputName]['class'] = trim($outputNode->getAttribute("class")); 
										$returnObject["output"][$outputName]['title'] = $outputNode->getAttribute("title"); 
										$returnObject["output"][$outputName]['generator'] = $outputNode->getAttribute("generator"); 
										$returnObject["output"][$outputName]["parameterList"] = JSONEncodeAction::encodeParameterList($outputNode);
										break;
								}
							}
							break;
							
						default:
							if(preg_match('/^disable_/', $childNode->nodeName) === 1){
								$returnObject["modules"][substr($childNode->nodeName, strpos($childNode->nodeName, "_") + 1)] = false;
							} else if(preg_match('/^disable/', $childNode->nodeName) === 1){
								$returnObject["modules"][strtolower(substr($childNode->nodeName,7))] = false;
							} else if(preg_match('/^enable_/', $childNode->nodeName) === 1){
								$returnObject["modules"][substr($childNode->nodeName, strpos($childNode->nodeName, "_") +1)] = true;
							} else if(preg_match('/^enable/', $childNode->nodeName) === 1){
								$returnObject["modules"][strtolower(substr($childNode->nodeName,6)) ] = true;
							} else if(preg_match('/^override_/', $childNode->nodeName) === 1){
								$overRideName = substr($childNode->nodeName, strpos($childNode->nodeName, "_") +1);
								foreach ($childNode->childNodes as $actionNode) {	
									switch(strtolower($actionNode->nodeName)) {
										case 'actionscript':
											$returnObject["moduleOverride"][$overRideName] = JSONEncodeAction::fromDOM($actionNode);
											break;
										case 'actionscriptfile':
											$returnObject["moduleOverride"][$overRideName] = JSONEncodeAction::fromFile(TABLE_DEFINITION_DIRECTORY, $actionNode->getAttribute("fileName"));
											break;
										default :
											$returnObject["moduleOverride"][$overRideName] = true;
									}
								}
							} else if(isset(ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS[strtolower($childNode->nodeName)])) {
								$tempFunction = ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS[strtolower($childNode->nodeName)];
								$tempFunction($childNode, $returnObject, $displayElements, $returnObject["displayColumns"]);
							} elseif(isset(ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS[strtolower($childNode->nodeName)])) {
								$tempFunction = ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS[strtolower($childNode->nodeName)];
								$tempFunction($childNode, $returnObject, $displayElements, $returnObject["displayColumns"]);
							}
							break;
					}
				}
				
				if(isset($returnObject["dataRetrievalAction"]) && isset($returnObject["components"])) {
					if(isset($returnObject["components"]["column"])) {
						if(is_array($returnObject["components"]["column"])) {
							foreach($returnObject["components"]["column"] as $column) {
								$column['compareDefault'] = true;
								$column['isSearchable'] = false;
								$column['canDrill'] = false;
								$column['sort_enable'] = false;
								$column['isPrefiled'] = null;
								$column['primaryKey'] = false;
								$returnObject["modules"]['search'] = false;
								$returnObject["modules"]['drill'] = false;
								$returnObject["modules"]['filter'] = false;
							}
						}
					}
					$returnObject["primaryKeys"] = array();
				}
				
				return $returnObject;
			}
		}
		return null;
	}
	
	static function ParseTableMask($tablemask, $mask=null) {
		if($mask == null)
			$mask = array();
		foreach($tablemask->childNodes as $baseMaskNode) {
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
					}
				}
				$mask[$maskNode['value']] = $maskNode;
			}
		}
		return $mask;
	}
	
	static function ParseRowStyle($rowStyleNode) {
		if(strtolower($rowStyleNode->nodeName) != "rowstyle") return null;
		
		$rowStyle = array();
		$rowStyle['interfaceColumn'] = $rowStyleNode->getAttribute("interfaceColumn", null);
		
		$fileName = $rowStyleNode->getAttribute("fileName", null);
		
		if($fileName != null) {
			$rowStyleNode = new XMLNode(null, file_get_contents(TABLE_DEFINITION_DIRECTORY . trim($fileName)));
			if($rowStyle['interfaceColumn'] == null) 
				$rowStyle['interfaceColumn'] = $rowStyleNode->getAttribute("interfaceColumn", null);
		}
		foreach ($rowStyleNode->childNodes as $paramNode) {
			if(strtolower($paramNode->nodeName) == 'option') {
				$param = array();
				$param['gteq'] = $paramNode->getAttribute("gteq");
				$param['lteq'] = $paramNode->getAttribute("lteq");
				$param['gt'] = $paramNode->getAttribute("gt");
				$param['lt'] = $paramNode->getAttribute("lt");
				$param['eq'] = $paramNode->getAttribute("eq");
				$param['isnull'] = $paramNode->getAttribute("isnull");
				$param['style'] = $paramNode->getAttribute("style");
				$rowStyle['options'][] = $param;
			}
		}
		return $rowStyle;
	}

	static function ParseValues($aNode) {
		if(!$aNode->hasChildNodes())
			return trim($aNode->textContent);
		$returnObject = array();
		$i=0;		
		foreach ($aNode->childNodes as $childNode) 	{
			$returnObject[$i][strtolower($childNode->nodeName)]=$childNode->textContent;
			EncodeVersion($childNode,$returnObject[$i]);
			$i++;
		}
		return $returnObject;
	}

}
