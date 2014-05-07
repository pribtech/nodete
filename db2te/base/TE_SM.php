<?php

require_once('./TE_background_monitor_config.php');
require_once("./DBConnection_IBM_DB2.php");
require_once("./telnet.php");

echo "Opening meta database connection\n";
$MetaDBConn = new Connection_IBM_DB2($metaConnection["database"],MONITOR_NAME,$metaConnection["username"],$metaConnection["password"],$metaConnection["host"],$metaConnection["port"]);

if(!$MetaDBConn->connected)
{
	echo "\n\nError: Unable to connect to meta database\n\n";	
	exit;
}
echo "Meta database conneciton Opened\n";
//~~~~~~~~~ Create Managment table if not present
echo "Checking for meta tables\n";
$monitorTable = $MetaDBConn->newStatement(SQL_CHECK_FOR_MANAGMENT_TABLE);
if($monitorTable->errorMsg() == "")
{
	$resultRow = $monitorTable->fetch();
	
	if($resultRow != false)
	{
		if($resultRow[0] == 0)
		{
			$monitorTable = $MetaDBConn->newStatement(SQL_CREATE_MANAGMENT_TABLE);
			if($monitorTable->errorMsg() != "")
			{
				echo "\n\nError: Unable to create meta database control table\n\n";
				exit;
			}
		}
	}
}

//~~~~~~~~ Open Telent Connections to each of the hosts in the cluster

foreach($hostSystem as $key=>$value)
{
	$hostSystem[$key]['stream'] = telnet::getTelnetStream($key, $bassSystemConnection["username"],$bassSystemConnection["password"]);
	if($hostSystem[$key]['stream'] != false)
	{
        echo "Telnet connection opened to $key\n";
		fputs($hostSystem[$key]['stream'],PERL_MONITOR_START_COMMAND."\n");
		usleep(100000);	
	}
	$hostSystem[$key]['returnData'] = "";
	$hostSystem[$key]['blockStartFound'] = false;
}

//~~~~~~~~~ Upload base perl script
//Not need yet



//~~~~~~~~~ loop
$time = null;
$lastSQLRUNTime = 0;
while(true)
{
	//~~~~~~~~~ time start
	$time = microtime(true);
	//~~~~~~~~~ Read Managment table
	// not used
	//~~~~~~~~~ Read Monitoring table
	// not used yet
	//~~~~~~~~~ If new monitors update host & SQL query list
	// not used yet
	
	//~~~~~~~~~ Check output from all connection
	foreach($hostSystem as $hostname=>$system)
	{
        $newData = fgets($hostSystem[$hostname]['stream']);
		$hostSystem[$hostname]['returnData'] .= $newData; //fgets($hostSystem[$hostname]['stream']);
		if(!$hostSystem[$hostname]['blockStartFound'])
		{
			if(strrpos($hostSystem[$hostname]['returnData'], MONITOR_BLOCK_START_PATTERN) !== false)
			{
				$data = preg_split(MONITOR_BLOCK_START_PATTERN_REG, $hostSystem[$hostname]['returnData']);
				$hostSystem[$hostname]['returnData'] = array_pop($data);
				$hostSystem[$hostname]['blockStartFound'] = true;
			}
			else
				continue;
		}
		if(strrpos($hostSystem[$hostname]['returnData'], MONITOR_BLOCK_SEPERATOR_PATTERN) !== false)
		{

			$data = preg_split(MONITOR_BLOCK_SEPERATOR_PATTERN_REG, $hostSystem[$hostname]['returnData']);
			$hostSystem[$hostname]['returnData'] = array_pop($data);
			while($data_array = array_shift($data))
			{
				$data_array = split("\n", $data_array);

				$call = "";
				while($call == "")
					$call = trim(array_shift($data_array));		
				array_unshift($data_array, $hostname);
				if(array_key_exists($call, $TE_TERMINAL_MONITOR_RESPONCE_ACTIONS))
					eval($TE_TERMINAL_MONITOR_RESPONCE_ACTIONS[$call] . '::processData($data_array, $MetaDBConn);');
			}
		}
		//~~~~~~~~~ If data insert into related table
	}
	//~~~~~~~~ Run SQL monitor data if time since last run < 900 ms
	if(microtime(true) - $lastSQLRUNTime > 0.9)
	{
		foreach($TE_SQL_MONITOR_ACTIONS as $SQLMonitorClass)
		{
			eval($SQLMonitorClass . '::doRun($MetaDBConn, $MonDBConn);');
		}
		$lastSQLRUNTime = microtime(true);
	}
	//~~~~~~~~~ time end, if run less then 10ms sleep for 100ms
	if(microtime(true) - $time < 0.01)
		usleep(100);

//~~~~~~~~~ loop end
}

