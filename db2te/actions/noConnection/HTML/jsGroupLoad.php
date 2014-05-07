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
require_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");

$location = getParameter('location');
$groupname = getParameter('groupName');
$basefileName = getParameter('jslistFileName');

if(is_dir($location) === false) return "";

if(is_file($location . $basefileName) === false) return "";
	

$fileContent = file_get_contents($location . $basefileName);
if($fileContent != false)
{
	$doc = new XMLNode();
	if($doc->loadXML($fileContent) !== false)
	{
			if(strcasecmp($doc->nodeName, "jsFileList") == 0)
			{
				findGroup($location, $doc, $groupname);
			}
	}
}

function findGroup($location, $JSlist, $groupname)
	{
		foreach($JSlist->childNodes as $file)
		{
			switch(strtolower($file->nodeName))
			{
				case "group":
					if($file->getAttribute("name") == $groupname)
					{
						processJSGroupDOM($location, $file);
						return;
					}
					else 
					{
						findGroup($location, $file, $groupname);
					}
					break;
			}
		}		
	}
	
function processJSGroupDOM($location, $JSlist)
	{
		foreach($JSlist->childNodes as $file)
		{
			switch(strtolower($file->nodeName))
			{
				case "file":
					$filename = $file->getAttribute("name");
					if($filename == null)
					{
						$filename = trim($file->textContent);
						readfile($location . $filename);
					}
					else
					{
						$minFileName = $file->getAttribute("minFileName");
						if($minFileName != null && JS_COMPRESSED_FILES_ENABLED)
						{
							readfile($location . $minFileName);
						}
						else 
						{
							readfile($location . $filename);
						}
					}
					break;
				case "group":
					$groupname = $file->getAttribute("name");
					$minFileName = $file->getAttribute("minFileName");
					if($minFileName != null && JS_COMPRESSED_FILES_ENABLED)
					{
						readfile($location . $minFileName);
					}
					else
					{
						processJSnodeDOM($basefileName, $location, $file);
					}
					break;
				case "directory":
					$folderName = $file->getAttribute("name");
					if($folderName == null)
					{
						$folderName = trim($file->textContent);
					}
					if($folderName != null && $folderName != "")
					{
						loadJSFolder($location . $folderName . "/");
					}
					break;
			}
			echo "\n\n";
		}		
	}