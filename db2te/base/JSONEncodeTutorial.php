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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenu.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeAction.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class JSONEncodeTutorial {
	
	static function fromFile($directory, $filename) {
		if(file_exists($directory.$filename))
			return JSONEncodeTutorial::fromString(file_get_contents($directory . $filename), $directory);
		logAndThrowException("cannot find file: ".$directory.$filename);
		return array();
	}

	static function HandleXmlError($errno, $errstr, $errfile, $errline) {
		if ($errno==E_WARNING && (substr_count($errstr,"DOMDocument::loadXML()")>0))
			logAndThrowException("error xml load: ".$errstr);
		else
			return false;
	}	

	static function fromString($tutorialXML, $ContentDIR) {
		if($tutorialXML == "") return array();
		try  {
			$doc = new XMLNode();
			set_error_handler('JSONEncodeTutorial::HandleXmlError');
			if($doc->loadXML($tutorialXML) == false) throw new Exception("could not load XML");
			restore_error_handler();
			return array_merge(JSONEncodeTutorial::fromDOM($doc, $ContentDIR) , array("sourceXML" => $tutorialXML ) );
		}
		catch (Exception $e) {
			restore_error_handler();
			logAndThrowException('Error JSONEncodeTutorial::fromString: '.$e->getMessage());
		}
		return array();		
	}
	
	static function fromDOM($tutorialXMLnode, $ContentDIR)	{
		if(strcasecmp($tutorialXMLnode->nodeName, "tutorial") == 0)	{
			$autoCloseWindowsInRightStage = $tutorialXMLnode->getAttribute("autoCloseWindowsInRightStage");
			$autoCloseWindowsInRightStage = $autoCloseWindowsInRightStage == "true" || $autoCloseWindowsInRightStage == "" ? true : false;
			
			$highlightCode = $tutorialXMLnode->getAttribute("autoHighlightCode");
			$highlightCode = $highlightCode == "true" ? true : false;
			
			$AdhocLong = $tutorialXMLnode->getAttribute("useLongAdHoc");
			$AdhocLong = $AdhocLong == "true" ? true : false;
			
			$disableAdHoc = $tutorialXMLnode->getAttribute("disableAdHoc");
			$disableAdHoc = $disableAdHoc == "true" ? true : false;
			
			$disableSetSchema = $tutorialXMLnode->getAttribute("disableSetSchema");
			$disableSetSchema = $disableSetSchema == "true" ? true : false;
			$tutorialSchema = $tutorialXMLnode->getAttribute("schema");
			if ($tutorialSchema==null || $tutorialSchema == '')
				$tutorialSchema = 'TUT' . strtoupper(base_convert((microtime(true)*10000) . $_SERVER['REMOTE_ADDR'][0]. $_SERVER['REMOTE_PORT'], 10, 36));
				
			$workshop = $tutorialXMLnode->getAttribute("workshop");

			$clearAdhocResults = $tutorialXMLnode->getAttribute("autoClearAdhocResults");
			$clearAdhocResults = $clearAdhocResults == "true" || $clearAdhocResults == "" ? true : false;

			$clearAdhocText = $tutorialXMLnode->getAttribute("autoClearAdhocText");
			$clearAdhocText = $clearAdhocText == "true" ? true : false;
			
			$leftContentPanelSize = $tutorialXMLnode->getAttribute("leftContentPanelSize", null);
			if($leftContentPanelSize != null) $leftContentPanelSize = intval($leftContentPanelSize);
			
			$tutorialParameters = $tutorialXMLnode->findChildNode("tutorialParameters");
			if($tutorialParameters != null)
				$tutorialParameters = $tutorialParameters->arrayEncodeXML(false);
			
			$returnObject = array();

			$returnObject['type'] = "tutorial";
			$returnObject['name'] = $tutorialXMLnode->getAttribute("name");
			$returnObject['useLongAcHoc'] = $AdhocLong;
			$returnObject['disableAdHoc'] = $disableAdHoc;
			$returnObject['workshop'] = $workshop; 
			$returnObject['contentFolder'] = $ContentDIR;
			$returnObject['disableSetSchema'] = $disableSetSchema;
			$returnObject['autoCloseWindowsInRightStage'] = $autoCloseWindowsInRightStage;
			$returnObject['autoClearAdhocResults'] = $clearAdhocResults;
			$returnObject['autoClearAdhocText'] = $clearAdhocText;
			$returnObject['leftContentPanelSize'] = $leftContentPanelSize;
			$returnObject['tutorialParameters'] = $tutorialParameters;
			$returnObject['defaultLayout'] = JSONEncodeMenu::encodePageWindow($tutorialXMLnode->findChildNode("defaultLayout"));
			$returnObject['globalCodeHighlightOptions'] = JSONEncodeTutorial::encodeCodeHighlightOptions($tutorialXMLnode->findChildNode("globalCodeHighlightOptions"));
			$returnObject['tutorialSchema'] = $tutorialSchema;
			$returnObject['dropSchema'] = $tutorialXMLnode->getAttribute("dropSchema");
			$returnObject['flowRestriction'] = $tutorialXMLnode->getChildTextContent("flowRestriction");
			$returnObject['closeAction'] = JSONEncodeAction::fromDOM($tutorialXMLnode->findChildNode("closeAction"));
			$returnObject['openAction'] = JSONEncodeAction::fromDOM($tutorialXMLnode->findChildNode("openAction"));
			$returnObject['pageList'] = JSONEncodeTutorial::encodePageList($tutorialXMLnode);
			$returnObject['WMDConfig'] = JSONEncodeTutorial::encodeWMDConfig($tutorialXMLnode->findChildNode("WMDConfig"));
			$returnObject['DGConfig'] = JSONEncodeTutorial::encodeDGConfig($tutorialXMLnode->findChildNode("DGConfig"));
			$returnObject['autoPlayTime'] = $tutorialXMLnode->getAttribute("autoPlayTime");
			$returnObject['splitRatio'] = $tutorialXMLnode->getAttribute("splitRatio");
			
			return $returnObject;
		}
		
		return array();
	}
	
	static function encodeWMDConfig($node) {
		if($node == null) return null;
		$returnObject = array();
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				switch(strtolower($childNode->nodeName)) {
					case "load":
						$returnObject['load'] = array();
						foreach ($childNode->childNodes as $loadNode) {
							$type = strtolower($loadNode->nodeName);
							switch($type) {
								case 'workload':
									if(!array_key_exists($type, $returnObject['load'])) $returnObject['load'][$type] = array();
									$name = $loadNode->getAttribute("name");
									if($name != "" && $name != "") {
										$returnObject['load'][$type][$name]['profile'] = $loadNode->getAttribute("profile");
										$returnObject['load'][$type][$name]['taskset'] = $loadNode->getAttribute("taskset");
									}
									break;
							}
						}
						break;
				}
			}
		}
		return $returnObject;
	}
	
	static function encodeDGConfig($node) {
		if($node == null) return null;
		$returnObject = array();
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				switch(strtolower($childNode->nodeName)) {
					case "load":
						$returnObject['load'] = array();
						foreach ($childNode->childNodes as $loadNode) {
							$type = strtolower($loadNode->nodeName);
							switch($type) {
								case 'generator':
									if(!array_key_exists($type, $returnObject['load'])) $returnObject['load'][$type] = array();
									$name = $loadNode->getAttribute("name");
									if($name != "" && $name != "") {
										$returnObject['load'][$type][$name]['config'] = $loadNode->getAttribute("config");
										$returnObject['load'][$type][$name]['schema'] = $loadNode->getAttribute("schema");
									}
									break;
							}
						}
						break;
				}
			}
		}
		return $returnObject;
	}

	
	static function encodePageList($node) {
		$returnObject = array();
		$returnObject['type'] = "pageList";
		$returnObject['introPages'] = array();
		$returnObject['numIntroPages'] = 0;
		$returnObject['generalPages'] = array();
		$returnObject['numGeneralPages'] = 0;
		$returnObject['lastPages'] = array();
		$returnObject['numLastPages'] = 0;
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				if(strcasecmp($childNode->nodeName, "pageList") === 0) {
					if($childNode->hasChildNodes()) {
						foreach ($childNode->childNodes as $pageNode) {
							if(strcasecmp($pageNode->nodeName, "page") === 0) {
								$type = $pageNode->getAttribute("type");
								
								switch(strtoupper($type)) {
									case "INTRO":
										$returnObject['introPages'][] = JSONEncodeTutorial::encodePage($pageNode);
										$returnObject['numIntroPages']++;
										break;
									case "GENERAL":
										$returnObject['generalPages'][] = JSONEncodeTutorial::encodePage($pageNode);
										$returnObject['numGeneralPages']++;
										break;
									case "LAST":
										$returnObject['lastPages'][] = JSONEncodeTutorial::encodePage($pageNode);
										$returnObject['numLastPages']++;
										break;
								}
							}
						}
					}
				}
			}
		};
		$returnObject['totalPages'] =  $returnObject['numIntroPages'] + $returnObject['numGeneralPages'] + $returnObject['numLastPages'];
		return $returnObject;
	}

	static function encodePage($node) {
		$closeWindowsInRightStage = $node->getAttribute("closeWindowsInRightStage");
		$closeWindowsInRightStage = $closeWindowsInRightStage == "true" || $closeWindowsInRightStage == "false" ? ($closeWindowsInRightStage == "false" ? false : true) : null;
		$clearAdhocResults = $node->getAttribute("clearAdhocResults");
		$clearAdhocResults = $clearAdhocResults == "true" || $clearAdhocResults == "false" ? ($clearAdhocResults == "false" ? false : true) : null;
		$clearAdhocText = $node->getAttribute("clearAdhocText");
		$clearAdhocText = $clearAdhocText == "true" || $clearAdhocText == "false" ? ($clearAdhocText == "true" ? true : false) : null;

		$returnObject = array();
		$returnObject['type'] = "page";
		$returnObject['name'] = $node->getAttribute("name");
		
		$returnObject['maximizeTo'] = $node->getAttribute("maximizeTo");
		$returnObject['entryAction'] = JSONEncodeAction::fromDOM($node->findChildNode("entryAction"));
		$returnObject['exitAction'] = JSONEncodeAction::fromDOM($node->findChildNode("exitAction"));
		$returnObject['preAdhocRunAction'] = JSONEncodeAction::fromDOM($node->findChildNode("preAdhocRunAction"));
		$returnObject['postAdhocRunAction'] = JSONEncodeAction::fromDOM($node->findChildNode("postAdhocRunAction"));
		$returnObject['contentFile'] = $node->getChildTextContent("contentFile");
		$returnObject['contentUrl'] = $node->getChildTextContent("contentUrl");
		$returnObject['contentText'] = $node->getChildTextContent("contentText");
		$returnObject['SQLOptions'] = JSONEncodeTutorial::encodeSQLOptions($node->findChildNode("SQLExecutionOptions"));
		$returnObject['SQLFile'] = $node->getChildTextContent("SQLFile");
		$returnObject['SQLText'] = $node->getChildTextContent("SQLText");
		$returnObject['codeHighlightOptions'] = JSONEncodeTutorial::encodeCodeHighlightOptions($node->findChildNode("codeHighlightOptions"));
		$returnObject['closeWindowsInRightStage'] = $closeWindowsInRightStage;
		$returnObject['clearAdhocResults'] = $clearAdhocResults;
		$returnObject['clearAdhocText'] = $clearAdhocText;
		$returnObject['loadActionScriptFile'] = $node->getChildTextContent("loadActionScriptFile");
		$returnObject['pageTransitionsDescription'] = $node->getChildTextContent("pageTransitionsDescription");
		$returnObject['autoLoadLink'] = JSONEncodeTutorial::encodeAutoLoadLink($node);
		$returnObject['focusOnWindow'] = $node->getAttribute("focusOnWindow");
		$returnObject['autoPlay'] = $node->getAttribute("autoPlay");
		$returnObject['splitRatio'] = $node->getAttribute("splitRatio");
		return $returnObject;		
	}
	
	static function encodeCodeHighlightOptions($node)  {
		if($node == null) return null;
		
		$highlightCode = $node->getAttribute("highlightCode");
		$highlightCode = $highlightCode == "true" || $highlightCode == "false" ? ($highlightCode == "false" ? false : true) : null;
		
		$returnObject = array();
		$returnObject['highlightCode'] = $highlightCode;
		$returnObject['addedHighlightTokens'] = JSONEncodeTutorial::encodeCodeHighlightTokenList($node->findChildNode("addedHighlightTokens"));
		$returnObject['changedHighlightTokens'] = JSONEncodeTutorial::encodeCodeHighlightTokenList($node->findChildNode("changedHighlightTokens"));
		$returnObject['removedHighlightTokens'] = JSONEncodeTutorial::encodeCodeHighlightTokenList($node->findChildNode("removedHighlightTokens"));
		$returnObject['copiedHighlightTokens'] = JSONEncodeTutorial::encodeCodeHighlightTokenList($node->findChildNode("copiedHighlightTokens"));
		return $returnObject;
	}
	
	static function encodeCodeHighlightTokenList($node) {
		$returnObject = array();
		if($node == null) return $returnObject;
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				if(strcasecmp($childNode->nodeName, "text") === 0) 
					$returnObject[] = preg_replace('/([.*+\\\$\^\[\]\(\)\{\}?])/', '\\\\${1}', $childNode->textContent);
				elseif(strcasecmp($childNode->nodeName, "regex") === 0)
					$returnObject[] =  $childNode->textContent;
			}
		}
		return $returnObject;
	}
	
	static function encodeSQLOptions($node) {
		$returnObject = array();
		$returnObject['type'] = "sqlOptions";
		if($node === null || $node === "" || $node === false)
			$node = new XMLNode();	
		
		$temp = $node->getAttribute("xml", AD_HOC_DISPLAY_XML);
		$returnObject['displayXML'] = $temp == "true" || $temp === true ? true : false;
		$temp = $node->getAttribute("clob", AD_HOC_DISPLAY_CLOB);
		$returnObject['displayCLOB'] = $temp == "true" || $temp === true ? true : false;
		$temp = $node->getAttribute("xmlinline", AD_HOC_DISPLAY_XML_AS_INLINE);
		$returnObject['displayXMLinline'] = $temp == "true" || $temp === true ? true : false;
		$temp = $node->getAttribute("clobinline", AD_HOC_DISPLAY_CLOB_AS_INLINE);
		$returnObject['displayCLOBinline'] = $temp == "true" || $temp === true ? true : false;
		$temp = $node->getAttribute("blob", AD_HOC_DISPLAY_BLOB);
		$returnObject['displayBLOB'] = $temp == "true" || $temp === true ? true : false;
		$temp = $node->getAttribute("dbclob", AD_HOC_DISPLAY_DBCLOB);
		$returnObject['displayDBClob'] = $temp == "true" || $temp === true ? true : false;

		$returnObject['termChar'] = $node->getAttribute("termChar", AD_HOC_TERMINATION_CHAR);
		$temp = $node->getAttribute("cursor", AD_HOC_USER_FORWARD_ONLY_CURSOR);
		$returnObject['cursor'] = $temp == "true" || $temp === true ? true : false;
		$temp = $node->getAttribute("commitPerStmt", AD_HOC_COMMIT_PER_STMT);
		$returnObject['commitPerStmt'] = $temp == "true" || $temp === true ? true : false;
		$returnObject['commentOnDoubleSlash']=($node->getAttribute("commentOnDoubleSlash", "true")!="false");
		
		$returnObject['numRowReturn'] = 0 + $node->getAttribute("numRowReturned", AD_HOC_NUMBER_OF_ROWS_TO_RETURN);
		$returnObject['maxExecutionTime'] = $node->getAttribute("maxExecutionTime", AD_HOC_MAX_EXECUTION_TIME);
		$returnObject['scriptMode'] = $node->getAttribute("scriptMode", AD_HOC_SCRIPT_MODE);
		$returnObject['shellMaxRunTime'] = 0 + $node->getAttribute("shellMaxRunTime", SHELL_COMMAND_MAX_RUN_TIME);
		$returnObject['shellTermChar'] = $node->getAttribute("shellTermChar", SHELL_COMMAND_TERM_CHAR);
		$returnObject['saveResultIn'] = $node->getAttribute("saveResultIn", null);
			
		return $returnObject;
	}
	
	static function encodeAutoLoadLink($node) {
		$returnArray = array();
		if($node->hasChildNodes()) {
			foreach ($node->childNodes as $childNode) {
				if(strcasecmp($childNode->nodeName, "autoLoadLink") == 0) {
					$returnObject = array();
					$returnObject['type'] = "link";
					$returnObject['PageWindows'] = JSONEncodeMenu::encodePageWindowsFromDOM($childNode);
					$returnObject['LinkList'] = JSONEncodeMenu::retrieveLinksFromDOM($childNode);
					$returnArray[]=$returnObject;
				}
			}
		}
		return $returnArray;
	}
}
