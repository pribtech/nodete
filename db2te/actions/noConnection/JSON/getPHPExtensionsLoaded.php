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

$returnObject = array(
		 'returnCode' => 'true'
		,'returnValue' => array(
			 'columnsInfo' => array(
				 "num" => 1
				,"name" => array("name")
				,"precision" => array(128)
				,"scale" => array(0,0)
				,"type" => array("string")
				,"width" => array(20)
				,"displaySize" => array(20)
				)
			,'rowsInSet' => array(
                            "endFound" => true
                        )
			,'isRowCountComplete' => true
			,'data'=>array()
			)
		);
$returnObject['returnValue']['data']=array();

foreach (get_loaded_extensions() as $i => $ext)
	$returnObject['returnValue']['data'][] = array($ext);

$returnObject['returnValue']['rowsReturned']=count($returnObject['returnValue']['data']);
$returnObject['returnValue']['rowsInSet']['rowsFound']=count($returnObject['returnValue']['data']);

echo json_encode($returnObject);