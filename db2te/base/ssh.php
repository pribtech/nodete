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

function runSshScript2 ($credential_info_array, $input_cmd_array, $runType = "exec", $outputType = "block",$maxRunTime = 10, $database = "sample", $termCharater = "") {

	if(phpversion("SSH2") === false || !SSH2_ENABLED)
	{
		$returnArray['success'] = false;
		$returnArray['message'] = "SSH2 PHP extension isn't enabled or it is disabled in the console";
		$returnArray['returnValue'] = "SSH2 PHP extension isn't enabled or it is disabled in the console";
		return $returnArray;
	}
	
	$outputType = strtoupper($outputType);
	$runType = strtoupper($runType);

	$returnArray = array();
	$returnArray['success'] = false;
	$returnArray['message'] = "Unknown";
	$returnArray['returnValue'] = array();
	if($outputType == "BLOCK")
	{
		$returnArray['returnValue']['commands'] = array();
		$returnArray['returnValue']['outputs'] = array();
	}
	
	$success = false;
	$conn = false;

	$returnArray = array();
	$returnArray['returnCode'] = false;
	$output_array = array();
	$message = "";
	try {
	if ($credential_info_array) {
		if ( $conn = @ssh2_connect($credential_info_array["hostname"], 22))
		{
			$autenticated = false;
			if (strcasecmp($credential_info_array['ssh_auth_type'], "PUBKEY_FILE") == 0) {
				$autenticated = @ssh2_auth_pubkey_file($conn, $credential_info_array['userid'], $credential_info_array['pubkeyfile'], $credential_info_array['privkeyfile']);
			} else if (strcasecmp($credential_info_array['ssh_auth_type'], "PASSWORD") == 0) {
				$autenticated = @ssh2_auth_password($conn, $credential_info_array['userid'], $credential_info_array['password']);
			}	
			
			
			if($autenticated) {
				if($runType == "SHELL" || $runType == "DB2SHELL")
				{
					/* Switched from vt100 to vt220 to prevent unnecessary shell text colour codes from showing
					 * up in the output.
					*/
					$remoteShell = ssh2_shell($conn, "vt220");
				}
				foreach($input_cmd_array as $key=>$cmd) {

					$value = "";
					if($runType == "EXEC")
					{
						$stream = ssh2_exec($conn, $cmd, false);
						if($stream != null)
						{
							stream_set_blocking($stream, true );
							while($line = fread($stream, 1024))
							{
								 $value .= $line;
							}
							fclose($stream);
						}
					}
					elseif($runType == "SHELL")
					{
						$value = ShellCommandExecution($remoteShell,$cmd,$database,$termCharater,$maxRunTime);
					}elseif($runType == "DB2SHELL")
					{
						$value = db2ShellCommandExecution($remoteShell,$cmd,$database,$termCharater,$maxRunTime);
					}
					
					
					//$value = preg_replace('/^([A-Z][A-Z][A-Z2])([0-9][0-9][0-9][0-9])([A-Z])[\h]+([\V]+[\v])+/me', '"<span style=\"background-color:" . ($3 == "I" ? "#99FF99" : "#FF9999") .";\"><a onclick=\'OpenURLInFloatingWindow(\"http://publib.boulder.ibm.com/infocenter/db2luw/v9r5/topic/com.ibm.db2.luw.messages." . strtolower($1) . ".doc/doc/m" . strtolower($1) . str_pad($2, 5, "0") . strtolower($3) . ".html?noframes=1\")\'>$1$2$3</a>$4</span>"',$value);
					
					
					if($outputType == "BLOCK")
					{
						$returnArray['returnValue']['commands'][$key] = $cmd;
						$returnArray['returnValue']['outputs'][$key] = $value;
					}
					elseif ($outputType = "OBJECT")
					{
						$stmtReturn = array();
						$stmtReturn['command'] = $cmd;
						$stmtReturn['output'] = $value;
						$returnArray['returnValue'][] = $stmtReturn;
					}
				}
				if($runType == "SHELL" || $runType == "DB2SHELL")
				{
					fclose($remoteShell);
				}

				$returnArray['returnCode'] = true;
				$returnArray['message'] = "Commands executed.";
				
			} else {
				$returnArray['message'] = "Unable to authenticate";
			}
			
			
		} else {
			$returnArray['message'] = "Unable to open ssh shell";
		}
	}
	}
	catch(Exception $e)
	{
		$returnArray['message'] = $e;
	}

	return $returnArray;

}


function db2ShellCommandExecution($shell,$cmd, $database, $termCharater, $maxRunTime = 10) {
	
	stream_set_blocking($shell, true );
	$setTerm = "";
	
	if($termCharater == "" || $termCharater == null)
	{
		$termCharater = "";
	}
	else 
	{
		$setTerm = "-td" . $termCharater;
	}
		
	
  fwrite($shell,"db2 -v $setTerm -f /dev/tty\n");
    fflush($shell);
	usleep(1000000);
	
$cmd = "!echo '~~~~Command execution start'{$termCharater}
connect to {$database}{$termCharater}
{$cmd}
!echo '~~~~Command execution end'{$termCharater}
";
fwrite($shell,$cmd);

	$cmd_array = explode("\n", $cmd); 
	foreach ($cmd_array as $aLine)
	{
		
		$aLine .= "\n";
		$output .= $aLine;
		$aLineLenght = strlen($aLine);
		$charWriten = fwrite($shell,$aLine);
		if($aLineLenght != $charWriten)
		{
			fflush($shell);
			usleep(100000);
			$charWriten2Try = fwrite($shell,substr($aLine, $charWriten, $aLineLenght-$charWriten));
			if($aLineLenght < ($charWriten+$charWriten2Try))
			{
				$output .= "Error Writing command to server\n";
				return $output;
			}
		}
		usleep(1000);
	}
	fflush($shell);

  
  $output = "";
  $start = false;
  $maxRunTime = time() + $maxRunTime;
  while(!feof($shell)) {
  	usleep(100);
  	if($maxRunTime < time()) return $output . "\n\nMax invocation time reached!\n\n";
  	stream_set_timeout($shell, 1);
    $line = fgets($shell);
	//$line = filter_var($line, FILTER_SANITIZE_ENCODED );
	//echo $line;
    if(is_string($line))
    {
		if(stripos($line, '~~Command execution start') !== false) 
		{
		    $output = "";
		}
		else if(stripos($line, '~~Command execution end') === false) 
		{
		    $output .= $line;
		}
		else if(stripos($line, "echo") === false && stripos($line, '~~Command execution end') !== false)
		{
		    return $output;
		}
    }
  }
}


function ShellCommandExecution($shell,$cmd, $database, $termCharater, $maxRunTime = 10) {
	
	stream_set_blocking($shell, true );
	$setTerm = "";
	
	if($termCharater == "" || $termCharater == null)
	{
		$termCharater = "";
	}
	else 
	{
		$setTerm = "-td" . $termCharater;
	}
$cmd = "echo '~~~Command execution start'{$termCharater}
{$cmd}
echo '~~~Command execution end'{$termCharater}
exit{$termCharater}
";
fwrite($shell,$cmd);

	$cmd_array = explode("\n", $cmd); 
	foreach ($cmd_array as $aLine)
	{
		
		$aLine .= "\n";
		$aLineLenght = strlen($aLine);
		$charWriten = fwrite($shell,$aLine);
		if($aLineLenght != $charWriten)
		{
			fflush($shell);
			usleep(100000);
			$charWriten2Try = fwrite($shell,substr($aLine, $charWriten, $aLineLenght-$charWriten));
			if($aLineLenght < ($charWriten+$charWriten2Try))
			{
				$output .= "Error Writing command to server\n";
				return $output;
			}
		}
		usleep(1000);
	}
	fflush($shell);

  
  $output = "";
  $start = false;
  $maxRunTime = time() + $maxRunTime;
  while(!feof($shell)) {
  	usleep(100);
  	if($maxRunTime < time()) return $output . "\n\nMax invocation time reached!\n\n";
  	stream_set_timeout($shell, 1);
    $line = fgets($shell);
    if(is_string($line))
    {
		if(stripos($line, '~~Command execution start') !== false) 
		{
		    $output = "";
		}
		else if(stripos($line, '~~Command execution end') === false) 
		{
		    $output .= $line;
		}
		else if(stripos($line, "echo") === false && stripos($line, '~~Command execution end') !== false)
		{
		    return $output;
		}
    }
  }
}


function runSshScript ($hostname, $userid, $password, $input_cmd_array, $runType = "exec", $outputType = "block", $maxRunTime = 10, $database = "sample", $termCharater = "") {
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

// Unit test.
function sshtest() {
	$cred = array();
	$cred["ssh_auth_type"] = "PUBKEY_FILE";
	$cred["hostname"] = "coralxib18";
	$cred["userid"] = "cheungk";
	$cred["pubkeyfile"] = "/home/cheungk/.ssh/id_rsa.pub";
	$cred["privkeyfile"] = "/home/cheungk/.ssh/id_rsa";
	$cred["passphrase"] = "";

	$commandArray = array();
	$commandArray['ls'] = "ls -al";

	$result = runSshScript2($cred, $commandArray);
	print_r($result);
}

