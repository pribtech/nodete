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
TE_check_session_timeout();
include_once("./config_WMD.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ArrayEncodeTableDefinition.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "FunctionLoadXMLDefFromDB.php");

include_once(USER_PREFERENCES_DIRECTORY . WMD_SERVER_LIST);

include_once(PHP_INCLUDE_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY . CURRENT_TE_LANGUAGE . "/WMD_messages.php");

$returnObject = array();
$returnObject['returnCode'] = 'false';
$returnObject['returnValue'] = WMD_PARAMETER_NOT_FOUND;
//$returnObject['returnDebug'] = "";

$WMDSystemName = getParameter('WMDSystemName');
$WMDMethod = strtoupper(getParameter('WMDMethod', ""));
$WMDHeader	= getParameter('WMDHeader', array());
$WMDAction = getParameter("WMDAction", "");
$WMDHostname = getParameter('WMDHostname', "");
$WMDPortNumber = getParameter('WMDPortNumber', "");

$encodeReturnObjectAs = strtoupper(getParameter("encodeObjectAs", null));

$WMDPOSTData = getParameter("POST");

$WMDXMLFileLoad = getParameter("XMLFile");
$parameters = getParameter("parameters");
$propertiesJSON = getParameter("properties");
$properties = json_decode($propertiesJSON, true);
$clientProgramName = getParameter("clientProgramName");

$WMDLoadConnection = getParameter("LOAD_CONNECTION");

if(!is_array($WMDHeader))
{
	$WMDHeader = array($WMDHeader);
}

if($WMDXMLFileLoad != null)
{
	if(preg_match(FILE_VERIFICATION_REGEX, $WMDXMLFileLoad))
	{
		if(file_exists($WMDXMLFileLoad . ".xml"))
		{
			if($WMDPOSTData == null) $WMDPOSTData = array();
			$WMDPOSTData['xml'] = file_get_contents($WMDXMLFileLoad . ".xml");
			if(is_array($parameters))
			{
				foreach($parameters as $key => $value)
					$WMDPOSTData['xml'] = str_replace("?$key?", $value, $WMDPOSTData['xml']);
			}
		}
		else 
		{
			$returnObject['returnValue'] = str_replace('?FILE_NAME?', $WMDXMLFileLoad . ".xml", WMD_UNABLE_TO_ACCESS_FILE);
			echo json_encode($returnObject);
			exit;
		}
	}
	else 
	{
		$returnObject['returnValue'] = str_replace('?FILE_NAME?', $WMDXMLFileLoad, WMD_INVALID_FILE_NAME);
		echo json_encode($returnObject);
		exit;
	}
}

if($WMDLoadConnection != null)
{
	$connection = connectionManager::getConnection($WMDLoadConnection);
	if($connection != null)
	{
		$connString = '<connection_profile><reconnection type="attempts" value="2" wait_time="20"/>' .
				'<dbms><![CDATA[ ' . Connection->getDBMS() . ' ]]></dbms>' .
				'<database><![CDATA[ ' . $connection->database . ' ]]></database>';
		if(($WMDHostname != null && $WMDPortNumber != null) || ($WMDHostname != "" && $WMDPortNumber != "")) 
		{
			$connString = $connString . '<hostname><![CDATA[ ' . $WMDHostname . ' ]]></hostname>' .
				'<port><![CDATA[ ' . $WMDPortNumber . ' ]]></port>';
				
		}
		else 
		{
			$connString = $connString .  '<hostname><![CDATA[ ' . $connection->hostname . ' ]]></hostname>' .
				'<port><![CDATA[ ' . $connection->portnumber . ' ]]></port>';

		}
		$connString = $connString . '<user><![CDATA[ ' . $connection->username . ' ]]></user>' .
				'<password encoded="false" not_saved="false"><![CDATA[ ' . $connection->password . ' ]]></password>';
				
		// clientProgramName
		if ($clientProgramName != null && $clientProgramName !="")
		{
				$connString = $connString . '<properties><property name="clientProgramName" value="' . $clientProgramName . '"/></properties>';
		}
		$properties = array("foo" => "bar", 12 => true);
		if(is_array($properties))
		{
			$connString = $connString . '<properties>';
			foreach($properties as $key => $value)
				$connString = $connString . '<property name="' . $key . '" value="' . $value . '"/>';
			$connString = $connString . '</properties>';
		}
		
		$connString = $connString . '</connection_profile>';
		$WMDPOSTData['xml'] = $connString;
	}
	else 
	{
		$returnObject['returnValue'] = "Error: Connection does not exist";
		echo json_encode($returnObject);
		exit;
	}
}

if($WMDSystemName != null && preg_match("/^(GET|POST|DELETE|PUT)$/", $WMDMethod) === 1)
{
	$returnObject['returnValue'] =  str_replace('?SERVER_NAME?', $WMDSystemName." host:".$WMDHostname." port:".$WMDPortNumber, WMD_SERVER_NOT_FOUND);
	
	if(array_key_exists($WMDSystemName, $WMDServerList))
	{
		$contentData = "";
		
		$WMDHasEncodedReturnData = false;
		
		$WMDHeader[] = "Authorization: basic " . base64_encode($WMDServerList[$WMDSystemName]['username'] . ":" . $WMDServerList[$WMDSystemName]['password']);

		if(is_array($WMDPOSTData))
		{
			$contentData = http_build_query($WMDPOSTData);
		}
		
		$WMDHeader[] = "Content-type: application/x-www-form-urlencoded";
        $WMDHeader[] = "Content-Length: " . strlen($contentData);
		
		$WMDArguments = array(
			'http'=>array(
				'method'=>$WMDMethod,
				'header'=>implode("\r\n", $WMDHeader) . "\r\n",
				'content' => $contentData//,
				//'ignore_errors' => true
		  )
		);
		
		$WMDContext = stream_context_create($WMDArguments);
		//$returnObject['returnDebug'] = "http://" . str_replace("//", "/", $WMDServerList[$WMDSystemName]['server'] . "/" . $WMDAction);
		try {
			$WMDStream = @fopen("http://" . str_replace("//", "/", $WMDServerList[$WMDSystemName]['server'] . "/" . $WMDAction),
							"rb",
							false,
							$WMDContext);
		} catch(Exception $e) {
			$returnObject['returnValue'] = $e->getMessage();
		}
		$returnObject['returnValue'] = error_get_last();

		if($WMDStream !== false)
		{			
			$WMDReturnedMetaData = stream_get_meta_data($WMDStream);
			
			$WMDReturnData = stream_get_contents($WMDStream);
			
			$returnObject['returnValue'] = WMD_COUND_NOT_RETERVE_DATA;

			if($WMDReturnData !== false)
			{
				if(array_key_exists('wrapper_data', $WMDReturnedMetaData))
				{
					foreach($WMDReturnedMetaData['wrapper_data'] as $returnArgument)
					{
						if(preg_match("/^Content-Type/", $returnArgument) === 1)
						{
							if(stristr($returnArgument, "JSON") !== false)
							{
								$WMDHasEncodedReturnData = true;
								$WMDReturnData = json_decode($WMDReturnData);
							}
							else if(stristr($returnArgument, "XML") !== false)
							{
                                $returnObject['returnValueRAW'] = $WMDReturnData;							
                                $WMDHasEncodedReturnData = true;
								$doc = new XMLNode();
								if($doc->loadXML($WMDReturnData) !== false)
								{
									$WMDReturnData = $doc->arrayEncodeXML();
									if($encodeReturnObjectAs != null)
									{
										if($encodeReturnObjectAs == "TABLE")
										{
											$WMDReturnData = ArrayEncodeTableDefinition::fromDOM($doc);
										}
										else
										{
										//error
											$returnObject['returnCode'] = 'false';
											$returnObject['returnValue'] = ERROR_ENCODING_OBJECT;	
										}
									}
									else
									{
										$WMDReturnData = $doc->arrayEncodeXML();
									}
								}
								
							}
							break;
						}
					}
				}
				if($WMDHasEncodedReturnData === false)
				{
					$doc = new XMLNode();
					if($doc->loadXML($WMDReturnData) !== false)
					{
						$WMDReturnData = $doc->arrayEncodeXML();
					}
				}
				$returnObject['returnCode'] = 'true';
				$returnObject['returnValue'] = $WMDReturnData;		
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
					$returnObject['returnValue'] = str_replace('?SERVER_NAME?', $WMDSystemName." host: ".$WMDHostname." port: ".$WMDPortNumber, WMD_SERVER_NOT_FOUND);;
			}
		}
	}
}

echo json_encode($returnObject);
