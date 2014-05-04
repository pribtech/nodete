<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved..
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
$returnInformation['returnCode'] = "true";
try {
	$returnInformation['returnValue'] = connectionManager::setFeatures();
} catch (Exception $e){
	$returnInformation['returnCode'] = "false";
	$returnInformation['success'] = false;
	$returnInformation['returnValue'] = "Failed: ".$e->getmessage();
	$returnInformation['message'] = $returnInformation['returnValue'];
}
echo json_encode($returnInformation);
		
?>