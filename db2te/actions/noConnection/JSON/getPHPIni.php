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
 TE_check_session_timeout();
 TE_check_feature_allowed('admin');

$ini=ini_get_all();
$returnObject = array(
		 'returnCode' => 'true'
		,'returnValue' => array(
			 'columnsInfo' => array(
				 "num" => 4
				,"name" => array("name" ,"global" ,"local" ,"access")
				,"precision" => array(128,1024,1024,1024)
				,"scale" => array(0,0,0,0)
				,"type" => array("string","string","string","string")
				,"width" => array(20,128,128,128)
				,"displaySize" => array(20,128,128,128)
				)
			,'rowsReturned' => count($ini)
			,'rowsInSet' => array(
                             "rowsFound" => count($ini)
                            ,"endFound" => true
                        )
			,'isRowCountComplete' => true
			,'data'=>array()
			)
		);
$returnObject['returnValue']['data']=array();
foreach($ini as $key => $value)
	$returnObject['returnValue']['data'][] = array($key ,$value['global_value'] ,$value['local_value'] ,$value['access']);

echo json_encode($returnObject);