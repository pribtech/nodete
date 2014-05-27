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

$password=getParameter("password");
TE_session_start();
try{
	if($password==null)
		throw new Exception('Password must be set');
	if($password=='')
		throw new Exception('Password must be set');
	if(strlen($password)<6)
		throw new Exception('Password must be greater than 6 characters, supplied only '.strlen($password));
	if(!function_exists('mcrypt_encrypt'))
		throw new Exception('Requires PHP mcrypt extension enabled');

	$passwordEncrypt=base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, cipherSecureKey('prib'.$_SERVER['REMOTE_ADDR']) , $password, MCRYPT_MODE_ECB));
	if(!isset($_SESSION['sessionPassword'])) {
		$_SESSION['sessionPassword']=$passwordEncrypt;
	} else if ($_SESSION['sessionPasswordFail']<=1) {
		TE_session_destroy();
		throw new Exception('Too many attempts on session password, a new session has been created');
	} else if ($_SESSION['sessionPassword']!==$passwordEncrypt) {
		$_SESSION['sessionPasswordFail']--;
		throw new Exception("Password doesn't match current session, new session built after ".$_SESSION['sessionPasswordFail']." more attempts");
	}
	$_SESSION['TIME_INITIALIZED'] = time(); 
	TE_set_session_time();
	$_SESSION['sessionPasswordFail']=6;
	$returnObject['returnCode'] = "true";
	$returnObject['returnValue'] = "";
} catch (Exception $e){
	$returnObject['returnCode'] = "false";
	$returnObject['returnValue'] = $e->getmessage();
}
TE_session_write_close();;

echo json_encode($returnObject);

?>