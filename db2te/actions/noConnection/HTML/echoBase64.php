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


	$data = base64_decode(getParameter('data', ""));
	$type = strtolower(getParameter('type', "text"));

	if($type == "blob")
		header('Content-type: binary');
	elseif($type == "xml")
		header('Content-Type: text/xml');
	elseif($type == "dbclob")
		header('Content-type: encoded-word');
	elseif($type == "dbclob")
		header('Content-type: encoded-word');
	elseif($type == "text")
		header('Content-Type: text/html');
	else 
		header('Content-Type: '.$type);
	header('Content-Disposition: inline');	

	echo $data;
?>