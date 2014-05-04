<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
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
require_once("jar/derbyClass.php");
$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'No message given';

try {
	java_last_exception_clear();
	$GLOBALS["derbyNetworkServer"]->shutdown();
	$returnInformation['returnCode'] = 'true';
} catch (JavaException $e) {
	$returnInformation['returnValue'] = 'Error shutdown: '.$e->getMessage();
} 
echo json_encode($returnInformation);

?>