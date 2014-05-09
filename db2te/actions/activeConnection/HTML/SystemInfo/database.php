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
require_once(PHP_INCLUDE_BASE_DIRECTORY . 'FunctionInlineBarGraph.php');
	$database = strtoupper(connectionManager::getConnection()->database);
	$prodReleaseNot95 = false;
	$serverInfo = array();
	$ErrorsAdmin24h = 0;
	$WarningAdmin24h = 0;
	$error=array();
	
	$selectTopConnsSQL = <<<SELECTTOPCONNS
SELECT SUM(CONCURRENT_CONNECTION_TOP) FROM TABLE (WLM_GET_SERVICE_SUPERCLASS_STATS('', -2)) AS SERVICE_SUPERCLASS
SELECTTOPCONNS;

	$selectCurrConnsSQL = <<<SELECTCURRCONNS
SELECT COUNT(*) FROM SYSIBMADM.APPLICATIONS
SELECTCURRCONNS;

	$selectDBSizeInfoSQL = <<<SELECTSIZE
CALL GET_DBSIZE_INFO(?, ?, ?, 0)
SELECTSIZE;

	$selectDBMEMInfoSQL = <<<SELECTMEM
SELECT sum(pool_cur_size)/1024.0/1024.0
FROM SYSIBMADM.SNAPDB_MEMORY_POOL
SELECTMEM;

	$selectLOGInfoSQL = <<<SELECTLOG
SELECT TOTAL_LOG_USED_KB, TOTAL_LOG_AVAILABLE_KB, TOTAL_LOG_USED_TOP_KB FROM SYSIBMADM.LOG_UTILIZATION
SELECTLOG;
	$selectDB_Partitions = <<<SELECTREL
SELECT count(*) FROM TABLE(DB_PARTITIONS()) AS T
SELECTREL;

	$TempStmt = connectionManager::getNewStatement("SELECT * FROM SYSIBMADM.SNAPDB WHERE DB_NAME = '$database'", FALSE, FALSE);
	if ($TempStmt->execSuccessful()) {
		if($row = $TempStmt->fetchAssocRow())
			foreach($row as $key=>$value)
				$serverInfo[$key] = $value;
	} else $error[]="SYSIBMADM.SNAPDB failed, sqlcode: ".$TempStmt->sqlstate;

	$TempStmt = connectionManager::getNewStatement("SELECT NAME, VALUE FROM SYSIBMADM.DBCFG where NAME = 'logretain'", FALSE, FALSE);
	if ($TempStmt->execSuccessful()) {
		while($row = $TempStmt->fetchAssocRow())
			$serverInfo[$row["NAME"]] = $row["VALUE"];
	} else $error[]="SYSIBMADM.DBCFG failed, sqlcode: ".$TempStmt->sqlstate;
		
	$TempStmt = connectionManager::getNewStatement("SELECT NAME, VALUE FROM SYSIBMADM.DBMCFG where NAME = 'instance_memory'", FALSE, FALSE);
	if ($TempStmt->execSuccessful()) {
		while($row = $TempStmt->fetchAssocRow()) 
			$serverInfo[$row["NAME"]] = $row["VALUE"];
	} else $error[]="SYSIBMADM.DBCFG failed, sqlcode: ".$TempStmt->sqlstate;
		
	$TempStmt = connectionManager::getNewStatement($selectDB_Partitions);
	if ($TempStmt->execSuccessful()) {
		while($row = $TempStmt->fetchAssocRow())
			$serverInfo["DB_Partitions"] = $row[1];
	} else $error[]="DB_PARTITIONS failed, sqlcode: ".$TempStmt->sqlstate;
		
	$TempStmt = connectionManager::getNewStatement("SELECT COUNT(*) FROM SYSIBMADM.PDLOGMSGS_LAST24HOURS WHERE MSGSEVERITY = 'E'", FALSE, FALSE);
	if ($TempStmt->execSuccessful()) {
		if($row = $TempStmt->fetch())
			$ErrorsAdmin24h = $row[0];
		$TempStmt = connectionManager::getNewStatement("SELECT COUNT(*) FROM SYSIBMADM.PDLOGMSGS_LAST24HOURS WHERE MSGSEVERITY = 'W'", FALSE, FALSE);
		if ($TempStmt->execSuccessful()) {
			if($row = $TempStmt->fetch())
				$WarningAdmin24h = $row[0];
		}
	} else $error[]="SYSIBMADM.PDLOGMSGS_LAST24HOURS failed, sqlcode: ".$TempStmt->sqlstate;
		
	$selectTopConns = connectionManager::getNewStatement($selectTopConnsSQL, FALSE, FALSE);
	if ($selectTopConns->execSuccessful()) {
		while ($row = $selectTopConns->fetch())
			$serverInfo["TOP_CONNS"] = $row[0];
	} else $error[]="WLM_GET_SERVICE_SUPERCLASS_STATS failed, sqlcode: ".$selectTopConns->sqlstate;
		
	$selectCurrConns = connectionManager::getNewStatement($selectCurrConnsSQL, FALSE, FALSE);
	if ($selectCurrConns->execSuccessful()) {
		while ($row = $selectCurrConns->fetch())
			$serverInfo["CURR_CONNS"] = $row[0];
	} else $error[]="SYSIBMADM.APPLICATIONS failed, sqlcode: ".$selectCurrConns->sqlstate;
		
	$selectDBMEMInfo = connectionManager::getNewStatement($selectDBMEMInfoSQL, FALSE, FALSE);
	if ($selectDBMEMInfo->execSuccessful()) {
		while ($row = $selectDBMEMInfo->fetch())
			$serverInfo["DB_MEMORY_USED"] = $row[0];
	} else $error[]="SYSIBMADM.SNAPDB_MEMORY_POOL failed, sqlcode: ".$selectDBMEMInfo->sqlstate;
		
	$selectLOGInfo = connectionManager::getNewStatement($selectLOGInfoSQL, FALSE, FALSE, TRUE);
	if ($selectLOGInfo->execSuccessful()) {
		while ($row = $selectLOGInfo->fetch()) {
			$serverInfo["TOTAL_LOG_USED_KB"] = $row[0];
			$serverInfo["TOTAL_LOG_AVAILABLE_KB"] = $row[1];
			$serverInfo["TOTAL_LOG_USED_TOP_KB"] = $row[2];
		}
	} else $error[]="SYSIBMADM.LOG_UTILIZATION failed, sqlcode: ".$selectLOGInfo->sqlstate;
	
	$parameters = array();
	
	$parameters[1]  = array('name'=>'timestamp', 'value'=>'Unknown','dataType'=>'string','type'=>'DB2_PARAM_OUT');
	$parameters[2]  = array('name'=>'size', 'value'=>'0.0','dataType'=>'float','type'=>'DB2_PARAM_OUT');
	$parameters[3]  = array('name'=>'capacity', 'value'=>'0.0','dataType'=>'float','type'=>'DB2_PARAM_OUT');
	
	$selectDBSizeInfo = connectionManager::getNewStatement($selectDBSizeInfoSQL, true);
	$selectDBSizeInfo->executeStmtWithParameters($parameters);

	if($selectDBSizeInfo->execSuccessful()) {
		$timestamp = $selectDBSizeInfo->parameters['timestamp'];
		$size = $selectDBSizeInfo->parameters['size'];
		$size = (int)($size / 1024 /1024); // convert to MB
		$capacity = $selectDBSizeInfo->parameters['capacity'];
		$capacity = (int)($capacity / 1024 /1024); // convert to MB
	} else {
		$timestamp = "GET_DBSIZE_INFO failed";
		$size = "GET_DBSIZE_INFO failed";
		$capacity = "GET_DBSIZE_INFO failed";
	}

	$serverInfo["TIMESTAMP"] = $timestamp;
	$serverInfo["SIZE"] = $size;
	$serverInfo["CAPACITY"] = $capacity;

	$instmemtotal = isset($serverInfo["instance_memory"]) ? ($serverInfo["instance_memory"] * 4/1024) * $serverInfo["DB_Partitions"] : "";

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

echo makeDisplayGroup('Database',
	    makeDisplayContent('Name', $database) .
			makeDisplayContent('Features', connection::getFeatureList()) .
			makeDisplayContent('Status', @$serverInfo["DB_STATUS"]) .
			makeDisplayContent('Active Since', @$serverInfo["DB_CONN_TIME"]) .
			makeDisplayContent("<a onclick=\"miniLinkLoader({oper:'B',table:'dbhist',action:'list_table'}, '', '_blank')\">Last Backup</a>", (isset($serverInfo["LAST_BACKUP"]) ? $serverInfo["LAST_BACKUP"] : 'NONE')) .
			makeDisplayContent('Logging', ( strcasecmp($serverInfo["logretain"], "OFF") == 0 || strcasecmp($serverInfo["logretain"], "NO") == 0  ?
				"Circular" :
				"Archive"
			)) .
			makeDisplayContent("<a onclick=\"miniLinkLoader({table:'pdlog',action:'list_table'}, '', '_blank')\">Admin Log (Last 24h)</a>" ,  'Warnings: ' . $WarningAdmin24h . '&nbsp&nbsp&nbsp Errors: ' . $ErrorsAdmin24h) .
			makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/dbmemory',action:'list_table'}, '', '_blank')\">Memory</a>", number_format($serverInfo["DB_MEMORY_USED"]) . " MB of " . number_format($instmemtotal) . " MB", generatBar($serverInfo["DB_MEMORY_USED"], $instmemtotal, "ReportGeneralBar")) .
			($serverInfo["CAPACITY"] > 0 ?
   			makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/tbsputil',action:'list_table'}, '', '_blank')\">Size</a>", number_format($serverInfo["SIZE"]) . " MB of " . number_format($serverInfo["CAPACITY"]) . " MB", generatBar($serverInfo["SIZE"], $serverInfo["CAPACITY"], "ReportGeneralBar")) :
   			makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/tbsputil',action:'list_table'}, '', '_blank')\">Size</a>", number_format($serverInfo["SIZE"]) . " MB") ) .
			makeDisplayContent('Log', number_format($serverInfo["TOTAL_LOG_USED_KB"]/1024) . " MB of " . number_format($serverInfo["TOTAL_LOG_AVAILABLE_KB"]/1024) . " MB", generatBar($serverInfo["TOTAL_LOG_USED_KB"], $serverInfo["TOTAL_LOG_AVAILABLE_KB"], "ReportGeneralBar")) .
			makeDisplayContent("<a onclick=\"miniLinkLoader({table:'Performance/applicationStatus',action:'list_table'}, '', '_blank')\">Connections</a>", (isset($serverInfo["CURR_CONNS"])?number_format($serverInfo["CURR_CONNS"]):"?") . " current, " . number_format($serverInfo["TOP_CONNS"]) . " high water", generatBar($serverInfo["CURR_CONNS"], $serverInfo["TOP_CONNS"], "ReportGeneralBar")).
		    ( count($error)==0 ? '' : makeDisplayContent('Load Errors',implode(", ", $error)) )
	);

echo '
			</td>
		</tr>
		<tr>
			<td valign="top">';
echo '
		</td>
	</tr>
</table>';

?>