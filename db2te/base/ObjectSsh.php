<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved.
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
class SshShell {
	private $client;
	private $connected = false;
	private $hostname;
	private $userid;
	private $port;
	private $password;
 	public function __construct($hostname='localhost',$port=22, $userid=null, $password=null) {
		require_once(JAR_BASE_DIRECTORY."/ssh.php"); 
 		$this->hostname=$hostname;
 		$this->userid=$userid;
 		$this->port=$port;
 		$this->password=$password;
		try {
 			$this->client= $GLOBALS["SshProcessor"]->newInstance();
		} catch (JavaException $ex) {
			$this->raiseError($ex->getCause());
		}
		if (is_array($hostname)) 
			$this->connect($hostname);
	}
	function __destruct() {
//		try {
//			if(isset($this->client))
//				if($this->client!=null)
//		       		$this->client->close();
//      	} catch (JavaException $ex) {  
//       		$this->raiseError('error closing ssh, error:'.$ex);
//       	}
    }
   	function raiseError($error) {
		$this->lastError=$error;
 		error_log('ObjectSsh failure: '.$error,0);
   		throw new Exception($error);
//   		error_log(var_export(debug_backtrace(),true),0);
   	}
   	function failed() {return isset($this->lastError);}
   	function getLastError() {return $this->lastError;}
   	function setTimeout($time) { $this->client->setTimeOut(intval($time));}
	public function connect ($hostname=null,$port=null, $userid=null, $password=null, $suUserid=null, $suPassword=null, $sudo=false) {
		if (is_array($hostname)) {
			if (!isset($hostname['node'])) 
				$this->raiseError("node ip address/name not set, passed:".var_export($hostname,true));
			$inHostname=$hostname['node'];
			$inUserid=$hostname['username'];
			$inPassword=$hostname['password'];
			if (isset($hostname['su'])) {
				if (!isset($hostname['su']['username'])) 
					$this->raiseError("su user not set");
				$inSuUserid=$hostname['su']['username'];
				$inSuPassword=$hostname['su']['password'];
				$inSudo=$hostname['su']['sudo'];
				if ($inSuUserid==null) 
					$this->raiseError("su user has not been set");
				if ($inSuUserid=="") 
					$this->raiseError("su user is spaces");
			}
		} else {
			$inHostname = ($hostname==null?$this->hostname:filter_var($hostname, FILTER_SANITIZE_STRING));
			$inUserid   = ($userid  ==null?$this->userid :filter_var($userid, FILTER_SANITIZE_STRING));
			$inPassword = ($password==null?$this->password:filter_var($password, FILTER_SANITIZE_STRING));
//			if ($this->conn) {
//				if ($inHostname==$this->hostname) 
//					if ($inUserid==$this->userid)
//						if ($inPassword!=$this->userid)
//							return; 
//			}
		}
		if ($inHostname==null) 
			$this->raiseError("node ip name/address has not been set");
		$this->hostname = $inHostname;
		if ($inUserid==null) 
			$this->raiseError("user name has not been specified");
		$this->userid = $inUserid;
		$this->password = $inPassword;
		settype($this->port, "integer");
		try {
			$this->client->connect($this->hostname,$this->port,$this->userid, $this->password);
		} catch (Exception $ex) {
			$this->raiseError($ex->getCause());
		} catch (JavaException $ex) {
			$this->raiseError($ex->getCause());
		}
		$this->connected=true;
		return;
	}
	public function command($command) {
		if (!$this->connected) 
			$this->connect(); 
		try {
			return $this->client->command($command);
		} catch (JavaException $ex) {
			$this->raiseError($ex->getCause());
		}	
	}
	function execCmd ($cmd) {
		if($cmd == null) $this->raiseError("No command");
		if(!is_string($cmd)) $this->raiseError("Command not a string, variable dump:".var_dump($cmd,true));
		return $this->format?$this->formatOutput($this->command($cmd)):$this->command($cmd);
	}
	function formatOutput($results) {
        $converted=""; 
    	$escapeSequence=""; 
    	$escape=chr(127);
    	for($i="0"; $i<strlen($results); $i++) {
 		    $char=substr($results,$i,1);
    		if( $char == $escape ) {
    			if($char == chr(127)) {
    				$escape='m';
    				continue;
    			}
    			$converted .= $char;
    			$escape==chr(127);
		    	$escapeSequence=""; 
   				continue;
    		}
    		if (ord($char)>31) {
    			$converted .= $char;
   				continue;
    		}
    		switch (ord($char)) {
    			case 10: continue 2;   
    			case 13: $converted .= "<br />" ; continue 2; 
    			case 9: $converted .= $char ; continue 2;    
    			default: break; 
    		}
    		if (ord($char)<32) 
	    		$converted .=  html_entity_decode("#".ord($char), ENT_NOQUOTES);
    	}
		return "<pre>".$converted."</pre>";
	}
	
	function run(&$input,$outputType = "",$format = "yes") {
		$this->format=($format == "yes");
		$outputType = strtoupper($outputType);
		$returnArray=array();
		if($outputType == "STREAM") {
			$returnArray['returnValue']=$this->execCmd($input);
			return $returnArray;
		}
		if($outputType == "BLOCK") {
			$returnArray['commands']=array();
			$returnArray['outputs']=array();
		}
		if(!is_array($input)) { 
			if($outputType == "BLOCK") {
				$returnArray['commands'][] = $input;
				$returnArray['outputs'][] = $this->execCmd($input);
			} else {
				$returnValue=array();
				$returnValue['command'] = $input;
				$returnValue['output'] =$this->execCmd($input);
				$returnArray['returnValue'][]=$returnValue;
			}
		} else {
			foreach($input as $key=>$cmd) {
				if($outputType == "BLOCK") {
					$returnArray['commands'][$key] = $cmd;
					$returnArray['outputs'][$key] = $this->execCmd($cmd);
				} else {
					$returnValue=array();
					$returnValue['command'] = $cmd;
					$returnValue['output'] =$this->execCmd($cmd);
					$returnArray['returnValue'][]=$returnValue;
				}
			}
		}
		return $returnArray;
	}
}

class DB2Shell extends SshShell {
	private $database=null;
	function execCmd ( $cmd) {
		if($cmd == null) parent::raiseError("No command");
		if(!is_string($cmd)) parent::raiseError("Command not a string, variable dump:".var_dump($cmd,true));

		$output=$this->command('db2 "'.str_replace(PHP_EOL,'\\'.PHP_EOL,$cmd).'"');

		if (substr($output,0,8) == 'SQL1024N' ) {
			if(! FORCE_CONNECTION_WITH_DEFAULT) {
				if (isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['database']))
					$this->database =  $_SESSION['Connections'][USE_DATABASE_CONNECTION]['database'];
			}
			if ($this->database== null) parent::raiseError('No database specified and required for command');
			$output=$this->command('db2 "connect to '.$this->database.'"');
			if (substr($output,0,3) == 'SQL' ) parent::raiseError($output);
			$output=$this->command('db2 "'.str_replace(PHP_EOL,'\\'.PHP_EOL,$cmd).'"');
		}
		return $output;
	}
}