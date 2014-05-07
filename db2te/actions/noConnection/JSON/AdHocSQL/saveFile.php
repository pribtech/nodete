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

$fileName 			= trim(getParameter('fileName', ""));
$informationToSave 	= rawurldecode(getParameter('data', ""));

$returnObject = array();

$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = 0;

if(trim($informationToSave) == "")
{
	$returnObject['returnValue'] = 'Nothing to save';
}
elseif(!preg_match(FILE_VERIFICATION_REGEX, $fileName))
{
	$returnObject['returnValue'] = "Invalid filename:{$fileName}. Valid characters are: 0-9, a-z, A-Z, -, _";
}
elseif(is_dir(QUERY_FILES_DIRECTORY.$fileName))
{
	$returnObject['returnValue'] = " Couldn\'t save because {$fileName} corresponds to a valid directory";
} 
//elseif(!is_writable(QUERY_FILES_DIRECTORY . $fileName. ".SQL"))
//{
//	$returnObject['returnValue'] = "You do not have permision to save the file in the location: {$fileName}";
//}
else 
{
	if(@file_put_contents(QUERY_FILES_DIRECTORY . $fileName. ".SQL" , $informationToSave , FILE_USE_INCLUDE_PATH))
	{
		$returnObject['returnCode'] = 'true';
		$returnObject['returnValue'] = "SQL Query successfully saved in file: {$fileName}";
	}
	
	else
	{
		$returnObject['returnValue'] = "SQL Query could NOT be saved in: {$fileName}";
	}
}

echo json_encode($returnObject);