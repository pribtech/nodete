<?php
/*******************************************************************************
  *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2014 All rights reserved.
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
TE_check_feature_allowed('admin');

$errorLog=ini_get('error_log');
$lines=getFileLastLines($errorLog,400);
$newLines=array();
$timestamp=null;
$message="";

foreach($lines as &$line)
	if(substr($line,0,1)=='[') {
		$split=strpos($line,']');
		$newLines[]=array(substr($line,1,$split-1),substr($line,$split+1).$message);
		$message="";
	} else
		$message=$line.PHP_EOL.$message;
$returnObject = array(
		 'returnCode' => 'true'
		,'returnValue' => array(
			 'columnsInfo' => array(
				 "num" => 2
				,"name" => array("timestamp","message")
				,"precision" => array(32,10240)
				,"scale" => array(0,0)
				,"type" => array("string","string")
				,"width" => array(32,128)
				,"displaySize" => array(32,128)
				)
			,'rowsReturned' => count($newLines)
			,'rowsInSet' => array(
                             "rowsFound" => count($newLines)
                            ,"endFound" => true
                        )
			,'isRowCountComplete' => true
			,'data'=> $newLines
			)
		);
echo json_encode($returnObject);