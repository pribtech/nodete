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

$stageID = CALLING_STAGE;
$windowID = CALLING_WINDOW;
$panelID = CALLING_PANEL;
$pageID = CALLING_PAGE;
$date = date('l jS \of F Y h:i:s A');
	echo <<<HERE
	
<script type="text/javascript">

createContextMenu('{$pageID}_USERMENU', [
	{
		nodeType: "LEAF",
		elementID : "DATETIME",
		elementValue : "Last updated: $date",
		elementAction : "",
		elementSubNodes : null,
		elementSubNodeDirection : HORIZONTAL
	}

], HORIZONTAL, '$stageID', '$windowID', '$panelID');

</script>

HERE;

echo "<table>
		<tr>
			<td valign='top'> ";
echo makeDisplayGroup('Web Server',
				makeDisplayContent('Name', $_SERVER['SERVER_NAME']) .
				makeDisplayContent('Software', $_SERVER['SERVER_SOFTWARE']) .
				makeDisplayContent('PHP Version', phpversion()) .
				makeDisplayContent('Database Driver', "IBM_DB2" . "<br/>" . makeDisplayContent('Version', phpversion("ibm_db2")))

			);
echo '			</td>
		</tr>
		<tr>
			<td valign="top">';
$client = @db2_client_info(connectionManager::getConnection()->dbconn()); // Get DB2 Client Driver Info
echo makeDisplayGroup('DB2 CLI Driver',
				makeDisplayContent('Driver Name', @$client->DRIVER_NAME) .
				makeDisplayContent('Driver Version', @$client->DRIVER_VER) .
				makeDisplayContent('ODBC Version', @$client->ODBC_VER) .
				makeDisplayContent('ODBC SQL Conformance', @$client->ODBC_SQL_CONFORMANCE) .
				makeDisplayContent('Application Codepage', @$client->APPL_CODEPAGE) .
				makeDisplayContent('Connection Codepage', @$client->CONN_CODEPAGE)
				);

echo '			</td>
		</tr>
	<table>';