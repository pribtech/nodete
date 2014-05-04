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

@include_once('Net/SSH2.php');

function runSshScript2 ($credential_info_array, $input_cmd_array, $runType = "exec", $outputType = "block",$maxRunTime = 10, $database = "sample", 
		$termCharacter) {

	$returnArray = array();
	$returnArray['success'] = false;
	$returnArray['message'] = "Unknown";
	$returnArray['returnValue'] = array();

	$outputType = strtoupper($outputType);
	$runType = strtoupper($runType);

	$returnArray['returnValue']['commands'] = array();
	$returnArray['returnValue']['outputs'] = array();

	$success = false;
	$conn = false;

	$returnArray = array();
	$returnArray['returnCode'] = false;
	$output_array = array();
	$message = "";
	try {
		if ($credential_info_array) {
			if (class_exists("Net_SSH2")) {
				if ($conn = new Net_SSH2($credential_info_array["hostname"])) {
					$authenticated = false;

					//$conn->auth_keyboard($credential_info_array['userid']);
					$authenticated = $conn->login($credential_info_array['userid'], $credential_info_array['password']);

					if($authenticated) {


						$commands = explode($termCharacter, $input_cmd_array[0]);
	
						foreach ($commands as $key => $cmd) {
							$cmd = trim($cmd);
							$execResult = "";
							if ($cmd != "") {
								$execResult = $conn->exec($cmd);
								
								if($outputType == "BLOCK")
								{
									$returnArray['returnValue']['commands'][$key] = $cmd;
									$returnArray['returnValue']['outputs'][$key] = $execResult;
								}
								elseif ($outputType = "OBJECT")
								{
									$stmtReturn = array();
									$stmtReturn['command'] = $cmd;
									$stmtReturn['output'] = $execResult;
									$returnArray['returnValue'][] = $stmtReturn;
								}
							}
						}
						
						$returnArray['returnCode'] = true;

					} else {
						$returnArray['message'] = "Unable to authenticate" + $credential_info_array['userid'] + 
													"@" + $credential_info_array["hostname"];
					}


				} else {
					$returnArray['message'] = "Unable to open ssh shell to " + $credential_info_array["hostname"];
				}
			}
			else {
				$returnArray['message'] = "phpseclib not available, commands must be run manually.";
			}
		}
		else {
			$returnArray['message'] = "Cannot login, login credentials not provided.";
		}
	}
	catch(Exception $e)
	{
		$returnArray['message'] = $e;
	}

	return $returnArray;

}

function runSshScript ($hostname, $userid, $password, $input_cmd_array, $runType = "exec", $outputType = "block", $maxRunTime = 10, $database = "sample", 
		$termCharater) {
	$filtered_hostname = filter_var($hostname, FILTER_SANITIZE_STRING);
	$filtered_uid = filter_var($userid, FILTER_SANITIZE_STRING);
	$filtered_pwd = filter_var($password, FILTER_SANITIZE_STRING);
	if ($filtered_hostname == null) {
		$filtered_hostname = 'localhost';
	}

	$cred = array();
	$cred["ssh_auth_type"] = "PASSWORD";
	$cred["hostname"] = $filtered_hostname;
	$cred["userid"] = $filtered_uid;
	$cred["password"] = $filtered_pwd;

	return runSshScript2($cred, $input_cmd_array, $runType, $outputType, $maxRunTime, $database, $termCharater);
}
