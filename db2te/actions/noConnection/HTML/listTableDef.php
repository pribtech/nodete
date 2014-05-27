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
TE_check_session_timeout();

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ArrayEncodeTableDefinition.php");

if(!ALLOW_DEVELOPER_VIEW)
{
	echo "\n<table style='width:100%;height:100%'><tr><td align='center'>Table definition list not permitted. To enable set the configuration value ALLOW_DEVELOPER_VIEW to true.</td></tr></table>";
}
else 
{
	
$Data = loadTableDeffinitionlist(TABLE_DEFINITION_DIRECTORY, "");
echo "<div id='title'>List of table definition files</div>\n";
	echo "<table>\n";
	echo "<tr " . TABLE_TITLE_COLOR . "><td></td><td><b>XML</b></td><td><b>Content</b></td><td valign='top'><b>Table Definition reference</b></td><td valign='top'><b>Base Folder</b></td><td valign='top'><b>Directory</b></td><td valign='top'><b>Filename</b></td></tr>\n";
	
	$currentColor = 0;
	$i=0;
	foreach($Data as $currentTabeDeff)
	{
		$rowColor = constant("TABLE_ALT_COLORS_" . $currentColor); 		//set row color
		$currentColor = (++$currentColor) % NUMBER_OF_TABLE_ALT_COLORS;	//switch row color for next row
		
		echo "<tr $rowColor><td valign='top'>" . 
		$i++ .
			"</td><td valign='top'><img src='images/icon-link-calendar.gif' onclick='miniLinkLoader(\"URL:http://?DB2MC_SERVER?/?ACTION_PROCESSOR??action=viewXML&table=" . $currentTabeDeff['TableDeffRef'] . "\",null,\"_blank\")'/>" . 
		
			"</td><td valign='top'><img src='images/icon-link-calendar.gif' onclick='miniLinkLoader({action:\"list_table\",table:\"" . $currentTabeDeff['TableDeffRef'] . "\"},\"\",\"_blank\")'/></td><td valign='top'>" . 
		$currentTabeDeff['TableDeffRef'] .
			"</td><td valign='top'>" . 
		$currentTabeDeff['BaseFolde'] .
			"</td><td valign='top'>" . 
		$currentTabeDeff['Directory'] .
			"</td><td valign='top'>" . 
		$currentTabeDeff['Filename'] .
			"</td></tr>\n";
	}
	
	echo "</table>\n";
}

function loadTableDeffinitionlist($baseFolder, $currentFolder)
{
	$returnArray = array();
	$directory = $baseFolder . $currentFolder;

	// if the current expected directory is not a directory return
	if(is_dir($directory) === false) return;

	// Acquire a list of files in the directory sorted ascending
	$fileInDir = scandir($directory, 0);


	foreach($fileInDir as $currentFile)
	{
		if(is_file($baseFolder . $currentFolder . "/" . $currentFile))
		{
			if(preg_match('/^.*\.xml$/i', $currentFile ))
			{
				$entry = array();
				$entry['TableDeffRef'] = substr($currentFolder . "/" . $currentFile, 1, -4);

				$table = ArrayEncodeTableDefinition::fromFile($entry['TableDeffRef'], $baseFolder . $currentFolder . "/" . $currentFile);
				
				$entry['BaseFolde'] = $baseFolder;
				$entry['Directory'] = $currentFolder;
				$entry['Filename'] = $currentFile;
				$entry['SQLTitle'] = $table["singularName"];
				$entry['QueryType'] = $table["queryType"];
				$entry['QueryBase'] = $table["baseQuery"];
				$entry['Description'] = $table["description"];
				$returnArray[] = $entry;
			}	
		}
		elseif($currentFile != "." && $currentFile != ".." && is_dir($baseFolder . $currentFolder . "/" . $currentFile))
		{
			$returnArray = array_merge($returnArray, loadTableDeffinitionlist($baseFolder, $currentFolder . "/" . $currentFile));
		}
	}
	
	return $returnArray;
}
?>