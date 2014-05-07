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
	$type = getParameter('type', "");
	if($type = "blob")
		header('Content-type: binaray; Content-Description: File Transfer; Content-Disposition: attachment; filename="from_database_blob.data";');
	elseif($type = "xml")
		header('Content-type: xml; Content-Description: File Transfer; Content-Disposition: attachment; filename="from_database_xml.xml";');
	elseif($type = "dbclob")
		header('Content-type: encoded-word; Content-Description: File Transfer; Content-Disposition: attachment; filename="from_database_dbclob.txt";');
	elseif($type = "text")
		header('Content-type: text; Content-Description: File Transfer; Content-Disposition: attachment; filename="from_database_clob.txt";');
	else 
		header('Content-Type: '.$type.'; Content-Description: File Transfer; Content-Disposition: attachment; filename="from_database_'.$type.'.txt";');
	echo $data;
?>