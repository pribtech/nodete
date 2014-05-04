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

$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'No message given';
$message = getParameter('message');
$type = strtolower(getParameter('type','MD5'));
if($message !== null)
{
	$hashtypes = hash_algos();
	$hashtypes = array_flip($hashtypes);
	
	if(isset($hashtypes[$type]))
	{
		$returnInformation['returnValue'] = hash($type, $message);
        $returnInformation['returnCode'] = 'true';
	} else 
	{
		$returnInformation['returnValue'] = 'Hash algorithm not found';
	}
}

echo json_encode($returnInformation);
?>