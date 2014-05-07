<?php

require_once('TE_M_config.php');

require_once(MONITOR_FOLDER . "/te_sql_monitor.php");

require_once("DBConnection_IBM_DB2.php");
require_once("telnet.php");

$GENERAL_ERROR = <<<HERE

No database specified to monitor or save data to please use

--monitor <file name> --input '{metaConnection:{
host:"<host name>",
port:"<port>",
username:"<username>",
password:"<password>",
database:"<database>"
},
bassSystemConnection:{
host:"<host name>",
port:"<port>",
username:"<username>",
password:"<password>",
database:"<database>"
}}'

HERE;


$DATABASE_CONNECTIONS = null;

$LOAD_MONITORS = null;

if(!in_array(array('--input', '--monitor'), $argv))
{
	$inputPos = array_search('--input', $argv);
	$monitor = array_search('--monitor', $argv);
	
	$DATABASE_CONNECTIONS = json_decode($argv[$inputPos+1], true);
	$LOAD_MONITORS = $argv[$monitor+1];

}
else 
{
	echo $GENERAL_ERROR;
}

require_once(MONITOR_FOLDER . TE_SQL_MONITORS . $LOAD_MONITORS . ".php");


//Meta database connection
$MetaDBConn = false;

//Base database connection
$MonDBConn = false;

//~~~~~~~~~ Open Meta database connection

echo "Opening meta database connection\n";
$MetaDBConn = new Connection_IBM_DB2($DATABASE_CONNECTIONS['metaConnection']["database"],$DATABASE_CONNECTIONS['metaConnection']["schema"],$DATABASE_CONNECTIONS['metaConnection']["username"],$DATABASE_CONNECTIONS['metaConnection']["password"],$DATABASE_CONNECTIONS['metaConnection']["host"],$DATABASE_CONNECTIONS['metaConnection']["port"]);

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
print_r($TE_SQL_MONITOR_ACTIONS);
foreach($TE_SQL_MONITOR_ACTIONS as $SQLMonitorClass)
{
	eval($SQLMonitorClass . '::initializeStorageTables($MetaDBConn);');
}

//~~~~~~~~~ Insert control row
echo "Indicating TE Background monitor has stated in meta database control table\n";
$monitorTable = $MetaDBConn->newStatement("select count(*) from \"s#db2mc\".TE_backmon where monitor_name = '" . MONITOR_NAME . "'");
if($monitorTable->errorMsg() == "")
{
	$resultRow = $monitorTable->fetch();
	
	if($resultRow != false)
	{
		if($resultRow[0] != 0)
		{
			$updateTable = $MetaDBConn->newStatement("Update \"s#db2mc\".TE_backmon set disable_monitor = 'f' where monitor_name = '" . MONITOR_NAME . "'");
			if($updateTable->errorMsg() != "")
			{
				echo "\n\nError: Unable to update control row into meta database control table\n" . $monitorTable->errorMsg() . "\n";
				exit;
			}
		}
		else 
		{
			$insertTable = $MetaDBConn->newStatement("insert into \"s#db2mc\".TE_backmon values('" . MONITOR_NAME . "','f')");
			echo "insert into table \"s#db2mc\".TE_backmon values('" . MONITOR_NAME . "','f')";
			if($insertTable->errorMsg() != "")
			{
				echo "\n\nError: Unable to insert control row into meta database control table\n" . $monitorTable->errorMsg() . "\n";
				exit;
			}
		}
	}
}
else
{
	echo $monitorTable->errorMsg();
	exit();
}

//~~~~~~~~~ Open Monitor Database
echo "Connection to monitor database\n";
$MonDBConn = new Connection_IBM_DB2($DATABASE_CONNECTIONS['bassSystemConnection']["database"],null,$DATABASE_CONNECTIONS['bassSystemConnection']["username"],$DATABASE_CONNECTIONS['bassSystemConnection']["password"],$DATABASE_CONNECTIONS['bassSystemConnection']["host"],$DATABASE_CONNECTIONS['bassSystemConnection']["port"]);

if(!$MonDBConn->connected)
{
    echo "\n\nError: Unable to connect to monitor database\n\n";
    exit;
}
echo "Monitor database conneciton Opened\n";

$time = null;
$lastSQLRUNTime = 0;
while(true)
{
	//~~~~~~~~~ time start
	$time = microtime(true);

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