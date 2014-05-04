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

/* main() - start *************************************************************/

$instanceName	= db2Parameter('instanceName');
$setState 		= db2Parameter('setState');

$username = getParameter('username', null);
$password = getParameter('password', null);
$hostname = getParameter('hostname', null);

$returnObject = array();
$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = "Userid and/or Password not found";

// Internal message variable.
$message = '';

if ($username == null || $password == null) {
	echo  json_encode($returnObject);
	exit;
}

if (strcasecmp($setState,'start') == 0) {
	if (db2startstop($hostname, $instanceName, $username, $password, 'start')) {
		$returnObject['returnCode'] = 'true';
		$returnObject['returnValue'] = "Instance: $instanceName successfully started."; 
	} else {
		$returnObject['returnValue'] = "Error encountered while attempting to start instance: $instanceName";  
	}
} elseif (strcasecmp($setState,'stop') == 0) {
	if (db2startstop($hostname, $instanceName, $username, $password, 'stop')) {
		$returnObject['returnCode'] = 'true';
		$returnObject['returnValue'] = "Instance: $instanceName successfully stopped.";  
	} else {
		$returnObject['returnValue'] = "Error encountered while attempting to stop instance: $instanceName";  
	}
} else {
	$returnObject['returnValue'] = "Unknown command option.";  
}
	echo  json_encode($returnObject);
/* main() - end ***************************************************************/


function db2startstop ($hostname, $instance_name, $userid, $password, $startstop) {
	$filtered_hostname = filter_var($hostname, FILTER_SANITIZE_STRING);
	$filtered_iname = filter_var($instance_name, FILTER_SANITIZE_STRING);
	$filtered_uid = filter_var($userid, FILTER_SANITIZE_STRING);
	$filtered_pwd = filter_var($password, FILTER_SANITIZE_STRING);
	 
	$success = false;
	$conn = false;
	
	if ($filtered_hostname == null) {
		$filtered_hostname = 'localhost';
	}
	
	if ($filtered_hostname && $filtered_iname && $filtered_uid && $filtered_pwd) {
		if ( $conn = ssh2_connect($filtered_hostname, 22))
		{
			 
			if (ssh2_auth_password($conn, $filtered_uid, $filtered_pwd))
			{
				 
				if ($startstop == 'start') {
					$cmd = "db2 start dbm remote $filtered_iname hostname localhost user $filtered_uid using $filtered_pwd";
				} else if ($startstop == 'stop') {
					$cmd = "db2 stop dbm remote $filtered_iname hostname localhost user $filtered_uid using $filtered_pwd";
				}
				//echo ($cmd);
				$s = ssh2_exec($conn, $cmd);
				stream_set_blocking($s, true);
				while($line = fread($s, 1024)) {
					flush();
					//echo $line."\n";
					if ($startstop == 'stop') {
						if (substr_count($line, 'SQL1064N') + substr_count($line, 'SQL1032N') > 0) {
							$success = true;
							$message = "Instance: $filtered_iname successfully started.";
						} else {
							$success = false;
							$message = "Error encountered while attempting to start instance: $filtered_iname";
						}
					} else if ($startstop == 'start') {
						if (substr_count($line, 'SQL1063N') + substr_count($line, 'SQL1026N') > 0) {
							$success = true;
							$message = "Instance: $filtered_iname successfully stopped.";
						} else {
							$success = false;
							$message = "Error encountered while attempting to stop instance: $filtered_iname";
						}
					}
				}
				fclose($s);
			} else {
				$success = false;
				$message = "Unable to authenticate";
			}
		} else {
			$success = false;
			$message = "Unable to open ssh shell";
		}

	} else {
		$success = false;
	}

	return $success;

}

function db2start ($instance_name, $userid, $password) {
	return db2startstop($instance_name, $userid, $password, 'start');
}

function db2stop ($instance_name, $userid, $password) {
	return db2startstop($instance_name, $userid, $password, 'stop');
}


?>
