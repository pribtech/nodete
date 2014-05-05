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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

class ArrayEncodeFeed {
	
	static $maxItemsToReturn = 10;
	
	static function fromFile($directory, $filename)	{
		if(file_exists($directory.$filename))
			return ArrayEncodeFeed::fromString(file_get_contents($directory . $filename));
		error_log('ArrayEncodeFeed::fromFile file not found : '.$directory . $filename,0);
		return null;
	}
	
	static function fromString($actionXML)	{
		if($actionXML != "")		{
			try 			{
				$doc = new XMLNode();
				if($doc->loadXML($actionXML) !== false)
					return ArrayEncodeFeed::fromDOM($doc);
			} catch (Exception $e){}
		}
		error_log('ArrayEncodeFeed::fromString exception xlm: '.$actionXML,0);
		return null;		
	}
	
	static function fromDOM($Mainnode) {	
		if($Mainnode == null) return;
		
		$returnObject = null;
		
		if($Mainnode->hasChildNodes()) {
			switch (strtolower($Mainnode->nodeName)) {
				case "feed": // This will indicate an Atom feed
					$returnObject 			= ArrayEncodeFeed::encodeBaseInfoNode($Mainnode);
					$returnObject['items'] 	= ArrayEncodeFeed::extractEntries($Mainnode);
					break;
				
				case "rss": // RSS 2.0
					$channelNode = $Mainnode->findChildNode("channel");
					if($channelNode != null) {		
						$returnObject 			= ArrayEncodeFeed::encodeBaseInfoNode($channelNode);
						$returnObject['items'] 	= ArrayEncodeFeed::extractItems($channelNode);
					}
					break;
				case "rdf": // RSS 1.0
					$channelNode = $Mainnode->findChildNode("channel");
					if($channelNode != null) {		
						$returnObject 			= ArrayEncodeFeed::encodeBaseInfoNode($channelNode);
						$returnObject['items']	= ArrayEncodeFeed::extractItems($Mainnode);
					}
					break;
			}
		}
		
		return $returnObject;
	}
	
	static function encodeBaseInfoNode($node) {
		if($node == null) return null;
		
		$returnObject = array();
		$returnObject['title'] 			= $node->getChildTextContent('title', "No title");
		$returnObject['date'] 			= $node->getChildTextContent('pubDate', $node->getChildTextContent('updated', ""));
		$returnObject['description'] 	= $node->getChildTextContent('description', "");
		$returnObject['link'] 			= $node->getChildTextContent('link', "");
		$returnObject['items'] 			= array();
		
		return $returnObject;
	}

	static function extractItems($parentNode) {
		$returnCount = 0;
		$returnObject = array();

		if($parentNode->hasChildNodes()) {
			foreach($parentNode->childNodes as $node) {
				if((strcasecmp($node->nodeName, "item")) === 0) {
					$RSSNewsItem = array();
					$RSSNewsItem['title'] 	= $node->getChildTextContent('title', "No title found.");
					$RSSNewsItem['date'] 	= $node->getChildTextContent('pubDate');
					$RSSNewsItem['dateDisplay'] = $RSSNewsItem['date'] ;
					if($RSSNewsItem['date'] != null) {
						$RSSNewsItem['dateUnixFormat'] = strtotime($RSSNewsItem['date']);
						if($RSSNewsItem['dateUnixFormat'] !== false)
							$RSSNewsItem['dateDisplay'] = ArrayEncodeFeed::generateDisplayDate($RSSNewsItem['dateUnixFormat']);
					}  else  {
						$RSSNewsItem['date'] = "No date found.";
						$RSSNewsItem['dateDisplay'] = $RSSNewsItem['date'];
					}
					$RSSNewsItem['description'] = $node->getChildTextContent('description', "No summary found.");
					$RSSNewsItem['link'] = $node->getChildTextContent('link', "No link found.");
			
					$returnObject[] = $RSSNewsItem;
					$returnCount++;
				}
				if(ArrayEncodeFeed::$maxItemsToReturn <= $returnCount) break;
			}
		}
		 	
		return $returnObject;
	}
	
	static function extractEntries($parentNode) {
		$returnCount = 0;
		$returnObject = array();

		if($parentNode->hasChildNodes()) {
			foreach($parentNode->childNodes as $node) {
				if((strcasecmp($node->nodeName, "entry")) === 0) {
					$RSSNewsItem = array();
					$RSSNewsItem['title'] 	= $node->getChildTextContent('title', "No title found.");
					$RSSNewsItem['date'] 	= $node->getChildTextContent('published', $node->getChildTextContent('updated', ""));
					$RSSNewsItem['dateDisplay'] = $RSSNewsItem['date'];
					if($RSSNewsItem['date'] != null) {
						$RSSNewsItem['dateUnixFormat'] = strtotime($RSSNewsItem['date']);
						if($RSSNewsItem['dateUnixFormat'] !== false)
							$RSSNewsItem['dateDisplay'] = ArrayEncodeFeed::generateDisplayDate($RSSNewsItem['dateUnixFormat']);
					} else  {
						$RSSNewsItem['date'] = "No date found.";
						$RSSNewsItem['dateDisplay'] = $RSSNewsItem['date'];
					}
					$RSSNewsItem['description'] = $node->getChildTextContent('summary', "No summary found.");
					$RSSNewsItem['link'] = $node->getChildTextContent('link', "No link found.");
			
					$returnObject[] = $RSSNewsItem;
					$returnCount++;
				}
				if(ArrayEncodeFeed::$maxItemsToReturn <= $returnCount) break;
			}
		}
		 	
		return $returnObject;
	}
	
	static function generateDisplayDate($dateString) {
		$daysFromEpochToday = (int)(time()/86400);
		$daysFromEpoch = (int)($dateString/86400);
		$stringDateInfo = getdate($dateString);
		
		if($daysFromEpochToday == $daysFromEpoch)
			return "Today";
		else if($daysFromEpochToday == ($daysFromEpoch+1))
			return "Yesterday";
		else
			return $stringDateInfo['mday'] . " " . substr($stringDateInfo['month'],0,3) . " " . $stringDateInfo['year'];
	}
}
