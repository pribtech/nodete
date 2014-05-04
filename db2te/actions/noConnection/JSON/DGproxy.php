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

include_once("./config_DG.php");

include_once(USER_PREFERENCES_DIRECTORY . DG_SERVER_LIST);

include_once(PHP_INCLUDE_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY . CURRENT_TE_LANGUAGE . "/DG_messages.php");

$returnObject = array();
$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = DG_PARAMETER_NOT_FOUND;
//$returnObject['returnDebug'] = "";

$DGSystemName = getParameter('DGSystemName');
$DGMethod = strtoupper(getParameter('DGMethod', ""));
$DGHeader	= getParameter('DGHeader', array());
$DGAction = getParameter("DGAction", "");
$DGHostname = getParameter('DGHostname', "");
$DGPortNumber = getParameter('DGPortNumber', "");

$DGPOSTData = getParameter("POST");

$APPXMLFileLoad = getParameter("appXML");
$DGXMLFileLoad = getParameter("dgXML");
$parameters = getParameter("parameters");

$DGLoadConnection = getParameter("LOAD_CONNECTION");

if(!is_array($DGHeader))
{
	$DGHeader = array($DGHeader);
}

if($DGXMLFileLoad != null)
{
	if(preg_match(FILE_VERIFICATION_REGEX, $DGXMLFileLoad))
	{
		if(file_exists($DGXMLFileLoad . ".xml"))
		{
			if($DGPOSTData == null) $DGPOSTData = array();
			$DGPOSTData['dgXML'] = file_get_contents($DGXMLFileLoad . ".xml");
			if(is_array($parameters))
			{
				foreach($parameters as $key => $value)
					$DGPOSTData['dgXML'] = str_replace("?$key?", $value, $DGPOSTData['dgXML']);
			}
		}
		else 
		{
			$returnObject['returnValue'] = str_replace('?FILE_NAME?', $DGXMLFileLoad . ".xml", DG_UNABLE_TO_ACCESS_FILE);
			echo json_encode($returnObject);
			exit;
		}
	}
	else 
	{
		$returnObject['returnValue'] = str_replace('?FILE_NAME?', $DGXMLFileLoad, DG_INVALID_FILE_NAME);
		echo json_encode($returnObject);
		exit;
	}
}

if($APPXMLFileLoad != null)
{
	if(preg_match(FILE_VERIFICATION_REGEX, $APPXMLFileLoad))
	{
		if(file_exists($APPXMLFileLoad . ".xml"))
		{
			if($DGPOSTData == null) $DGPOSTData = array();
			$DGPOSTData['appXML'] = file_get_contents($APPXMLFileLoad . ".xml");
			if(is_array($parameters))
			{
				foreach($parameters as $key => $value)
					$DGPOSTData['appXML'] = str_replace("?$key?", $value, $DGPOSTData['appXML']);
			}
		}
		else 
		{
			$returnObject['returnValue'] = str_replace('?FILE_NAME?', $APPXMLFileLoad . ".xml", DG_UNABLE_TO_ACCESS_FILE);
			echo json_encode($returnObject);
			exit;
		}
	}
	else 
	{
		$returnObject['returnValue'] = str_replace('?FILE_NAME?', $APPXMLFileLoad, DG_INVALID_FILE_NAME);
		echo json_encode($returnObject);
		exit;
	}
}

if($DGLoadConnection != null)
{
	$connection = connectionManager::getConnection($DGLoadConnection);
	if($connection != null)
	{
		if(($DGHostname != null && $DGPortNumber != null) || ($DGHostname != "" && $DGPortNumber != "")) 
		{
			$DGPOSTData['db2_conn'] = '<db2_conn>' .
				'<hostname><![CDATA[ ' . $DGHostname . ' ]]></hostname>' .
				'<port><![CDATA[ ' . $DGPortNumber . ' ]]></port>' .
				'<database><![CDATA[ ' . $connection->database . ' ]]></database>' .
				'<username><![CDATA[ ' . $connection->username . ' ]]></username>' .
				'<password><![CDATA[ ' . $connection->password . ' ]]></password>' .
				'</db2_conn>';
		}
		else 
		{
			$DGPOSTData['db2_conn'] = '<db2_conn>' .
				'<hostname><![CDATA[ ' . $connection->hostname . ' ]]></hostname>' .
				'<port><![CDATA[ ' . $connection->portnumber . ' ]]></port>' .
				'<database><![CDATA[ ' . $connection->database . ' ]]></database>' .
				'<username><![CDATA[ ' . $connection->username . ' ]]></username>' .
				'<password><![CDATA[ ' . $connection->password . ' ]]></password>' .
				'</db2_conn>';
		}
	}
	else 
	{
		$returnObject['returnValue'] = "Error: Connection does not exist";
		echo json_encode($returnObject);
		exit;
	}
}

if($DGSystemName != null && preg_match("/^(GET|POST|DELETE|PUT)$/", $DGMethod) === 1)
{
	$returnObject['returnValue'] = DG_SERVER_NOT_FOUND;
	
	if(array_key_exists($DGSystemName, $DGServerList))
	{
		$contentData = "";
		
		$DGHasEncodedReturnData = false;
		
		$DGHeader[] = "Authorization: basic " . base64_encode($DGServerList[$DGSystemName]['username'] . ":" . $DGServerList[$DGSystemName]['password']);

		if(is_array($DGPOSTData))
		{
			$contentData = http_build_query($DGPOSTData);
		}
		
		$DGHeader[] = "Content-type: application/x-www-form-urlencoded";
        $DGHeader[] = "Content-Length: " . strlen($contentData);
		
		$DGArguments = array(
			'http'=>array(
				'method'=>$DGMethod,
				'header'=>implode("\r\n", $DGHeader) . "\r\n",
				'content' => $contentData//,
				//'ignore_errors' => true
		  )
		);
		
		$DGContext = stream_context_create($DGArguments);
		//$returnObject['returnDebug'] = "http://" . str_replace("//", "/", $DGServerList[$DGSystemName]['server'] . "/" . $DGAction);
		try {
			$DGStream = @fopen("http://" . str_replace("//", "/", $DGServerList[$DGSystemName]['server'] . "/" . $DGAction),
							"rb",
							false,
							$DGContext);
		} catch(Exception $e) {
			$returnObject['returnValue'] = $e->getMessage();
		}
		$returnObject['returnValue'] = error_get_last();

		if($DGStream !== false)
		{			
			$DGReturnedMetaData = stream_get_meta_data($DGStream);
			
			$DGReturnData = stream_get_contents($DGStream);
			
			$returnObject['returnValue'] = DG_COUND_NOT_RETERVE_DATA;

			if($DGReturnData !== false)
			{
				if(array_key_exists('wrapper_data', $DGReturnedMetaData))
				{
					foreach($DGReturnedMetaData['wrapper_data'] as $returnArgument)
					{
						if(preg_match("/^Content-Type/", $returnArgument) === 1)
						{
							if(stristr($returnArgument, "JSON") !== false)
							{
								$DGHasEncodedReturnData = true;
								$DGReturnData = json_decode($DGReturnData);
							}
							else if(stristr($returnArgument, "XML") !== false)
							{
                                $returnObject['returnValueRAW'] = $DGReturnData;							
                                $DGHasEncodedReturnData = true;
								$doc = new XMLNode();
								if($doc->loadXML($DGReturnData) !== false)
								{
									$DGReturnData = $doc->arrayEncodeXML();
								}
							}
							break;
						}
					}
				}
				if($DGHasEncodedReturnData === false)
				{
					$doc = new XMLNode();
					if($doc->loadXML($DGReturnData) !== false)
					{
						$DGReturnData = $doc->arrayEncodeXML();
					}
				}
				$returnObject['returnCode'] = 'true';
				$returnObject['returnValue'] = $DGReturnData;		
			}
		}
		else if(array_key_exists('message', $returnObject['returnValue']))
		{
			$message = $returnObject['returnValue']['message'];
			$message = preg_split('/HTTP\/[0-9]\.[0-9] [0-9][0-9][0-9]/', $message);
			if(count($message) > 1)
			{
				$returnObject['returnValue'] = trim($message[count($message)-1]);
			}
			else 
			{
				$returnObject['returnValue'] = trim($message[0]);
				if(stristr($returnObject['returnValue'], "Connection refused"))
					$returnObject['returnValue'] = DG_SERVER_NOT_FOUND;
			}
		}
	}
}

echo json_encode($returnObject);
