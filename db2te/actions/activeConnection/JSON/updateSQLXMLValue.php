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
$value 		= &getParameter("value");
$returnObject = array();
try { 
	if ($query == null ) throw new Exception("No statement");
	connectionManager::getConnection()->setAutoCommit(true);
	if (is_string($query) && strtolower(substr( ltrim($query),0,5))=='call ') {
		$parameters = array();
		$parameters[1]  = array('name'=>'indata', 'value'=>$value,'dataType'=>'string','type'=>'DB2_PARAM_IN');
		$stmt = connectionManager::getNewStatement($query,true);
		$stmt->executeStmtWithParameters($parameters);
		if(!$stmt->statementSucceed) throw new Exception($stmt->sqlerror." statement: ". $query." value: ".$value);		
		if ($stmt->parameters==null) throw new Exception("No Results");
		$returnObject['returnValue']='Success';
	} else {
		if (is_array($query)) {
			foreach ($query as $key=>$SQLStmt) {
				$stmt = connectionManager::getNewStatement($SQLStmt);
				if(!$stmt->statementSucceed) throw new Exception($stmt->sqlerror." statement: ".$SQLStmt);
			}
		} else {
			$stmt = connectionManager::getNewStatement($query);
			if(!$stmt->statementSucceed) throw new Exception($stmt->sqlerror." statement: ". $query);
		}
		$result = $stmt->fetch();
		if($result == false) throw new Exception("No Results");
		$returnObject['returnValue'] = $result[0];
	}
	$returnObject['returnCode'] = 'true';
} catch (Exception $e) {
	$returnObject['returnCode'] = 'false';
	$returnObject['returnValue'] = $e->getMessage();
}
echo json_encode($returnObject);

?>