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

$query 		= getParameter("query");
$returnObject = array();
try { 
	if ($query == null ) throw new Exception("No statement");
	
	if (is_string($query) && strtolower(substr( ltrim($query),0,5))=='file:') {
		$part = explode("[", substr( ltrim($query),5 ));
		$fileName=$part[0];
		if(!preg_match(FILE_VERIFICATION_REGEX, $fileName)) 
			throw new Exception( "Invalid filename:".rawurlencode($fileName)." Valid characters are: 0-9, a-z, A-Z, -, _");
		elseif(is_dir(QUERY_FILES_DIRECTORY.$fileName)) 
			throw new Exception( "Couldn't open file: ".rawurlencode($fileName)." because it corresponds to a valid directory");
		elseif (is_file(QUERY_FILES_DIRECTORY.$fileName.".sql")) 
			$query = @file_get_contents(QUERY_FILES_DIRECTORY.$fileName.".sql");
		elseif (is_file(QUERY_FILES_DIRECTORY.$fileName.".SQL")) 
			$query = @file_get_contents(QUERY_FILES_DIRECTORY.$fileName.".SQL");
		elseif (is_file(QUERY_FILES_DIRECTORY.$fileName)) 
			$query = @file_get_contents(QUERY_FILES_DIRECTORY.$fileName);
		else 
			throw new Exception("File not found: ".QUERY_FILES_DIRECTORY.$fileName);
		$predicate=explode("]", $part[1]);
		$query.=" ".$predicate[0];
	}
	connectionManager::getConnection()->setAutoCommit(true);
	if (is_string($query) && strtolower(substr( ltrim($query),0,5))=='call ') {
		$matches = array();
		$bindParameters = array();
		$numFound = preg_match_all("/\?\!(?:[\w]+\=[^?\&]*[\&]?)*\?/", $query, $matches);
		if($numFound > 0) {
			$i = 1;
			$resultSet=false;
			foreach($matches[0] as $match) {
				$parameteOptions = array();
				$matchTrimmed = trim($match, "?!");
				if($matchTrimmed != "")
					parse_str($matchTrimmed, $parameteOptions);
				$bindParameters[$i]['name'] = isset($parameteOptions['name']) ?  (preg_match('/^[a-zA-Z0-9_]+$/' , $parameteOptions['name']) ? $parameteOptions['name'] : "p{$i}") : "p{$i}";
				if ($bindParameters[$i]['name']=='result') 
					$resultSet=true;
				if(isset($parameteOptions['value']))
					$bindParameters[$i]['value'] = $parameteOptions['value'];
				else
					$bindParameters[$i]['value'] = getParameter($bindParameters[$i]['name']);
				if(isset($parameteOptions['dataType']))
					$bindParameters[$i]['dataType'] = $parameteOptions['dataType'];
				if(isset($parameteOptions['type']))
					$bindParameters[$i]['type'] = $parameteOptions['type'];
				if(isset($parameteOptions['DB2dataType']))
					$bindParameters[$i]['DB2dataType'] = $parameteOptions['DB2dataType'];
				if(isset($parameteOptions['precision']))
					$bindParameters[$i]['precision'] = $parameteOptions['precision'];
				if(isset($parameteOptions['scale']))
					$bindParameters[$i]['scale'] = $parameteOptions['scale'];
				if(isset($parameteOptions['settype']))
					$bindParameters[$i]['settype'] = $parameteOptions['settype'];
				if(isset($parameteOptions['conversion']))
					$bindParameters[$i]['conversion'] = $parameteOptions['conversion'];
					
				switch (connectionManager::getConnection()->getDBMS()) { 
					case 'ORACLE' :
						$query = str_replace($match, ":".$bindParameters[$i]['name']." ", $query);
						break;
					default:
						$query = str_replace($match, "?", $query);
				}
				$i++;
			}
			if(!$resultSet) throw new Exception("No host variable called 'result', bind parameters = ".var_export($bindParameters,true));
		} else
			$bindParameters[1]  = array('name'=>'result', 'value'=>'Unknown','dataType'=>'string','type'=>'DB2_PARAM_OUT','precision'=>'10000000');
		$stmt=runQuery($query,true);
		$stmt->executeStmtWithParameters($bindParameters);
		if(!$stmt->execSuccessful()) throw new Exception($stmt->sqlerror." statement: ". $query);		
		if ($stmt->parameters['result']==null) throw new Exception("No Results");
		if (isset($stmt->parameters['error'])) 
			if ($stmt->parameters['error']!=null) 
				if (is_string($stmt->parameters['error'])) 
					if ($stmt->parameters['error']!=='' && substr($stmt->parameters['error'],0,1) !== "\0") 
						throw new Exception('len:'.strlen($stmt->parameters['error']).var_export($stmt->parameters['error'],true));
		$returnObject['returnValue']=html_entity_decode($stmt->parameters['result']);
	} else {
		if (is_array($query)) {
			foreach ($query as $key=>$SQLStmt) 
				$stmt=runQuery($SQLStmt);
		} else $stmt=runQuery($query);
		$result = $stmt->fetch();
		if(!$stmt->execSuccessful()) throw new Exception($stmt->sqlerror." statement: ". $query);		
		if($result == false) throw new Exception("No Results");
		$returnObject['returnValue'] = $result[0];
	}
	$returnObject['returnCode'] = 'true';
} catch (Exception $e) {
	$returnObject['returnCode'] = 'false';
	$returnObject['returnValue'] = $e->getMessage();
}
function runQuery(&$query,$prepare=false) {
	switch (connectionManager::getConnection()->getDBMS()) {
		case 'ssh' :
			$stmt = connectionManager::getNewStatement($query,$prepare,true);
			break;
		default:
			$stmt = connectionManager::getNewStatement($query,$prepare);
	}
	if($stmt->execSuccessful()) return $stmt;
	throw new Exception($stmt->sqlerror." statement: ". $query);
}
echo json_encode($returnObject);

?>