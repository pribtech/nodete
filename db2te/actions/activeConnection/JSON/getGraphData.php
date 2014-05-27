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
TE_check_session_timeout();
	include_once(PHP_INCLUDE_BASE_DIRECTORY . "graphSupport/graphData.php");
	header('Content-type: application/json');
	//$dataSetsOnly = isset($_GET['dataSetsOnly']) ? $_GET['dataSetsOnly'] : true;
	//$SQLToRun = isset($_GET['SQL']) ? $_GET['SQL'] : null;
	$dataSetsOnly = strtolower(getParameter('dataSetsOnly', "true")) == "true" ? true : false;
	if (strcasecmp($dataSetsOnly, "true") == 0) {
		$dataSetsOnly = true;
	} else if (strcasecmp($dataSetsOnly, "false") == 0) {
		$dataSetsOnly = false;
	}
	$SQLToRun = getParameter("SQL");
	echo graphFromSQL($SQLToRun, $dataSetsOnly);
?>