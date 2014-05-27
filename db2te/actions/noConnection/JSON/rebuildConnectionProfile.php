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
TE_check_session_timeout();

$returndata = array();
try {
	if(!isset($connectionProfile))
		$connectionProfile = new connectManagerNodes();
	$connectionProfile->rebuild();
	$connectionProfile->save();
	$returndata['returnCode'] = 'true';
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	throw new Exception($e->getmessage());
}
echo json_encode($returndata);
?>