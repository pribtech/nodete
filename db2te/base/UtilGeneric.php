<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
 *
 *  Addition and Modification, author: Peter Prib
 * 	Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2014 All rights reserved.
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

function NoConnectionMessageHTML() {
			my_header(TE_NOT_CONNECTED, "");
			echo "<table style='width:100%;height:100%'><tr><td align='center'>" . NOT_CONNECTED_MESSAGE . "</td></tr></table>";
			echo "<script type='text/javascript'>initiateConnectionRefresh();</script>";
}

function NoConnectionMessageJSON() {
	$returnObject = array();
	$returnObject['flagGeneralError'] = false;
	$returnObject['connectionError'] = false;
	$returnObject['returnCode'] = "false";
	$returnObject['returnValue'] = NOT_CONNECTED_MESSAGE;
	$returnObject['returnMessage'] = NOT_CONNECTED_MESSAGE;
	echo json_encode($returnObject);
}

function callAction($ActionToCall) {
	global $table, $metaConn, $action, $tableName, $schemaName;
	try {
  		include_once($ActionToCall);
	}catch(Exception $err){
		error_log($err,0);
		if(RETURN_TYPE == "JSON") {
			$errormsg = rawurlencode($err->getMessage());
			echo <<<JSON
			{
				flagGeneralError: true,
				connectionError:false,
				returnCode: "false",
				returnValue: "$errormsg"
			}
JSON;
		} else 
			print($err);
	}
}

/**
 * Displays the common header html given a title and description
 */
function my_header($title, $description) {
	$title = trim($title);
	
	$panelID = CALLING_PANEL;
	$windowID = CALLING_WINDOW;
	$stageID = CALLING_STAGE;
	$pageID = CALLING_PAGE;
	
	$pageDescriptionText = <<<ADHOCFORM
<span id="discriptionText"><p> $description </p></span>
ADHOCFORM;

	$pageDescriptionText = rawurlencode(trim($pageDescriptionText));

	$maintext = <<<MAIN
				<div id="title">$title</div><div id='panelInformation'>$description</div>
MAIN;

		echo $maintext;
}

/**
 * Required to transform a single quote or apostrophe
 * into two quotes for correct processing by DB2 SQL
 * @return string
 */

function addQuotes($string) {
	return str_replace("'","''",$string);
}

function makeDisplayGroup($titleInfo, $contentInfo) {
	return <<<Table

<table class="groupTable">
	<tbody>
		<tr><td class="groupTableTopLeft"></td><td class="groupTableTop"></td><td class="groupTableTopRight"></td></tr>
		<tr>
			<td class="groupTableLeft">
			</td>
			<td class="groupTableCenter">
				<div class="groupTableTitle">
					$titleInfo
				</div>
				<span class="groupTableContent">
					<table width="100%" border="0" cellspacing="0" cellpadding="0">
					$contentInfo
					</table>
				</span>
			</td>
			<td class="groupTableRight"></td>
		</tr>
		<tr><td class="groupTableBottomLeft"></td><td class="groupTableBottom"></td><td class="groupTableBottomRight"></td></tr>
	</tbody>
</table>
Table;

}

function makeDisplayContent($titleInfo, $contentInfo, $graphicInfo = null) {
	if( $graphicInfo === null) {
		return <<<Table
	<tr>
		<td class="ContentTableTitle">
			$titleInfo
		</td>
		<td class="ContentTableContent">
			$contentInfo
		</td>
	</tr>
Table;
	} else {
		return <<<Table

	<tr>
		<td class="ContentTableTitle">
			<span>
				$titleInfo
			</span><br/>
			<span class="ContentTableContent">
				$contentInfo
			</span>
		</td>
		<td class="ContentTableGraphic">
			$graphicInfo
		</td>
	</tr>

Table;

	}
}

function parseXML($input) {
	try  {
		$doc = new XMLNode();
		if($doc->loadXML($input) === false)
			throw new Exception("loadXML failed");
	} catch (Exception $e) {
		error_log('parseXML exception: '.$e->getMessage().' xml: '.$input,0);
		return "\n\n-- XML parsing error  --\n\n";
	}
	return print_XML_NODE($doc, 0);
}

function print_XML_NODE($node, $level=0) {
	if($node == null) return "";
	
	$return_string = "\n" . str_repeat("\t", $level) . "<" . $node->nodeName;
	if(count($node->attributes) > 0)
		foreach($node->attributes as $key => $value)
	      $return_string .= ' ' . $key . '="' . addslashes($value) . '"';
	
	if($node->hasChildNodes()) {
		$return_string .= ">";
		foreach($node->childNodes as $childNode)
			$return_string .= print_XML_NODE($childNode, $level+1);
		$return_string .= "\n";
	} else if(trim($node->textContent) != "") {
		$return_string .= ">";
		if(stripos(trim($node->textContent), "\n") === false)
			$return_string .= htmlspecialchars(trim($node->textContent));
		else 
			$return_string .= "<![CDATA[\n" . trim($node->textContent) . "\n" . str_repeat("\t", $level) . "]]>";
	}
	if(trim($node->textContent) == "" && !$node->hasChildNodes())
		$return_string .= "/>";
	else  {
		if($node->hasChildNodes())
			$return_string .= str_repeat("\t", $level);
		$return_string .= "</" . $node->nodeName . ">";
	}
	
	return $return_string;
}

function formateTimeForDisplay($number) {
	if($number > 1 )
		return round($number, 4) . "s";
	if($number > 0.0001 )
		return round($number*1000, 4) . "ms";
	if($number > 0.0000001 )
		return round($number*1000000, 4) . "µs";
	if($number > 0.0000000001 )
		return round($number*1000000000, 4) . "ns";
}

function getParameter($name, $defaultValue = null) {
	$parameter = isset($_GET[$name]) ? $_GET[$name] : (isset($_POST[$name]) ? $_POST[$name] : null);
	if(	$parameter == null )
		return  $defaultValue;
	if (version_compare(PHP_VERSION, '5.3.0') >= 0)
		return $parameter;
	if(!(@magic_quotes_gpc || @magic_quotes_runtime ))
		return $parameter;
    if(is_string($parameter))
       return stripcslashes($parameter);
    else if(is_array($parameter))
        stripSlashesProcessArray($parameter);
	return $parameter;
}

function stripSlashesProcessArray(&$parameter) {
	if($parameter == null || !is_array($parameter)) return null;
	foreach($parameter as $key => &$value)
		if(is_string($value))
        	$parameter[$key] = stripcslashes($parameter[$key]);
        else if(is_array($value))
        	stripSlashesProcessArray($parameter[$key]);
}

function writeJSConstant($constant) {
	$debug = strtolower(getParameter("DEBUG", "false")) == "true" ? true : false; 
	if(is_array($constant)) {
		$globalVarables = "";
		$globalsObject = '{';
		foreach($constant as $constantName) {
			$value = constant($constantName);
			if(is_bool($value))
				$value	= $value ? "true" : "false";				
			elseif(is_array($value) || is_object($value) || is_string($value))
				$value	= json_encode($value);
			$globalVarables .= $constantName . '=' . $value . "," ;
			$globalsObject .= '"' . $constantName . '": ' . (strlen($constantName) < strlen($value) ?  $constantName : $value) . ",";
		}
		$globalVarables = substr($globalVarables, 0, -1);
		$globalsObject = substr($globalsObject, 0, -1);
		$globalsObject .= '}';
		echo 'var ' . $globalVarables . ($debug ? ";\n":";");
		echo 'GLOBAL_CONSTANTS.update(' . $globalsObject . ($debug ? ");\n":");");
		return ;
	}
	if(is_string($constant)) {
		$value = constant($constant);
		if(is_bool($value))
			$value	= $value ? "true" : "false";				
		elseif(is_array($value) || is_object($value) || is_string($value))
			$value	= json_encode($value);
		echo 'var ' . $constant . ' = ' . $value . ($debug ? ";\n":";");
		echo 'GLOBAL_CONSTANTS.set("' . $constant . '", ' . (strlen($constant) < strlen($value) ?  $constant : $value) . ($debug ? ");\n":");");
	}
}

function cipherSecureKey($textkey) {
	return hash('sha256',$_SERVER['DOCUMENT_ROOT'].$textkey,TRUE);
}

function cipherEncrypt($key,$input) {
	if(!function_exists('mcrypt_encrypt'))
		throw new Exception('Requires PHP mcrypt extension enabled.');
	return base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, cipherSecureKey($key) , $input, MCRYPT_MODE_ECB));
}
function cipherDecrypt($key,$input) {
	return trim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, cipherSecureKey($key), base64_decode($input), MCRYPT_MODE_ECB));
}

function logError($level,$message) {
	if(!openlog("db2-TE", LOG_PID | LOG_PERROR, LOG_USER)) 
		throw new Exception("LogError log not available, trying to log message: ".$message);
	syslog($level,date("Y-m-d H:i:s").' '.$message);
	closelog();
}	

/* Returns server path to a PHP file. */
function getServerPath($serv, $URI, $fname) {
    return $serv.substr($URI, 0, stripos($URI, basename($fname)));
}


function getFileLastLines($fileName="",$maxLines=10) {
	if($fileName=="")
		throw new Exception('No file specified');
	$testFile=$fileName;
	if(is_file($testFile)) {
		$testFile='"'.$fileName.'"';
		if(is_file($testFile))
			throw new Exception('File not found');
	}
	if(is_readable($testFile))
		throw new Exception('Not authorised to read file');
	$file = fopen((substr(php_uname(), 0, 7) == "Windows"?addcslashes($fileName, '\\'):$fileName), 'r');
	if(!$file)
		throw new Exception('Cannot open file');
	$position = filesize($fileName); 
	$lines = array();
	$currentLine = '';
	if (-1 !== fseek($file ,$position ,SEEK_SET)) {
		$char = fgetc($file);
		if ($char == "\r" ) $position--;
		if (-1 !== fseek($file ,$position ,SEEK_SET)) {
			$char = fgetc($file);
			if ($char == "\n" ) $position--;
		}
	}
	$minPosition=$position-($maxLines*128);
	while ($position>$minPosition && (-1 !== fseek($file ,$position ,SEEK_SET))) {
		$char = fgetc($file);
		if ($char == "\n" ) {
			$lines[] = $currentLine;
			if( count($lines) > $maxLines) 
				return $lines;
			$currentLine = '';
		} elseif ($char !== "\r") 
			$currentLine = $char . $currentLine;
		$position--;
	}
	$lines[] = $currentLine;
	return $lines;
}