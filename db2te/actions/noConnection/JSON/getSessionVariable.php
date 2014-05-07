<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved..
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

$names=getParameter("name");

function getSessionValue ($name) {
	$dimensions=explode('.',$name);
	$value=&$_SESSION;
	foreach($dimensions as $index) {
		if (!isset($value[$index])) {
			if (!isset($value[constant($index)])) {
				throw new Exception('**** variable '.$name.' not found in session store at level '.$index);
			}
			$index=constant($index);
		}
		$value=&$value[$index];
	}
	return $value;
}
$returnObject['returnCode'] = "true";
$returnObject['returnValue'] ="";
if (is_array($names)) {
	$returnObject['returnCode'] = "true";
	foreach($names as $key=>$name) {
		$returnObject['returnValue'][$key] = &getSessionValue($name);
	}	
} else $returnObject['returnValue'] = &getSessionValue($names);

echo json_encode($returnObject);

?>