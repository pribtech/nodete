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
	require_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeAction.php");
	
	echo "	
GLOBAL_TE_SCRIPT_STORE = \$H();
";
	
	loadActionFolder(TE_SCRIPTS_BASE_DIRECTORY);

	
	function loadActionFolder($location)
	{
		// if the current expected directory is not a directory return
		if(is_dir($location) === false) return "";
	
		// Acquire a list of files in the directory sorted ascending
		$fileInDir = scandir($location, 0);
		
		sort($fileInDir);
	
		foreach($fileInDir as $currentFile)
		{
			if(preg_match('/^actionList_.*\.xml$/i', $currentFile ))
			{
				$fileContent = file_get_contents($location . $currentFile);
				if($fileContent !== false)
				{
					$doc = new XMLNode();
					if($doc->loadXML($fileContent) !== false)
					{
		 				if(strcasecmp($doc->nodeName, "AutoLoadActionList") == 0)
		 				{
							foreach($doc->childNodes as $childNode)
							{
								if(strcasecmp($childNode->nodeName, "action") == 0)
				 				{
				 					$name = $childNode->getAttribute("name");
				 					$file = $childNode->getAttribute("file");
				 					echo "GLOBAL_TE_SCRIPT_STORE.set('$name'," . json_encode(JSONEncodeAction::fromFile(TE_SCRIPTS_BASE_DIRECTORY, $file)) . ");\n"; 
				 				}
				 				elseif(strcasecmp($childNode->nodeName, "directory") == 0)
				 				{
				 					$value = trim($childNode->textContent);
				 					loadActionFolder($location . $value . "/");
				 				}
							}
		 				}
					}
				}
			}
		}
	}
