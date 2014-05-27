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
TE_check_session_timeout();
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectCommand.php");
$commandToProcess 		= getParameter("command");
$function				= getParameter("function");
session_start();
$returndata['returnCode'] = "true";
try {
	if($commandToProcess == null) {
		throw new Exception("command must be specified");
	}

	switch (strtolower($function)) {
		case "getstatement":
		case "getform":
		    if (!isset($_SESSION['Command'][$commandToProcess])) {
				throw new Exception("Command $commandToProcess not found");
		    }
		    $command = unserialize($_SESSION['Command'][$commandToProcess]);
			break;
	}
	switch (strtolower($function)) {
		case "getstatement":
			$returndata['returnValue'] = $command->getStmt();
			break;
		case "getform":
			$returndata['returnValue'] = $command->getHtml();
			break;
		case "getobjectfromfile":
		case "getobject":
			try {
				unset($_SESSION['CommandClause']);
				unset($_SESSION['CommandHelp']);
				unset($_SESSION['Command']);
			    if (!isset($_SESSION['Command'])) {
					$_SESSION['Command']=array();
			    } else if (!is_array($_SESSION['Command'])) {
					$_SESSION['Command']=array();
			    }
				$command = new Command();
				if (strtolower($function)=='getobjectfromfile') {
					if(file_exists("./commands/".$commandToProcess.".xml")) {
						$commandToProcess="./commands/".$commandToProcess.".xml";
					} else if(file_exists($commandToProcess.".xml")) {
							$commandToProcess .= ".xml";
					} else if(!file_exists($commandToProcess)) {
							throw new Exception('Command file "'.$commandToProcess.'" not found');
					}
					$command->loadXML(file_get_contents($commandToProcess));
				} else {
					$command->loadXML($commandToProcess);
				}
				$name = $command->getName();
				$_SESSION['Command'][$name ] = serialize($command);
				$returndata['returnValue'] = $name;
			} catch (Exception $e){
				throw new Exception("Command definition failed due to an XML syntax error. {$e->getmessage()}");
			}
			break;
		default: 
			throw new Exception("function: $function unknown");
			break;
	}
} catch (Exception $e){
	$returndata['returnCode'] = "false";
	$returndata['returnValue'] = "Failed: {$e->getmessage()}";
}
session_write_close();
echo json_encode($returndata);
?>
