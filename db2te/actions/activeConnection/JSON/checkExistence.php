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

$select  = getParameter('select');
$schema  = getParameter('schema');
$table 	 = getParameter('table');
$columns = getParameter('column');

$returndata['returnCode'] = "false";

if($select == null || $select == '' ) {
	$select = 'select 1 from "'.$schema.'"."'.$table.'" where 1=1';
	foreach ($columns as $column=>$value) {
		$select.= ' and "'.$column.'" in ('.$value.')';
	}
}

$sql = "select case when exists(".$select.") then 'true' else 'false' end from (values(1)) as a";

$statement = connectionManager::getNewStatement($sql);
if($statement->errorMsg() != '') throw new Exception($statement->errorMsg().' sql: '.$sql);
$resultRow=$statement->fetch();
$returndata['returnCode']= $resultRow[0];		

echo json_encode($returndata);

?>