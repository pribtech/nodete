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

require_once(PHP_INCLUDE_BASE_DIRECTORY . "EncodeVersion.php");
require_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeAction.php");
require_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenuGraph.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class JSONEncodeMenu {
	static $defaultTarget = "_self";
	static $defaultWindow = "_self";
	static $defaultStage = null;
	static $panelNameSet = null;
	
	static function loadFile($filename, $menulocation, $rootNode, $filterList) { 
		global $GLOBALS;
		$GLOBALS['CURRENT_MENU_LOCATION'] = $rootNode . "/" . $menulocation;
		if(file_exists($rootNode . "/" . $menulocation . "/" . $filename))
			return JSONEncodeMenu::loadString(file_get_contents($rootNode . "/" . $menulocation . "/" . $filename), $menulocation, $rootNode, $filterList, $filename);
		return JSONEncodeMenu::menuError('loadFile fail as not found, file: '.$rootNode . "/" . $menulocation . "/" . $filename, $rootNode, null , $menulocation);
	}
	
	static function loadString($xml, $menulocation, $rootNode, $filterList, $currentFile,$error=false) {
		if($xml == "") return null;
		try {
			$doc = new XMLNode();
			if($doc->loadXML($xml) == false) return new Exception('load failure');
		} catch (Exception $e) {
			return error ? null : JSONEncodeMenu::menuError("load string ".$e, $rootNode, null , $menulocation);
		}
		return JSONEncodeMenu::loadDom($doc, $menulocation, $rootNode, $filterList, $currentFile);
	}
				
	static function encodePageWindowFromFile($filename) { 
		if(is_readable($filename))
			return JSONEncodeMenu::encodePageWindowFromString(file_get_contents($filename));
		self::logMessage('encodePageWindowFromFile not readable file: '.$filename);
		return null;
	}

	static function encodePageWindowFromString($xml) {
		if($xml == "") return null;
		try {
			$domNode = new XMLNode();
			if($domNode->loadXML($xml) == false) throw new Exception('loadXML is false error: '.var_export(libxml_get_last_error(),true));
			if(strcasecmp($domNode->nodeName, "pageWindow") == 0)
				return JSONEncodeMenu::encodePageWindow($domNode);
		} catch (Exception $e)	{
			self::logMessage('encodeMenuXML encodePageWindowFromString failed: '.$e);
		}
		return null;		
	}
	
	static function loadDom($domNode, $menulocation, $rootNode, $filterList, $currentFile) {
		if(strcasecmp($domNode->nodeName, "menu") == 0)
			return JSONEncodeMenu::encodeMenuNode($domNode, $menulocation, $rootNode, $filterList, $currentFile);
		return JSONEncodeMenu::menuError('Encode menu loadDom node name not menu, found '.$domNode->nodeName, $rootNode, null , $menulocation);
	}

	static function loadEmbededMenu($domNode, $menulocation, $rootNode, $filterList, $currentFile) {
		$returnObject = array();
		foreach($domNode->childNodes as $node) {
			if(strcasecmp($node->nodeName, "menu") == 0)
				$returnObject[] = JSONEncodeMenu::encodeMenuNode($node, $menulocation, $rootNode, $filterList, $currentFile);
		}
		return $returnObject;
	}
/*** added: Peter Prib - Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009)  2010 All rights reserved.*/
	static function logMessage($message) {
		error_log("JSONEncodeMenu ".$message,0);
	}
	
	static function menuMessage($message, $rootNode, $onErrorMenu, $menulocation) {
	 	return array(JSONEncodeMenu::loadString('<menu type="leaf"><description>'.$message.'</description></menu>', $menulocation, $rootNode, null, null,true));
	}
	
	static function menuError($message, $rootNode, $onErrorMenu, $menulocation) {
		$returnObject = array();
		self::logMessage("JSONEncodeMenu root node: ".$rootNode." menu location: ".$menulocation." error: ".$message);
		if ($onErrorMenu==null) { 
	 		$returnObject[] = JSONEncodeMenu::loadString('<menu type="leaf"><description>'.$message.'</description></menu>', $menulocation, $rootNode, null, null,true);
		} else {
			$filename=$rootNode . $menulocation . "/" . $onErrorMenu . ".xml";
			if(file_exists($filename))
				$returnObject[] = JSONEncodeMenu::loadString(file_get_contents($filename), $menulocation, $rootNode, null, $filename,true);
			else 
 				$returnObject[] = JSONEncodeMenu::loadString('<menu type="leaf"><description>error menu not found : '.$filename . '</description></menu>',$menulocation, $rootNode, null, null,true);
		}
		return $returnObject;
	}	
	static function encodeMenuSQLXML($branchSQLXML, $rootNode, $filterList,$branchXSL,$branchSQLPredicate,$dropParent,$onErrorMenu, $menulocation) {
		$returnObject = array();
		if(	strtolower(substr($branchSQLXML,0,7))=='select '
		or	strtolower(substr($branchSQLXML,0,7))=='xquery '
		or	strtolower(substr($branchSQLXML,0,7))=='values('
		or	strtolower(substr($branchSQLXML,0,7))=='values '
		or	strtolower(substr($branchSQLXML,0,5))=='with '
		or	substr($branchSQLXML,0,1)=='('
		) {
			$sql=$branchSQLXML;
		} else if(file_exists($branchSQLXML.".sql")) {
			$sql=file_get_contents($branchSQLXML.".sql");
		} else if(file_exists($branchSQLXML)) {
			$sql=file_get_contents($branchSQLXML);
		} else 
			return JSONEncodeMenu::menuError('branchSQLXML "'.$branchSQLXML.'" not found', $rootNode, $onErrorMenu, $menulocation);

		if(!connectionManager::isConnected()) 
			return JSONEncodeMenu::menuMessage("No connection found", $rootNode, $onErrorMenu, $menulocation);

		connectionManager::getConnection()->setAutoCommit(true);
		
		$query=$sql.( ($branchSQLPredicate==null or $branchSQLPredicate=="") ? "" : " where ".$branchSQLPredicate ).( connectionManager::getConnection()->getDBMS()=="ORACLE" ? "" : " for read only" );
		$matches = array();
		$bindParameters = array();
		$numFound = preg_match_all("/\?\!(?:[\w]+\=[^?\&]*[\&]?)*\?/", $query, $matches);
		if($numFound > 0) {
			$i = 1;
			$resultSet=false;
			foreach($matches[0] as $match) {
				$parameteOptions = array();
				$query = str_replace($match, "?", $query);
				$match = trim($match, "?!");
				if($match != "")
					parse_str($match, $parameteOptions);
				$bindParameters[$i]['name'] = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$i}") : "p{$i}";
				if ($bindParameters[$i]['name']=='result') 
					$resultSet=true;
				if(isset($parameteOptions['value']))
					$bindParameters[$i]['value'] = $parameteOptions['value'];
				else
					$bindParameters[$i]['value'] = getParameter($bindParameters[$i]['name']);
				if(isset($parameteOptions['dataType']))
					$bindParameters[$i]['dataType'] = $parameteOptions['dataType'];
				if(isset($parameteOptions['type']))
					$bindParameters[$i]['type'] = $parameteOptions['type'];
				if(isset($parameteOptions['DB2dataType']))
					$bindParameters[$i]['DB2dataType'] = $parameteOptions['DB2dataType'];
				if(isset($parameteOptions['precision']))
					$bindParameters[$i]['precision'] = $parameteOptions['precision'];
				if(isset($parameteOptions['scale']))
					$bindParameters[$i]['scale'] = $parameteOptions['scale'];
				if(isset($parameteOptions['settype']))
					$bindParameters[$i]['settype'] = $parameteOptions['settype'];
				if(isset($parameteOptions['conversion']))
					$bindParameters[$i]['conversion'] = $parameteOptions['conversion'];
				$i++;
			}
			$stmt = connectionManager::getNewStatement($query,true);
			$stmt->executeStmtWithParameters($bindParameters);
		} else 
			$stmt = connectionManager::getNewStatement($query);

 		if(!isset($stmt) || $stmt==null)
			return JSONEncodeMenu::menuError("Statement failure - see log - : ".$query, $rootNode, $onErrorMenu, $menulocation);
 		if(!$stmt->statementSucceed) 
			return JSONEncodeMenu::menuError("SQL Error, SQLSTATE: ".$stmt->sqlstate." - see log - sql : ".$query, $rootNode, $onErrorMenu, $menulocation);
		$xml = $stmt->fetch();
		if($xml == false) 
			return JSONEncodeMenu::menuError("Nil returned", $rootNode, $onErrorMenu, $menulocation);

		return self::encodeMenuXML($xml[0], $rootNode, $filterList,$branchXSL,$dropParent,$onErrorMenu, $menulocation, $branchSQLXML);
	}
	
	static function encodeMenuXML($xml, $rootNode, $filterList,$branchXSL,$dropParent,$onErrorMenu, $menulocation, $orginalQuery=null) {
		if($xml == "") 
			return JSONEncodeMenu::menuError('nil', $rootNode, $onErrorMenu, $menulocation);
		if($branchXSL == "") {
			$returnObject[] = JSONEncodeMenu::loadString($xml, $menulocation, $rootNode, $filterList, null);
			if ($dropParent=="true") $returnObject=$returnObject[0];
			return $returnObject;
		}

		$xmlDOM = new DOMDocument;
		if(substr($xml,0,1) == '<') {
			if($xmlDOM->loadXML($xml) == false) 
				return JSONEncodeMenu::menuError('branchSQLXML XML invalid', $rootNode, $onErrorMenu, $menulocation);
		} else if(substr($xml,0,1) == '$') {
			switch ($xml) {
				case '$connectionProfile' :
					$connectionProfile = new connectManagerNodes();
					if($xmlDOM->loadXML($connectionProfile->getXML()) == false) 
						return JSONEncodeMenu::menuError('branchXML XML invalid for function '.$xml, $rootNode, $onErrorMenu, $menulocation);
					break;
				default:
					return JSONEncodeMenu::menuError('branchXML internal function '.$xml.' not found', $rootNode, $onErrorMenu, $menulocation);
			}		
		} else {
			if($xmlDOM->load( $xml.".xml") == false)
				if($xmlDOM->load( $xml, LIBXML_NOCDATA) == false) 
					return JSONEncodeMenu::menuError('XML file not found or XML invalid,'.($orginalQuery==null?'':' orginal query: "'.$orginalQuery.'"').' xml: "'.$xml.'"', $rootNode, $onErrorMenu, $menulocation);
		}
		if (!extension_loaded('xsl')) {
			return JSONEncodeMenu::menuError('PHP xsl extension not enabled', $rootNode, $onErrorMenu, $menulocation);
		}
		$xslt = new XSLTProcessor();
		$xslDOM = new DOMDocument();
		if(substr($branchXSL,0,1) == '<') {
			if($xslDOM->loadXML( $branchXSL) == false)
				return JSONEncodeMenu::menuError('branchXSL invalid: '.$branchXSL, $rootNode, $onErrorMenu, $menulocation);
		} else { 
			if($xslDOM->load( $branchXSL.".xsl") == false)
				if($xslDOM->load( $branchXSL, LIBXML_NOCDATA) == false) 
					return JSONEncodeMenu::menuError('branchXSL file '.$branchXSL.'" not found or XSL invalid', $rootNode, $onErrorMenu, $menulocation);
		}
		if($xslt->importStylesheet($xslDOM) == false) 
			return JSONEncodeMenu::menuError('branchXSL parse error '.$branchXSL, $rootNode, $onErrorMenu, $menulocation);
			
		$connectionDetail=connectionManager::getConnectionDetail();
		if ($connectionDetail!=null)
			foreach( $connectionDetail as $key=>&$value ) {
				if($key=='dataServerInfo') {
					foreach( $value as $keyD=>&$valueD )
						if ($valueD!=null)
							if (is_string($valueD))
								$xslt->setParameter('',$keyD, $valueD);
				} else if ($value!=null)
					if (is_string($value)) 
							$xslt->setParameter('',$key, $value);
				}
		try{
			$menu=$xslt->transformToXML($xmlDOM);
		} catch (Exception $e) {
			return JSONEncodeMenu::menuError('branchXSL XSL transform error: '.$e, $rootNode, $onErrorMenu, $menulocation);
		}
		if($menu===null)
			return JSONEncodeMenu::menuError('branchXSL XSL transform error, check log for detail', $rootNode, $onErrorMenu, $menulocation);
		if($menu==="")
			return JSONEncodeMenu::menuError('branchXSL XSL transform '.$branchXSL.' returned nil on: '.$menu, $rootNode, $onErrorMenu, $menulocation);
		$returnObject[] =  JSONEncodeMenu::loadString($menu , $menulocation, $rootNode, $filterList, null);
		if ($dropParent=="true") {
			if(isset($returnObject[0]['elementSubNodes']))
				return $returnObject[0]['elementSubNodes'];
			return JSONEncodeMenu::menuError("Nil", $rootNode, $onErrorMenu, $menulocation);
		}
		return $returnObject;
	}
/*** end added ***/

	static function encodeMenuFolder($menulocation, $rootNode, $filterList) {
		$returnObject = array();
		// if the current expected directory is not a directory return
		if(is_dir($rootNode . "/" . $menulocation) === false) return "";
	
		// Acquire a list of files in the directory sorted ascending
		$fileInDir = scandir($rootNode . "/" . $menulocation, 0);
		
		sort($fileInDir);
	
		foreach($fileInDir as $currentFile) {
			// Look for XML files that start with 'menu_' and end with '.xml' while ignoring case
			if(preg_match('/^menu_.*\.xml$/i', $currentFile ))
		     	$returnObject[] = JSONEncodeMenu::loadFile($currentFile, $menulocation, $rootNode, $filterList);
		}
		return $returnObject;
	}
	
	static function encodeMenuNode($node, $menulocation, $rootNode, $filterList, $currentFile) {
		if($node == null) return null;
		$returnObject = array();
		
		$nodeType = strtoupper($node->getAttribute("type", "leaf"));
		
		$delayLoad = $node->getAttribute("delayLoad");
		$delayLoad = $delayLoad == "" ? "false" : strtolower($delayLoad);
		$reloadOnConnectionChange = strtolower($node->getAttribute("reloadOnConnectionChange", 'false')) == 'true' ? true : false;
		
		$rootDirectory = trim($node->getAttribute("rootDirectory"));
		$branchDirectory = trim($node->getAttribute("branchDirectory"));
		$branchSQLXML = trim($node->getAttribute("branchSQLXML"));
		$branchSQLPredicate = trim($node->getAttribute("branchSQLPredicate"));
		$branchXML = trim($node->getAttribute("branchXML"));
		$branchXSL = trim($node->getAttribute("branchXSL"));
		$onErrorMenu = trim($node->getAttribute("onErrorMenu"));
		$dropParent = trim($node->getAttribute("dropParent"));
		$replacement = strtolower($node->getAttribute("replacement", 'false')) == 'true' ? true : false;
		//02/28/2011 - Matthew Vandenbussche - Adding GUID to menus to allow for unique identification, currently will be used to alow flow groups to open a specific menu item
		// Note this is differnt then the element ID that is used as the base DOM object ID
		$GUID = trim($node->getAttribute("GUID"));
		
		EncodeVersion($node,$returnObject);
		$tag = $node->getAttribute("tag");

		if(!($tag == "" && $nodeType == "BRANCH") && $filterList != null) 
			foreach($filterList as $filter) {
		    	if(ereg($filter, $tag) == false)
		    		return null;
	    	}
		
		$description = $node->getChildTextContent("description", "none");
		
		$filter = $node->getChildTextContent("filter", null);
		
		if($filter != null && $filterList != null) {
			$filterList[] = $filter;
		} else if($filter != null) {
			$filterList = array($filter);
		}
		
		$elementID = $node->getChildTextContent("menuGUID", null);
		$elementAction = null;
		$elementSubNodeElements = null;
		$elementSubNodeDirection = null;
		$rootCallBack = null;
		$localFilterList = null;
		$actionJSON = null;
		$linkList = null;
		$pageWindow = null;
		$floatingPanelData = null;
		
		switch($nodeType) {
			case "BRANCH":
				if($delayLoad == "true" && $currentFile != null) {
					$nodeType = "DELAYLOADBRANCH";
					$rootCallBack = $rootNode . "/" . $menulocation . "/" . $currentFile;
					$rootCallBack = preg_replace("/[\\/]+/", "/", $rootCallBack);
					$localFilterList = $filterList;
					$localFilterList = $localFilterList == null ? null : $localFilterList;
					
				} else if(($delayLoad != "false") && ($branchSQLXML != "" || $branchXML!="")) {
					$nodeType = "DELAYLOADBRANCH";
					$menuCallBack = array();
					$menuCallBack["reloadOnConnectionChange"]=$reloadOnConnectionChange;
					$menuCallBack["delayLoad"]=$delayLoad;
					$menuCallBack["rootDirectory"]=$rootDirectory;
					$menuCallBack["branchDirectory"]=$branchDirectory;
					$menuCallBack["branchSQLXML"]=$branchSQLXML;
					$menuCallBack["branchSQLPredicate"]=$branchSQLPredicate;
					$menuCallBack["branchXML"]=$branchXML;
					$menuCallBack["branchXSL"]=$branchXSL;
					$menuCallBack["onErrorMenu"]=$onErrorMenu;
					$menuCallBack["dropParent"]=$dropParent;
					$menuCallBack["replacement"]=$replacement;
					$menuCallBack["filter"]=$filter;
					$menuCallBack["menulocation"]=$menulocation;
					$rootCallBack=json_encode($menuCallBack);
					$localFilterList = $filterList;
					$localFilterList = $localFilterList == null ? null : $localFilterList;
					
				} else {
					if($rootDirectory != "") {
						$elementSubNodeElements = JSONEncodeMenu::encodeMenuFolder($menulocation, $rootDirectory, $filterList);
					} else if($branchDirectory != "") {
						$elementSubNodeElements = JSONEncodeMenu::encodeMenuFolder($menulocation . "/" . $branchDirectory, $rootNode, $filterList);
/*** added: Peter Prib - Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009)  2010 All rights reserved.*/
					} else if($branchSQLXML != "")  {
						$nodeType = "SQL_BRANCH";
						$elementSubNodeElements = JSONEncodeMenu::encodeMenuSQLXML($branchSQLXML, $rootNode, $filterList,$branchXSL,$branchSQLPredicate,$dropParent,$onErrorMenu, $menulocation);
					} else if($branchXML != "") {
						$nodeType = "XML_BRANCH";
						$elementSubNodeElements = JSONEncodeMenu::encodeMenuXML($branchXML, $rootNode, $filterList,$branchXSL,$dropParent,$onErrorMenu, $menulocation);
					}
/*** end added ***/
					if($elementSubNodeElements == null || $elementSubNodeElements == null)
						return null;
				}
				break;
			case "LEAF":
/*** added: Peter Prib - Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009)  2011 All rights reserved.*/
				
				$actionNode = $node->findChildNode("actionScript");
				if($actionNode == null) {
					$tutorialNode = $node->findChildNode("tutorial");  
					if($tutorialNode != null) {
						$name = $tutorialNode->getAttribute("name");
						if($name==null) $name = preg_replace('/\s(.?)/e',"strtoupper('$1')",$description);
						$source = $tutorialNode->getAttribute("source");
						if($source == null) $source = '<parameter name="script"><![CDATA['.str_replace("]]>", "]]]]><![CDATA[>",$tutorialNode->asXML()).']]></parameter>';
						else {
							if(file_exists($source))
								$source='<parameter name="script"><![CDATA['.str_replace("]]>", "]]]]><![CDATA[>",file_get_contents($source)).']]></parameter>';
							else 
								$source='<parameter name="CurrentMenuLocation">'.$source.'</parameter>';
						}
						$pageWindow = JSONEncodeMenu::encodePageWindowFromString('<?xml version="1.0" encoding="UTF-8"?>
							<pageWindow target="_final">
								<panel name="Tutorial" PrimaryContainer="true">
									<link connectionRequired="y" target="_self" type="action" window="_self">
										<parameterList>
											<parameter name="action">tutorial</parameter>
											<parameter name="tutorialName">'.$name.'</parameter>
											'.$source.'
										</parameterList>
									</link>
								</panel>
							</pageWindow>
							');
						if($pageWindow == null)
							self::logMessage('encodeMenuXML tutorial "'.$description.'" encodePageWindow failed');
					}
				}
/*** end added ***/
				
				$elementAction = $node->getChildTextContent("JSAction", null);
				if($actionNode != null)
					$actionJSON = JSONEncodeAction::fromDOM($actionNode);
				
				$FloatingLink = $node->findChildNode("floatingPanel");
				if($FloatingLink != null) {
					$floatingPanelData = JSONEncodeMenu::getPanelContent($FloatingLink->childNodes);
					$floatingPanelData['hideMenuBar'] = strtolower($FloatingLink->getAttribute("hideMenuBar", 'false')) == 'true' ? true : false;
					$floatingPanelData['reloadOnConnectionChange'] = strtolower($FloatingLink->getAttribute("reloadOnConnectionChange", 'false')) == 'true' ? true : false;
					$floatingPanelData['panelHeaders'] = JSONEncodeMenu::encodePanelHeaders($FloatingLink->findChildNode("panelHeaders"));
					$floatingPanelData['baseWidth'] = $FloatingLink->getAttribute("baseWidth", null);
					$floatingPanelData['baseHeight'] = $FloatingLink->getAttribute("baseHeight", null);
					$floatingPanelData['loadContentOnShow'] = strtolower($FloatingLink->getAttribute("loadContentOnShow", 'false')) == 'true' ? true : false;
					$floatingPanelData['reloadContentOnShow'] = strtolower($FloatingLink->getAttribute("reloadContentOnShow", 'false')) == 'true' ? true : false;
				}
				
				$linkList = JSONEncodeMenu::retrieveLinksFromDOM($node);
				if($pageWindow == null)
		    		$pageWindow = JSONEncodeMenu::encodePageWindowsFromDOM($node);
				break;
			case "EMBEDDEDBRANCH":
				$nodeType = "BRANCH";
				$elementSubNodeElements = JSONEncodeMenu::loadEmbededMenu($node, $menulocation, $rootNode, $filterList, null);
				break;
			case "TABLE":
				$returnObject["table"]=trim($node->getAttribute("table"));
				$parameters = array();
				
				if($node->hasChildNodes())
					foreach ($node->childNodes as $childNode) {
						switch (strtolower($childNode->nodeName)) {
							case "parameter":
								$name = $childNode->getAttribute("name");
								$value = $childNode->getAttribute("value");
								foreach ($childNode->childNodes as $parameterNodes)
									if(strtolower($parameterNodes->nodeName)=='value') 
										$value = trim($parameterNodes->textContent);
								$parameters[$name]=$value;
								break;
						}
					}
				$returnObject["parameters"]=$parameters;
				break;
			case "LINE":
				break;
			default:
				return JSONEncodeMenu::menuError('Encode menu node failed as type: "'.$nodeType.'" not known' , $rootNode, null , $menulocation);
		}
		
		$returnObject["nodeType"] = $nodeType;
		$returnObject["delayLoad"] = $delayLoad;
		$returnObject["GUID"] = $GUID;
		$returnObject["reloadOnConnectionChange"] = $reloadOnConnectionChange;
		$returnObject["replacement"] = $replacement;
		$returnObject["tag"] = $tag;
		$returnObject["elementID"] = $elementID;
		$returnObject["elementValue"] = $description;
		$returnObject["elementActionScript"] = $actionJSON;
		$returnObject['elementFloatingLink'] = $floatingPanelData;
		$returnObject["elementLinkList"] = $linkList;
		$returnObject["elementPageWindows"] = $pageWindow;
		$returnObject["elementAction"] = $elementAction;
		$returnObject["elementSubNodes"] = $elementSubNodeElements;
		$returnObject["rootCallBack"] = $rootCallBack;
		$returnObject["filterList"] = $localFilterList;
		$returnObject["elementSubNodeDirection"] = $elementSubNodeDirection;
		return $returnObject;
	}
	
	static function loadFileNodes($filename, $nodeNameToEncode, $depth = -1) {
		if(file_exists($filename))
			return JSONEncodeMenu::loadStringNodes(file_get_contents($filename), $nodeNameToEncode, $depth);
		return null;
	}
	
	static function loadStringNodes($xml = "", $nodeNameToEncode, $depth = -1) {
		if($xml == "") return null;
		try {
			$doc = new XMLNode();
			if($doc->loadXML($xml) == false) {
				error_log('JSONEncodeMenu loadsStringNodes loadXML failed xml: '.$xml,0);
				return null;
			}
			$returnObject = array();
			foreach($doc->childNodes as $node) {
	     		if( trim($node->nodeName) == $nodeNameToEncode)
					$returnObject[] = JSONEncodeMenu::convertNode($node);
	     		else if($depth != 0)
     				$returnObject[] = JSONEncodeMenu::findAndEncodeNodes($node, $nodeNameToEncode, $depth);
			}
		} catch (Exception $e) {return null;}
		return $returnObject;
	}
	
	static function findAndEncodeNodes($node, $nodeNameToEncode, $depth = -1) {
		$depth--;
		$returnObject = array();
		foreach($node->childNodes as $childNode) {
			if( trim($childNode->nodeName) == $nodeNameToEncode)
				$returnObject[] = JSONEncodeMenu::convertNode($childNode);
			else if($depth != 0)
				$returnObject[] = JSONEncodeMenu::findAndEncodeNodes($childNode, $nodeNameToEncode);
		}
		return $returnObject;
	}
	
	static function convertNode($node) {
		$hasChildNodes = false;
		$returnObject = array();
		$returnObject["name"] = trim($node->nodeName);
		
		if($node->hasAttributes()) {
			$LocalJsonAttributs = array();
			
			foreach ($node->attributes as $index=>$attr) 
		        $LocalJsonAttributs[$attr->name] = $attr->value;

			$returnObject["attributes"] = $LocalJsonAttributs;
		}
		if($node->hasChildNodes()) {
			$LocalJsonChildNodes = array();
			
			foreach ($node->childNodes as $childNode) {
				$hasChildNodes = true;
				$LocalJsonChildNodes[] = JSONEncodeMenu::convertNode($childNode);	
			}
			if($LocalJsonChildNodes != "")
				$returnObject["childNodes"] = $LocalJsonChildNodes;
		}
		$nodeValue = trim($node->textContent);
		if($nodeValue != "" && !$hasChildNodes) 
			$returnObject["value"] = $nodeValue;
		return $returnObject;
	}
	
	static function retrieveLinksFromString($XMLString = "")	{
		if($XMLString == "") return null;
		try {
			$DomObject = new XMLNode();
			if($DomObject->loadXML($DomObject))
				return JSONEncodeMenu::retrieveLinksFromDOM($DomObject);
		} catch (Exception $e){	
			error_log('JSONEncodeMenu retrieveLinksFromString, exception: '.$e->getMessage().' xml:'.$XMLString,0);
		}
		return null;		
	}
	
	static function retrieveLinksFromDOM($DomObject) {
		$returnObject = array();
		
		$linkLists = $DomObject->getElementsByTagName('linkList');
		foreach ($linkLists as $aLinkList) {
			if($aLinkList->hasChildNodes()) {
				foreach ($aLinkList->childNodes as $Link)
					$returnObject[] = JSONEncodeMenu::encodeTopLinkNodeToURL($Link);
			}
		}
		return $returnObject;
	}
	
	static function encodeTopLinkNodeToURL($Link, $rowData = null, $fieldLookUp = null)	{
		if(strcasecmp($Link->nodeName, "link") == 0) {
			$returnObject = array();
			$dataType = strtoupper($Link->getAttribute("type"));
			$dataType = $dataType != "" ? $dataType : "LINK";
			
			$target = $Link->getAttribute("target");
			$window = $Link->getAttribute("window");
			$windowStage = $Link->getAttribute("windowStage");

			$returnObject["target"] = ($target == "" ? JSONEncodeMenu::$defaultTarget : $target);
			$returnObject["window"] = ($window == "" ? JSONEncodeMenu::$defaultWindow : $window);
			$returnObject["windowStage"] =  ($windowStage == "" ? JSONEncodeMenu::$defaultStage : $windowStage);
			$returnObject["formList"] = JSONEncodeMenu::encodeFormListToJSON($Link);
			$returnObject["type"] = $dataType;
			switch(strtoupper($dataType)) {
				case "RAW" :
					$returnObject["data"] = $Link->getChildTextContent("RAW", "");
					break;
				case "URL" :	
					$returnObject["data"] = $Link->getChildTextContent("URL", "");
					break;
				default :
					$returnObject["data"] = JSONEncodeMenu::encodeLinkNode($Link);
			}

			return $returnObject;
		}
		
		return null;
	}
	
	static function encodeFormListToJSON($linkNode) {
		$returnObject = array();

		$AllFormNodeLists = $linkNode->getElementsByTagName('formList');

		foreach ($AllFormNodeLists as $formNodeList) {
			if($formNodeList->hasChildNodes()) {
				foreach ($formNodeList->childNodes as $formNode) 
					$returnObject[] = $formNode->getAttribute("name");
			}
		}
		return $returnObject;
	}

	static function encodeLinkNode($linkNode, $rowData = null, $fieldLookUp = null)	{
		$returnObject = array();
		$returnObject['baseDirectory'] = null;
		$returnObject['address'] = null;
		$returnObject['parameters'] = array();
		
		if($linkNode == null)
			return "";
		if(strcasecmp($linkNode->nodeName, "link") != 0)
			return "";
	
		if($linkNode->getAttribute("type") == "html")
			$returnObject['baseDirectory'] = HTML_BASE_DIRECTORY;	
		
		if($linkNode->hasChildNodes()) {
			foreach ($linkNode->childNodes as $childNode)  {
				switch (strtolower($childNode->nodeName)) {
					case "address":
						$returnObject['address'] = trim($childNode->textContent);
						break;
					case "parameterlist":
						if($childNode->hasChildNodes()) {
							foreach ($childNode->childNodes as $parameterNodes) {
								$name = $parameterNodes->getAttribute("name");
								$value = $parameterNodes->getAttribute("value");
								$valueWasSet = false;
								if($value != "" || $value != NULL) {
									if(array_key_exists($value, $GLOBALS)) {
										$valueWasSet = true;
										$value = $GLOBALS[$value];
									} else if(constant($value) !== NULL) {
										$valueWasSet = true;
										$value = constant($value);
									}
								}
								if($parameterNodes->hasChildNodes()) {
									$subLinkNode = $parameterNodes->childNodes[0];
									switch(strtolower($subLinkNode->nodeName)) {
										case "link":
											$valueWasSet = true;
											$value = JSONEncodeMenu::encodeTopLinkNodeToURL($subLinkNode, $rowData, $fieldLookUp);
											break;
										case "graph":
											$valueWasSet = true;
											//BRIAN: Add your function here to parse the graph.
											//$value = encodeTopLinkNodeToURL($subLinkNode, $rowData, $fieldLookUp);
											$value = JSONEncodeMenuGraph::encodeGraph($subLinkNode);
											break;
										case "pagewindow":
											$valueWasSet = true;
											$value = JSONEncodeMenu::encodePageWindow($subLinkNode);
											break;
										case "keycolumn":
											if($rowData != null && $fieldLookUp != null) {
												$valueWasSet = true;
												$keyColumnValue = trim($subLinkNode->textContent);
												$default = $subLinkNode->getAttribute("defaultValue");
												$value = isset($fieldLookUp[$keyColumnValue]) ? $rowData[$fieldLookUp[$keyColumnValue]] : $default;
											} else 
												$name = "";
											break;
										case "value":
											$valueWasSet = true;
											if($subLinkNode->hasChildNodes())
												$value = $parameterNodes->arrayEncodeXML();
											else 
												$value = trim($parameterNodes->textContent);
											break;
										default:
											$valueWasSet = true;
											$value = $parameterNodes->arrayEncodeXML();
											break;
									}
								}
								if(!$valueWasSet)
									$value = trim($parameterNodes->textContent);
								if($name != "")
									$returnObject['parameters'][$name] = $value;
							}
						}
						break;
				}
			}
		} else 
			return trim($linkNode->textContent);
		
		return $returnObject;
	}
	
	static function encodePageWindowsFromDOM($DomObject) {
		$JSONPageWindows = array();
		
		$PageWindows = $DomObject->getElementsByTagName('pageWindow');
		foreach ($PageWindows as $aPageWindow) {
			if(strcasecmp($aPageWindow->nodeName, "pageWindow") == 0)
				if($aPageWindow->hasChildNodes()) 
					$JSONPageWindows[] =  JSONEncodeMenu::encodePageWindow($aPageWindow);
		}
		return $JSONPageWindows;
	}
	
	static function encodePageWindow($aPageWindow) {
		if($aPageWindow == null) return null;
		if(!is_a($aPageWindow, "XMLNode") ) return null;
		if(!$aPageWindow->hasChildNodes()) return null;
		$returnObject = array();
		$windowStage = $aPageWindow->getAttribute("windowStage");
		$windowStage = $windowStage == "" ? JSONEncodeMenu::$defaultStage : $windowStage;
		
		$raiseToTop = $aPageWindow->getAttribute("raiseToTop");
		$raiseToTop = $raiseToTop == "false" ? false : true;
		$returnObject["reloadOnConnectionChange"] = strtolower($aPageWindow->getAttribute("reloadOnConnectionChange", 'false')) == 'true' ? true : false;;
		$returnObject["target"] = $aPageWindow->getAttribute("target");
		$returnObject["title"] = $aPageWindow->getChildTextContent("title");
		$returnObject["info"] = $aPageWindow->getChildTextContent("info");
		$returnObject["leftMenu"] = JSONEncodeMenu::encodeMenuNode($aPageWindow->findChildNode("leftMenu"), null, null, null, null);
		$returnObject["raiseToTop"] = $raiseToTop;
		$returnObject["windowStage"] = $windowStage;
		$returnObject["windowType"] = $aPageWindow->getAttribute("windowType", "NORMAL");
		$returnObject["windowOptionType"] = $aPageWindow->getAttribute("windowOptionType");

		$returnObject["panelHeaders"] = JSONEncodeMenu::encodePanelHeaders($aPageWindow->findChildNode("panelHeaders"));
		
		//Panel Name Set is used to check for duplicate names with in a window layout, Duplicate names will cause bad things to happen
		JSONEncodeMenu::$panelNameSet = array();
		
		$returnObject["content"] = JSONEncodeMenu::encodeContainerNode($aPageWindow, $returnObject["panelHeaders"]);
		//Clear Name set
		JSONEncodeMenu::$panelNameSet = null;
		return $returnObject;
	}

	static function encodePanelHeaders($node) {
		if($node === null) return null;
		$returnObject = array();
		$scope = $node->getAttribute("scope");
		$refreshEnabled = $node->getAttribute("refreshEnabled");
		$refreshEnabled = $refreshEnabled != "false" ? true : false;
		$refreshControl = $node->getAttribute("showRefreshControl");
		$refreshControl = $refreshControl != "false" ? true : false;
		$returnObject["scope"] = $scope;
		$returnObject["refreshEnabled"] = $refreshEnabled;
		$returnObject["refreshOptions"] = $node->getAttribute("refreshOptions");
		$returnObject["autoRefreshControls"] = JSONEncodeMenu::retrieveAutoRefresh($node->findChildNode("autoRefreshControls"));
		$returnObject["showRefreshControl"] = $refreshControl;
		return $returnObject;
	}

	static function retrieveAutoRefresh($node) {
		if($node === null) return null;
		$countdownVisible = $node->getChildTextContent("countdownVisible");
		$countdownVisible = $countdownVisible != "true" ? false : true;
		$timeVisible = $node->getChildTextContent("timeVisible");
		$timeVisible = $timeVisible != "false" ? true : false;
		$timeOptions = $node->getChildTextContent("timeOptions", "true");
		$returnObject["time"] = $node->getChildTextContent("time", -1); // -1
		$returnObject["timeVisible"] = $timeVisible; // true
		$returnObject["timeOptions"] = json_decode($timeOptions); // off always present [5, 15, 30, 60, 120, 300, 600]
		$returnObject["countdownVisible"] = $countdownVisible; //false
		return $returnObject;
	}
	
	static function getPanelContent($Node) {
		$returnObject = array();
		$returnObject['ContentType'] = "RAW";
		$returnObject['data'] = "";
		foreach ($Node as $PanelNode)  {
				/*
				 * The Panel can display a forth type of data called a layout, 
				 * a layout can render the same layout object  as a window with 
				 * in the Panel. This is not exposed because it is meant for 
				 * advanced layouts which need to be controlled and manipulated 
				 * by a javascript object such as the ad hoc and Tutorial panels. 
				 * Most all layouts can be achieved with out this option.
				 */
				if(strcasecmp($PanelNode->nodeName, "link") == 0) {
					$returnObject['ContentType'] = "LINK";
					$returnObject['data'] = JSONEncodeMenu::encodeTopLinkNodeToURL($PanelNode);
					break;
				} elseif (strcasecmp($PanelNode->nodeName, "raw") == 0) {
					$returnObject['ContentType'] = "RAW";
					$returnObject['data'] = trim($PanelNode->textContent);
					break;
				} elseif (strcasecmp($PanelNode->nodeName, "url") == 0) {
					$returnObject['ContentType'] = "URL";
					$returnObject['data'] = trim($PanelNode->textContent);
					break;
				}
		}
		return $returnObject;
	}

	static function encodeContainerNode($ContainerNode, $parentPanelHeaders) {
		if($ContainerNode->hasChildNodes()) {
			foreach ($ContainerNode->childNodes as $childNode) {
				$returnObject = array();
				switch (strtolower($childNode->nodeName)) {
					case "panel":
						$returnObject['type'] = "panel";
						$returnObject['name'] = $childNode->getAttribute("name");
						$returnObject['name'] = $returnObject['name'] == "" ? uniqid() : $returnObject['name'];
						$returnObject['ContentType'] = null;
						$returnObject['data'] = null;
						$returnObject["reloadOnConnectionChange"] = strtolower($childNode->getAttribute("reloadOnConnectionChange", 'false')) == 'true' ? true : false;;
						
						$returnObject['panelHeaders'] = JSONEncodeMenu::encodePanelHeaders($childNode->findChildNode("panelHeaders"));
						if($returnObject['panelHeaders'] == "" || $returnObject['panelHeaders'] == null)
							$returnObject['panelHeaders'] = $parentPanelHeaders;
						
						$BadPanelName = false;
						
						if(is_array(JSONEncodeMenu::$panelNameSet)) {
							if(key_exists( $returnObject['name'] ,JSONEncodeMenu::$panelNameSet)) {
								$returnObject['ContentType'] = "RAW";
								$returnObject['data'] = <<<HERE
<div id="title">Error: Bad panel name!</div>
<table style='width:100%;height:100%'>
	<tr>
		<td align='center'>
			<h2>A panel with the name '{$returnObject['name']}' already exists within this page layout. A unique name must be assigned to this panel before the content can be displayed.</h2>
		</td>
	</tr>
</table>								
HERE;
								$returnObject['name'] = uniqid();
								$BadPanelName = true;
							}
						}
						
						if($childNode->hasChildNodes() && !$BadPanelName) {
							$panelData = JSONEncodeMenu::getPanelContent($childNode->childNodes);
							$returnObject['ContentType'] = $panelData['ContentType'];
							$returnObject['data'] = $panelData['data'];
						}
						$returnObject['overflow'] = $childNode->getAttribute("overflow");
						$returnObject['overflow'] = $returnObject['overflow'] == "" ? "auto" : $returnObject['overflow'];
						$returnObject['delayLoad'] = $childNode->getAttribute("delayLoad");
						$returnObject['delayLoad'] = $returnObject['delayLoad'] == "true" ? true : false;
						$returnObject['panelTitle'] = $childNode->getAttribute("panelTitle");
						$returnObject['panelTitle'] = $returnObject['panelTitle'] == "" ? null : $returnObject['panelTitle'];
						$returnObject['PrimaryContainer'] = $childNode->getAttribute("PrimaryContainer");
						$returnObject['PrimaryContainer'] = $returnObject['PrimaryContainer'] == "true" ? true : false;
						return $returnObject;
						break;
					case "splitpane":
						$returnObject['type'] = "splitPane";
						$returnObject['panelA'] = null;
						$returnObject['panelB'] = null;
						$returnObject['direction'] = strtolower($childNode->getAttribute("direction"));
						$returnObject['direction'] = $returnObject['direction'][0] == 'v' ? 'v' : 'h' ;
						$returnObject['splitPercent'] = $childNode->getAttribute("splitPercent");
						$returnObject['splitPercent'] = $returnObject['splitPercent'] == "" ? null : $returnObject['splitPercent'];
						$returnObject['allowResize'] = $childNode->getAttribute("allowResize");
						$returnObject['allowResize'] = $returnObject['allowResize'] == "false" ? false : true;
						$returnObject['maxSize'] = $childNode->getAttribute("maxSize");
						$returnObject['maxSize'] = $returnObject['maxSize'] == "" ? null : intval($returnObject['maxSize']);
						
						//showSplitSpacer
						$showSplitSpacer = $childNode->getAttribute("showSplitSpacer");
						if($showSplitSpacer != null) {
							$returnObject['showSplitSpacer'] = strtolower($showSplitSpacer) == 'true' ? true : false;
							//splitSpacerWidth
							$returnObject['splitSpacerWidth'] = $childNode->getAttribute("splitSpacerWidth", 3);
							if($returnObject['splitSpacerWidth'] != null)
								$returnObject['splitSpacerWidth'] = intval($returnObject['splitSpacerWidth']);
						}
						
						//styleOverride
						$returnObject['styleOverride'] = $childNode->getAttribute("styleOverride", "");
						
						$returnObject['panelA'] = array(
														'type'=>'panel',
														'name'=>uniqid(),
														'ContentType'=>'RAW',
														'data'=>"<div id='title'>No content given!</div><table style='width:100%;height:100%'><tr><td align='center'><h2>No content was specified for the panel</h2></td></tr></table>'"
													);
						$returnObject['panelB'] = array(
														'type'=>'panel',
														'name'=>uniqid(),
														'ContentType'=>'RAW',
														'data'=>"<div id='title'>No content given!</div><table style='width:100%;height:100%'><tr><td align='center'><h2>No content was specified for the panel</h2></td></tr></table>'"
													);

						if($childNode->hasChildNodes()) {
							foreach ($childNode->childNodes as $PanelNode) {
								if(strcasecmp($PanelNode->nodeName, "topPane") == 0 && $direction = 'h') {
									$returnObject['panelA'] = JSONEncodeMenu::encodeContainerNode($PanelNode, $parentPanelHeaders);
								} elseif(strcasecmp($PanelNode->nodeName, "bottomPane") == 0 && $direction = 'h') {
									$returnObject['panelB'] = JSONEncodeMenu::encodeContainerNode($PanelNode, $parentPanelHeaders);
								} elseif(strcasecmp($PanelNode->nodeName, "leftPane") == 0 && $direction = 'v') {
									$returnObject['panelA'] = JSONEncodeMenu::encodeContainerNode($PanelNode, $parentPanelHeaders);
								} elseif(strcasecmp($PanelNode->nodeName, "rightPane") == 0 && $direction = 'v') {
									$returnObject['panelB'] = JSONEncodeMenu::encodeContainerNode($PanelNode, $parentPanelHeaders);
								} elseif(strcasecmp($PanelNode->nodeName, "panelA") == 0) {
									$returnObject['panelA'] = JSONEncodeMenu::encodeContainerNode($PanelNode, $parentPanelHeaders);
								} elseif(strcasecmp($PanelNode->nodeName, "panelB") == 0) {
									$returnObject['panelB'] = JSONEncodeMenu::encodeContainerNode($PanelNode, $parentPanelHeaders);
								}
							}
						}
						return $returnObject;
						break;
					case "stage":
						$returnObject['type'] = "stage";
						$returnObject["name"] = $childNode->getAttribute("name");
						$returnObject["HasMenuBarContainer"] = $childNode->getAttribute("HasMenuBarContainer");
						$returnObject["top"] = intval($childNode->getAttribute("top"));
						$returnObject["botton"] = intval($childNode->getAttribute("botton"));
						$returnObject["left"] = intval($childNode->getAttribute("left"));
						$returnObject["right"] = intval($childNode->getAttribute("right"));
						$returnObject["titleBarType"] = $childNode->getAttribute("titleBarType");
						$returnObject["windowOptionType"] = $childNode->getAttribute("windowOptionType");
						$returnObject["windowControlTypes"] = $childNode->getAttribute("windowControlTypes");
						$returnObject["sizable"] = $childNode->getAttribute("sizable");
						return $returnObject;
						break;
				}
			}
		}
	}
}
?>