<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2014 All rights reserved..
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

TE_session_start();
try{
	TE_session_destroy();
	$returnObject['returnCode'] = "true";
	$returnObject['returnValue'] = "";
} catch (Exception $e){
	$returnObject['returnCode'] = "false";
	$returnObject['returnValue'] = $e->getmessage();
}
TE_session_write_close();;

echo json_encode($returnObject);

?>