<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.
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

$jar = getParameter('jar');

try {
	$sql = "CALL sqlj.install_jar('file:".JAR_BASE_DIRECTORY.$jar.".jar', '".$jar."')";
	$statement = connectionManager::getNewStatement($sql);
	if($statement->errorMsg() != '') throw new Exception($statement->errorMsg().' sql: '.$sql);
	$statement = connectionManager::getNewStatement('CALL SQLJ.REFRESH_CLASSES()');
	if($statement->errorMsg() != '') throw new Exception($statement->errorMsg().' sql: CALL SQLJ.REFRESH_CLASSES() ');
	$returndata['returnCode']= "true";		
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	$returndata['returnValue'] = "Failed: ".$e->getmessage();
}
echo json_encode($returndata);


?>