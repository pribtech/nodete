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
	
echo '<table><tr><td valign="top">';

$database = strtoupper(connectionManager::getConnection()->database);
$dbms=connectionManager::getConnection()->getDBMS();
switch ( $dbms ) {
	case "ORACLE":
		echo makeDisplayGroup('Data Server'
				,makeDisplayContent('DBMS', $dbms) 
				 .((connectionManager::getConnection()->hostname != "" )?
						makeDisplayContent('Server', connectionManager::getConnection()->hostname)
						.makeDisplayContent('Port Number', connectionManager::getConnection()->portnumber)
				   :
						makeDisplayContent('Server', "Local client")
				  )
			);
		break;
	default:
		$prodReleaseNot95 = false;
		$serverInfo = array();
	
		$selectDBInfoSQL = <<<SELECTSERV
SELECT INST_NAME, RELEASE_NUM, SERVICE_LEVEL, BLD_LEVEL, PTF, FIXPACK_NUM, INST_PTR_SIZE
FROM SYSIBMADM.ENV_INST_INFO
SELECTSERV;
	
		$selectReleaseSQL = <<<SELECTREL
SELECT * FROM SYSIBMADM.ENV_PROD_INFO
SELECTREL;

		$selectLICInfoResult = connectionManager::getNewStatement($selectReleaseSQL, FALSE, FALSE);
		if ($selectLICInfoResult->execSuccessful()){
			if($row = $selectLICInfoResult->fetchAssocRow()){
				$serverInfo['INSTALLED_PROD'] = $row['INSTALLED_PROD'];
				$serverInfo['PROD_RELEASE'] = $row['PROD_RELEASE'];
				$prodReleaseNot95 = ((double)$row['PROD_RELEASE'] > 9.1) ? true : false;
				if((double)$row['PROD_RELEASE'] > 9.1) {
					$serverInfo['INSTALLED_PROD_FULLNAME'] = $row['INSTALLED_PROD_FULLNAME'];
					$serverInfo['LICENSE_INSTALLED'] = $row['LICENSE_TYPE'];
				} else {
					$serverInfo['IS_LICENSED'] = $row['IS_LICENSED'];
					if(isset($serverInfo["IS_LICENSED"]))
						$serverInfo["LICENSE_INSTALLED"] = "Licensed";
					else
					$serverInfo["LICENSE_INSTALLED"] = "Not licensed";
				}
			}
		}

		$selectDBInfo = connectionManager::getNewStatement($selectDBInfoSQL, FALSE, FALSE);
		if ($selectDBInfo->execSuccessful()) 
			while ($row = $selectDBInfo->fetch()) {
				$serverInfo["INST_NAME"] = $row[0];
				$serverInfo["RELEASE_NUM"] = $row[1];
				$serverInfo["SERVICE_LEVEL"] = $row[2];
				$serverInfo["BLD_LEVEL"] = $row[3];
				$serverInfo["PTF"] = $row[4];
				$serverInfo["FIXPACK_NUM"] = $row[5];
				$serverInfo["INST_PTR_SIZE"] = $row[6];
			}

		echo makeDisplayGroup('Data Server',
			makeDisplayContent('DBMS', $dbms) 
			.(
				(connectionManager::getConnection()->hostname != "" )?
					makeDisplayContent('Server', connectionManager::getConnection()->hostname) .
					makeDisplayContent('Port Number', connectionManager::getConnection()->portnumber)
				:
					makeDisplayContent('Server', "Local DB2 Client")
			)
			.makeDisplayContent("<a onclick=\"miniLinkLoader({table:'License/features',action:'list_table'}, '', '_blank')\">Product</a>", "{$serverInfo['INSTALLED_PROD']} ({$serverInfo["LICENSE_INSTALLED"]})") 
			.makeDisplayContent('Instance', "{$serverInfo['INST_NAME']}, {$serverInfo['INST_PTR_SIZE']} bit") 
			.makeDisplayContent('Service Level', $serverInfo['SERVICE_LEVEL']) 
			.makeDisplayContent('Code Release', $serverInfo['RELEASE_NUM']) 
			.makeDisplayContent('Build Level', $serverInfo['BLD_LEVEL']) 
			.makeDisplayContent('Fix pack', $serverInfo['FIXPACK_NUM'])
			);
}

echo '</td></tr></table>';

?>

