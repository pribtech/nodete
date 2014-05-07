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

$rootDirectory = rawurldecode(getParameter('rootDirectory', "/"));

$title = rawurldecode(getParameter('title', "File Selector"));

echo "<div id=\"title\">$title</div>";

$dirValues;
$file;
$tableID = 0;

		
function directoryList($dir, $filter){

	// Parse the default menu directory along with the current level to acquire the current working directory
	$dir = QUERY_FILES_DIRECTORY . str_replace(".", "/", $dir);

	//echo ($dir);
	
	// if the current expected directory is not a directory return
	if(is_dir($dir) === false) return;

	global $dirValues;
	global $file;
	
	//echo ($dir);
	
	$total = array_diff(scandir($dir), array('.', '..')); # remove ' and .. from the array */
	
	foreach ($total as $value)
	{
		// Checking to see if it's a directory
			if (is_dir($dir.$value)){
				if(preg_match(FILE_VERIFICATION_REGEX, $value))
					$dirValues[] = $value.'/';
			}
			//$dir.$value is a file (not a Directory)
			else {
				if($filter != null || $filter != '')
				{
					if (stripos($value, $filter))
				   	$file[] = substr ($value, 0, -(strlen($filter))); /* just add the current $value to the $data array */  
			  }
			  else
			  {
			  	$file[] = $value; /* just add the current $value to the $data array */ 
			  }
			}
		}
}

		
function printList($dir, $filter){
	$calling_page = CALLING_PAGE;
	directoryList ($dir, $filter);
	$dirTable = "";
	global $dirValues;
	global $file;
	if(is_array($dirValues))
	{
		foreach ($dirValues as $value)
		{
			$count = uniqid();
			$folder = rawurlencode ($dir . $value);
			$dirTable .= <<<DIRTABLE
			<tr>
				<td>
					<table>
						<tr onclick="activeModalPanel.get('{$calling_page}').subDirectoryLoadCallBack('Directory_{$count}', '{$folder}');">
							<td>
								<img id="Directory_{$count}_image" src="images/folderClose.gif">
							</td>
							<td>
								$value
							</td>
						</tr>
						<tr>
							<td></td>
							<td>
								<div id="Directory_{$count}_sub" style="display:none">
								</div>
							</td>
						</tr>
					</table>
				</td>
			</tr>
DIRTABLE;
		}
	}
	
	if(is_array($file))
	{
		foreach ($file as $value)
		{
		$fileEncoded = rawurlencode ($dir.$value);
		$dirTable .= <<<DIRTABLE
		<tr>
			<td>
				<table onclick="activeModalPanel.get('{$calling_page}').fileCallBack('{$fileEncoded}');">
					<td>
						<img src="images/file.gif">
					</td>
					<td>
						$value
					</td>
				</table>
			</td>
		</tr>
DIRTABLE;

		}
	}
	$count = 0;
	
	
	if(!is_array($file) && !is_array($dirValues))
	{
		$dirTable .= <<<DIRTABLE
		<tr>
			<td>
				<table>
					<td>
					</td>
					<td>
						...
					</td>
				</table>
			</td>
		</tr>
DIRTABLE;
	}
		
	return ($dirTable);

}
?>		
	
<table style="cursor:pointer;">
<?php
if(!preg_match(FILE_VERIFICATION_REGEX, $rootDirectory))
{
	echo <<<DIRTABLE
			<tr>
				<td>
					<table>
						<td>
						</td>
						<td>
							invalid directory: $rootDirectory
						</td>
					</table>
				</td>
			</tr>
DIRTABLE;
}
else
{
	echo printList ($rootDirectory, '.sql');
}
?>

</table>

