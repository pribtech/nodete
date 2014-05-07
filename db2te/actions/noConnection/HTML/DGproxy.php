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

$DGSystemName = getParameter('DGSystemName');
$DGMethod = strtoupper(getParameter('DGMethod', ""));
$DGHeader	= getParameter('DGHeader', array());
$DGAction = getParameter("DGAction", "");
$DGHostname = getParameter('DGHostname', "");
$DGPortNumber = getParameter('DGPortNumber', "");

$ERROR = "";


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
			echo str_replace('?FILE_NAME?', $DGXMLFileLoad . ".xml", DG_UNABLE_TO_ACCESS_FILE);
			exit;
		}
	}
	else 
	{
		echo str_replace('?FILE_NAME?', $DGXMLFileLoad, DG_INVALID_FILE_NAME);
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
			echo str_replace('?FILE_NAME?', $APPXMLFileLoad . ".xml", DG_UNABLE_TO_ACCESS_FILE);
			exit;
		}
	}
	else 
	{
		echo str_replace('?FILE_NAME?', $APPXMLFileLoad, DG_INVALID_FILE_NAME);
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
		echo"Error: Connection does not exist";
		exit;
	}
}

if($DGSystemName != null && preg_match("/^(GET|POST|DELETE|PUT)$/", $DGMethod) === 1)
{
	$ERROR = DG_SERVER_NOT_FOUND;
	
	if(array_key_exists($DGSystemName, $DGServerList))
	{
		$contentData = "";
		
		$DGHasEncodedReturnData = false;
		
		$DGHeader[] = "Authorization: basic " . base64_encode($DGServerList[$DGSystemName]['username'] . ":" . $DGServerList[$DGSystemName]['password']);

		if(is_array($DGPOSTData))
		{
			$contentData = http_build_query($DGPOSTData);
		}
		
		$DGHeader[] = "Content-type: text/html";
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
			$ERROR = "<div><pre><code>" . htmlspecialchars($e->getMessage()) . "</code></pre></div>";
		}

		if($DGStream !== false)
		{			
			$DGReturnedMetaData = stream_get_meta_data($DGStream);
			
			$DGReturnData = stream_get_contents($DGStream);
			
			$ERROR = DG_COUND_NOT_RETERVE_DATA;

			if($DGReturnData !== false)
			{
				echo $DGReturnData;
				exit;
			}
		}
	}
}

echo $ERROR;
