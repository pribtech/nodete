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

$fileName = rawurldecode(getParameter('fileName', ""));
$returnObject = array();

$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = 0;

if(!preg_match(FILE_VERIFICATION_REGEX, $fileName))
{
	$fileName = rawurlencode($fileName);
	$returnObject['returnValue'] = "Invalid filename:{$fileName}. Valid characters are: 0-9, a-z, A-Z, -, _";
} 
elseif(is_dir(QUERY_FILES_DIRECTORY.$fileName))
{
	$fileName = rawurlencode($fileName);
	$returnObject['returnValue'] = "Couldn't open file: {$fileName} because it corresponds to a valid directory";
}
else 
{
	if(is_file(QUERY_FILES_DIRECTORY.$fileName.".SQL"))
	{
		$returnObject['returnCode'] = 'true';
		$returnObject['returnValue'] = array();
		$returnObject['returnValue']['SQL_TEXT_FRAME'] = @file_get_contents(QUERY_FILES_DIRECTORY.$fileName.".SQL"	);
	}
	else 
	{
		$returnObject['returnValue'] = "File not found: {$fileName}";
	}
}

echo json_encode($returnObject);