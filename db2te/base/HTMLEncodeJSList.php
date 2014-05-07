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

	loadJSFolder(JS_BASE_DIRECTORY);
	
	loadJSFolder(JS_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY . CURRENT_TE_LANGUAGE . "/");
	
	function loadJSFolder($location) {
		// if the current expected directory is not a directory return
		if(is_dir($location) === false) return "";
	
		// Acquire a list of files in the directory sorted ascending
		$fileInDir = scandir($location, 0);
		
		sort($fileInDir);
	
		foreach($fileInDir as $currentFile) {
			// Look for XML files that start with 'menu_' and end with '.xml' while ignoring case
			if(!preg_match('/^jsList_.*\.xml$/i', $currentFile )) continue;
			$fileContent = file_get_contents($location . $currentFile);
			if($fileContent == false) continue;
			$doc = new XMLNode();
			if($doc->loadXML($fileContent) == false) { 
				error_log('loadJSFolder exception xlm: '.$fileContent,0);
				continue;
			}
			if(strcasecmp($doc->nodeName, "jsFileList") == 0)
				processJSnodeDOM($currentFile, $location, $doc);
		}
	}
	
	function processJSnodeDOM($basefileName, $location, $JSlist) {
		foreach($JSlist->childNodes as $file) {
			switch(strtolower($file->nodeName)) {
				case "file":
					$filename = $file->getAttribute("name");
					if($filename == null) {
						$filename = trim($file->textContent);
						echo "<script type='text/javascript' src='" . $location . $filename . "'></script>\n";
					} else {
						$minFileName = $file->getAttribute("min-name");
						if($minFileName != null && JS_COMPRESSED_FILES_ENABLED)
							echo "<script type='text/javascript' src='" . $location . $minFileName . "'></script>\n";
						else 
							echo "<script type='text/javascript' src='" . $location . $filename . "'></script>\n";
					}
					break;
				case "group":
					if(JS_GROUP_FILES_ENABLED) {
						$groupname = $file->getAttribute("name");
						$minFileName = $file->getAttribute("min-name");
						if($minFileName != null && JS_COMPRESSED_FILES_ENABLED && is_file($location . $minFileName))
							echo "<script type='text/javascript' src='" . $location . $minFileName . "'></script>\n";
						else if($groupname != null)
							echo "<script type='text/javascript' src='" . ACTION_PROCESSOR . "?" . http_build_query(array(
													'location' => $location,
													'groupName' => $groupname,
													'jslistFileName' => $basefileName,
													'action' => 'jsGroupLoad'
													)
												) . "'></script>\n";
						else
							processJSnodeDOM($basefileName, $location, $file);
					} else {
						$minFileName = $file->getAttribute("min-name");
						if($minFileName != null && JS_COMPRESSED_FILES_ENABLED && is_file($location . $minFileName))
							echo "<script type='text/javascript' src='" . $location . $minFileName . "'></script>\n";
						else
							processJSnodeDOM($basefileName, $location, $file);
					}
					break;
				case "directory":
					$folderName = $file->getAttribute("name");
					if($folderName == null)
						$folderName = trim($file->textContent);
					if($folderName != null && $folderName != "")
						loadJSFolder($location . $folderName . "/");
					break;
				case "action":
					$actionName = $file->getAttribute("name");
					echo "<script type='text/javascript' src='" . ACTION_PROCESSOR . "?" . http_build_query(array( 'action' => $actionName ) ) . "'></script>\n";
					break;
			}
		}		
	}
