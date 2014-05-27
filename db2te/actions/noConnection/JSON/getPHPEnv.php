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

$returnObject = array(
		 'returnCode' => 'true'
		,'returnValue' => array(
			 'columnsInfo' => array(
				 "num" => 2
				,"name" => array("name", "value")
				,"precision" => array(128,1024)
				,"scale" => array(0,0)
				,"type" => array("string","string")
				,"width" => array(20,128)
				,"displaySize" => array(20,128)
				)
			,'rowsReturned' => count($_ENV)
			,'rowsInSet' => array(
                             "rowsFound" => count($_ENV)
                            ,"endFound" => true
                        )
			,'isRowCountComplete' => true
			,'data'=>array()
			)
		);
$returnObject['returnValue']['data']=array();
foreach($_ENV as $key => $value)
	$returnObject['returnValue']['data'][] = array($key, $value);

echo json_encode($returnObject);