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
 ********************************************************************************/

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class feedSourceManager{

	public static function updateSourceList () {
		$sourceList = feedSourceManager::retrieveAllSources();
		
		$sourceID = getParameter('SOURCE_ID', count($sourceList));
		$sourceList[$sourceID]['title'] = getParameter('SOURCE_TITLE', "");
		$sourceList[$sourceID]['description'] = getParameter('SOURCE_DESCRIPTION', "");
		$sourceList[$sourceID]['link'] = getParameter('SOURCE_LINK', "");
		$sourceList[$sourceID]['enabled'] = (strtolower(getParameter('SOURCE_ENABLED', "true"))=="true");
		if($sourceList[$sourceID]['link'] == "") return false;
		return feedSourceManager::writeSourcesListToFile($sourceList);
	}
	
	public static function retrieveAllSources() {
		$sourceList = array();
		if(FEED_SOURCE_FILE !== false)
			$sourceList = feedSourceManager::fromFile(FEED_SOURCE_FILE);
		return $sourceList;
	}

	public static function removeSource($sourceTitle) {
		if(!is_string($sourceTitle))
			return;
		$sourceList = feedSourceManager::retrieveAllSources();
		unset($sourceList[$sourceTitle]);
		feedSourceManager::writeSourcesListToFile($sourceList);
	}
	
	private static function writeSourcesListToFile($sourceList) {
		if(FEED_SOURCE_FILE !== false) {
			$file = @fopen(FEED_SOURCE_FILE, 'w');
			if($file != false) {
				$XMLSourceList = "<?xml version='1.0'?>\n";
				$XMLSourceList .="<feedSourceList>\n";
				
				foreach($sourceList as $source)
						$XMLSourceList .= feedSourceManager::convertSourcesToXMLString($source);

				$XMLSourceList .="</feedSourceList>\n";
				fwrite($file, $XMLSourceList);
				fflush($file);
				fclose($file);
				
				return true;
			}
		}
		return false;
	}
	
	private static function convertSourcesToXMLString($source) {
		if(is_array($source)) {
			return "\t\t<source>\n"
						."\t\t\t<title><![CDATA[".$source['title']."]]></title>\n"
						. "\t\t\t<description><![CDATA[".$source['description']."]]></description>\n"
						. "\t\t\t<link><![CDATA[".$source['link']."]]></link>\n"
						. "\t\t\t<enabled><![CDATA[".($source['enabled']?"true":"false")."]]></enabled>\n"
						. "\t\t</source>\n";
		}
		return "";
	}
	
	static function fromFile($filename) {
		if(file_exists($filename))
			return feedSourceManager::fromString(file_get_contents($filename));
		return null;
	}
	
	static function fromString($actionXML) {
		if($actionXML != "") {
			try  {
				$doc = new XMLNode();
				if($doc->loadXML($actionXML) !== false)
					return feedSourceManager::fromDOM($doc);
				else 
					return null;
			}
			catch (Exception $e) {
				return null;
			}
		}
		return null;		
	}
	
	static function fromDOM($Mainnode) {
		if($Mainnode == null) return;
		if(strcasecmp($Mainnode->nodeName, "feedSourceList") !== 0) return;
		if(!$Mainnode->hasChildNodes()) return null;

		$returnObject = array();
		foreach($Mainnode->childNodes as $node) {
			if(strcasecmp($node->nodeName, "source") === 0 ) {	
				$source = array();
				$source['title'] = $node->getChildTextContent('title', "No title");
				$source['description'] = $node->getChildTextContent('description', "");
				$source['link'] = $node->getChildTextContent('link', "");
				$source['enabled'] = ( strtolower($node->getChildTextContent('enabled', "true"))=="true" );
				$returnObject[] = $source;
			}
		}
		return $returnObject;
	}
}