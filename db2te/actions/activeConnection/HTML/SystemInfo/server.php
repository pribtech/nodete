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

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'FunctionInlineBarGraph.php');
	$prodReleaseNot95 = false;
	$serverInfo = array();
	$selectENVInfoSQL = <<<SELECTENV
SELECT OS_NAME, OS_VERSION, OS_RELEASE, TOTAL_CPUS, CONFIGURED_CPUS, TOTAL_MEMORY
FROM SYSIBMADM.ENV_SYS_INFO
SELECTENV;
	$selectReleaseSQL = <<<SELECTREL
SELECT * FROM SYSIBMADM.ENV_PROD_INFO
SELECTREL;

		$selectLICInfoResult = connectionManager::getNewStatement($selectReleaseSQL, FALSE, FALSE);
		if ($selectLICInfoResult->execSuccessful())
		{
			if($row = $selectLICInfoResult->fetchAssocRow())
			{
				$serverLICInfo = array();
				$serverInfo['INSTALLED_PROD'] = $row['INSTALLED_PROD'];
				$serverInfo['PROD_RELEASE'] = $row['PROD_RELEASE'];
				$prodReleaseNot95 = ((double)$row['PROD_RELEASE'] > 9.1) ? true : false;
				if((double)$row['PROD_RELEASE'] > 9.1)
				{
					$serverInfo['INSTALLED_PROD_FULLNAME'] = $row['INSTALLED_PROD_FULLNAME'];
					$serverInfo['LICENSE_INSTALLED'] = $row['LICENSE_INSTALLED'];
					$serverInfo['LICENSE_TYPE'] = $row['LICENSE_TYPE'];
				}
				else
				{
					$serverInfo['IS_LICENSED'] = $row['IS_LICENSED'];
					if(isset($serverInfo["LICENSE_INSTALLED"]))
					{
						$serverInfo["LICENSE_INSTALLED"] = "Licensed";
					}
					else
					{
						$serverInfo["LICENSE_INSTALLED"] = "Not licensed";
					}
				}
			}
		}
	
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
		
echo '
<table>
	<tr>
		<td valign="top">';


	if($prodReleaseNot95)
	{
		$TempStmt = connectionManager::getNewStatement("SELECT NAME, VALUE FROM SYSIBMADM.ENV_SYS_RESOURCES", FALSE, FALSE);
		if ($TempStmt->execSuccessful())
		{
			while($row = $TempStmt->fetch())
			{
				$serverInfo[$row[0]] = $row[1];
			}
		}
		
		echo makeDisplayGroup('Physical Server',
		makeDisplayContent('Operating System', $serverInfo['OS_NAME']) .
		makeDisplayContent('Operating System Version', $serverInfo['OS_VERSION']) .
		makeDisplayContent('Operating System Release', $serverInfo['OS_RELEASE']) .
		(isset($serverInfo['OS_LEVEL']) ? makeDisplayContent('Operating System Level', $serverInfo['OS_LEVEL']) : "") .
		makeDisplayContent('System Type', $serverInfo['MACHINE_IDENTIFICATION']) .
		makeDisplayContent('Processors', $serverInfo['CPU_TOTAL']) .
		makeDisplayContent('Processors Active', $serverInfo['CPU_ONLINE']) .
		makeDisplayContent('Processors Configured', $serverInfo['CPU_ONLINE']) .
		makeDisplayContent('Processors Speed', ($serverInfo['CPU_SPEED'] / 1000.0) . "GHz") .
		makeDisplayContent('Processors Pre Socket', $serverInfo['CPU_CORES_PER_SOCKET']) .
		
		makeDisplayContent('System Memory', number_format($serverInfo['MEMORY_TOTAL'] - $serverInfo['MEMORY_FREE']) . " MB of " . number_format($serverInfo['MEMORY_TOTAL']) . " MB", generatBar($serverInfo['MEMORY_TOTAL'] - $serverInfo['MEMORY_FREE'], $serverInfo['MEMORY_TOTAL'], "ReportGeneralBar")) .
		makeDisplayContent('System Swap', number_format($serverInfo['MEMORY_SWAP_TOTAL'] - $serverInfo['MEMORY_SWAP_FREE']) . " MB of " . number_format($serverInfo['MEMORY_SWAP_TOTAL']) . " MB", generatBar($serverInfo['MEMORY_TOTAL'] - $serverInfo['MEMORY_SWAP_FREE'], $serverInfo['MEMORY_SWAP_TOTAL'], "ReportGeneralBar")) .
		makeDisplayContent('System Virtual Memory', number_format($serverInfo['VIRTUAL_MEM_TOTAL'] - $serverInfo['VIRTUAL_MEM_FREE']) . " MB of " . number_format($serverInfo['VIRTUAL_MEM_TOTAL']) . " MB", generatBar($serverInfo['VIRTUAL_MEM_TOTAL'] - $serverInfo['VIRTUAL_MEM_FREE'], $serverInfo['VIRTUAL_MEM_TOTAL'], "ReportGeneralBar")) .
		makeDisplayContent('CPU Usage Now', generatBar($serverInfo['CPU_USAGE_TOTAL'], 100, "ReportGeneralBar")).
		(isset($serverInfo['CPU_LOAD_LONG']) ? makeDisplayContent('CPU Usage Long', generatBar($serverInfo['CPU_LOAD_LONG']*100, 100, "ReportGeneralBar")) : "").
		(isset($serverInfo['CPU_LOAD_MEDIUM']) ? makeDisplayContent('CPU Usage Medium', generatBar($serverInfo['CPU_LOAD_MEDIUM']*100, 100, "ReportGeneralBar")) : "").
		(isset($serverInfo['CPU_LOAD_SHORT']) ? makeDisplayContent('CPU Usage Short', generatBar($serverInfo['CPU_LOAD_SHORT']*100, 100, "ReportGeneralBar")) : "")
	  );
		
	}
	else
	{
		$selectENVInfo = connectionManager::getNewStatement($selectENVInfoSQL, FALSE, FALSE);
		if ($selectENVInfo->execSuccessful()) {
			while ($row = $selectENVInfo->fetch()) {
				$serverInfo = array("OS_NAME"=>$row[0],
									"OS_VERSION"=>$row[1],
									"OS_RELEASE"=>$row[2],
									"TOTAL_CPUS"=>$row[3],
									"CONFIGURED_CPUS"=>$row[4],
									"TOTAL_MEMORY"=>$row[5]);
			}
		}

				echo makeDisplayGroup('Physical Server',
		makeDisplayContent('Operating System', $serverInfo['OS_NAME']) .
		makeDisplayContent('Operating System Version', $serverInfo['OS_VERSION']) .
		makeDisplayContent('Operating System Release', $serverInfo['OS_RELEASE']) .
		makeDisplayContent('Processors', $serverInfo['TOTAL_CPUS']) .
		makeDisplayContent('System Memory', $serverInfo['TOTAL_MEMORY'])
	  );
	
	}
	
	
echo '
		</td>
	</tr>
</table>';
?>