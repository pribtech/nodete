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
$dataType = getParameter("dataType", "application/pdf");
$fileName = getParameter("dataType", "data.pdf");
$base64 = getParameter("base64", "false");
$disposition = getParameter("disposition", "inline");
$returnInformation = array();
$returnInformation['returnCode'] = 'false';
$returnInformation['returnValue'] = 'No message given';

$base64='true';
try {
	if($fo==null)
		throw new Exception('No source');
	$fop = new FOP();
	java_last_exception_clear();
	if ($base64=='true')
		$returnInformation['returnValue'] = $fop->getPDFBase64($fo);
	else {
		$arrayBin = $fop->getPDF($fo);
		$returnInformation['returnValue']='';
		foreach ($arrayBin as $data)
 			$returnInformation['returnValue'] .= pack("C", $data);
	}
} catch (Exception $e) {
	$returnInformation['returnValue'] = 'Error Convert FO '.$e->getMessage();
} 

header("Content-type: ".$dataType);
header("Content-Length: ".strlen($returnInformation['returnValue']));
header("Content-Disposition: ".$disposition."; filename=".$fileName);

if($base64=='true')
	header('Content-Transfer-Encoding: base64');
else
 	header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
echo $returnInformation['returnValue'];

?>