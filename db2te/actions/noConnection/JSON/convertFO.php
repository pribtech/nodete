<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "objectFOP.php");

$fo = getParameter('fo');
$base64 = getParameter("base64", "true");
$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'No message given';

try {
	if($fo==null)
		throw new Exception('No source');
	$fop = new FOP();
	java_last_exception_clear();
	$returnInformation['returnValue'] = ($base64=='true'?$fop->getPDFbase64($fo):$fop->getPDF($fo));
	$returnInformation['returnCode'] = 'true';
} catch (Exception $e) {
	$returnInformation['returnValue'] = 'Error Convert FO '.$e->getMessage();
} 
echo json_encode($returnInformation);
?>