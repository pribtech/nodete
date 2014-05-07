<?php

define("DEBUG_MODE_ENABLED", false);

define("MAJOR_VERSION", "mon");

define("MINOR_VERSION", "1");

define("SUB_VERSION", "0");

define("USE_PERSISTENT_CONNECTION", true);

define("FORCE_CONNECTION_WITH_DEFAULT", false);

define("MONITOR_NAME", "pureScale");

define("PHP_INCLUDE_BASE_DIRECTORY", "./");

define("PERL_MONITOR_START_COMMAND", "~/sqllib/runner/runner.pl");

define("MONITOR_BLOCK_START_PATTERN", "~~~~~~!kolobok!~~~~~~");
define("MONITOR_BLOCK_SEPERATOR_PATTERN", "~~~~~~!lisa!~~~~~~");

define("MONITOR_BLOCK_START_PATTERN_REG", "/^[~]+[!]kolobok[!][~]+/m");
define("MONITOR_BLOCK_SEPERATOR_PATTERN_REG", "/^[~]+[!]lisa[!][~]+/m");

define("SQL_CHECK_FOR_MANAGMENT_TABLE", "select count(*) from syscat.tables where TABSCHEMA = 's#db2mc' and TABNAME = 'TE_BACKMON'");

define("SQL_CREATE_MANAGMENT_TABLE", "create table \"s#db2mc\".TE_backmon(monitor_name varchar(256), disable_monitor char(1))");

require_once("./DBConnection_IBM_DB2.php");

require_once("./telnet.php");

$TE_SQL_MONITOR_ACTIONS = array();

$TE_TERMINAL_MONITOR_RESPONCE_ACTIONS = array();

abstract class te_sql_monitor_action {
	abstract public static function initializeStorageTables($metrics_database_connection);
	abstract public static function doRun($metrics_database_connection, $monitoring_database_connection);
}

abstract class te_terminal_monitor_responce_action {
	abstract public static function initializeStorageTables($metrics_database_connection);
	abstract public static function processData($data_array, $metrics_database_connection);
	/* $data_array = array(
		"hostname",
		"Human timestamp",
		"unix_timestamp.micro_seconds",
		"data",
		"data",
		....
		);
		*/
}

$TableDefinitionObjectsDirectory = dir('./TE_monitors/'); 
$includeFile = "";
while(($includeFile = $TableDefinitionObjectsDirectory->read()) !== false) 
{ 	
	if (substr($includeFile, -4) == '.php') 
		include_once('./TE_monitors/' . $includeFile);
}

// Input - Meta database connection, Monitor database connection, Monitor name
$metaConnection = array(
	"host" => "demo",
	"port" => "50000",
	"username" => "db2inst1",
	"password" => "blu3g0ld",
	"database" => "metrics"
);

$bassSystemConnection = array(
	"host" => "mem1",
	"port" => "50000",
	"username" => "db2sdin1",
	"password" => "blu3g0ld",
	"database" => "dtw"
);

$bassSystemMonitorAccount = array(
	"username" => $bassSystemConnection["username"],
	"password" => $bassSystemConnection["password"]
);

$hostSystem = array();

//Meta database connection
$MetaDBConn = false;

//Base database connection
$MonDBConn = false;

//~~~~~~~~~ Open Meta database connection

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

//~~~~~~~~~ initialize Storage Tables
echo "Setting up data collection tables\n";
foreach($TE_TERMINAL_MONITOR_RESPONCE_ACTIONS as $SQLMonitorClass)
{
	eval($SQLMonitorClass . '::initializeStorageTables($MetaDBConn);');
}

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
$MonDBConn = new Connection_IBM_DB2($bassSystemConnection["database"],null,$bassSystemConnection["username"],$bassSystemConnection["password"],$bassSystemConnection["host"],$bassSystemConnection["port"]);

if(!$MonDBConn->connected)
{
    echo "\n\nError: Unable to connect to monitor database\n\n";
    exit;
}
echo "Monitor database conneciton Opened\n";

//~~~~~~~~~ Get Cluster Information
echo "Checking if system is a cluster\n";
$clusterTable = $MonDBConn->newStatement("select count(*) from syscat.tables where TABSCHEMA = 'SYSIBMADM' and (TABNAME = 'DB2_CF' or TABNAME = 'DB2_MEMBER')");
if($clusterTable->errorMsg() == "")
{
	$resultRow = $clusterTable->fetch();
	
	if($resultRow != false)
	{
		if($resultRow[0] == 0)
		{
			$hostSystem[$bassSystemConnection["host"]] = array("type"=>'INSTANCE');
		}
    	else
    	{
    		$CF_HOSTS = $MonDBConn->newStatement("select CURRENT_HOST from SYSIBMADM.DB2_CF");
    		if($CF_HOSTS->errorMsg() == "")
    		{
    			while($resultRow = $CF_HOSTS->fetch())
    			{
	    			$hostSystem[$resultRow[0]] = array("type"=>'CF');	
    			}
    		}
            else
            {
                echo "Error getting cf nodes: {$CF_HOSTS->errorMsg()}\n";
            }
		
		    $MEMBER_HOSTS = $MonDBConn->newStatement("select HOME_HOST from SYSIBMADM.DB2_MEMBER");
    		if($MEMBER_HOSTS->errorMsg() == "")
    		{
    			while($resultRow = $MEMBER_HOSTS->fetch())
    			{
    				if(array_key_exists($resultRow[0], $hostSystem))
    				{
    					$hostSystem[$resultRow[0]] = array("type"=>'SHARED');
    				}
    				else 
    				{
    					$hostSystem[$resultRow[0]] = array("type"=>'MEMBER');
    				}
    			}
    		}
            else
            {
                echo "Error getting member nodes: {$MEMBER_HOSTS->errorMsg()}\n";
            }
        }
	}
}
else
{
    echo "Error checking if system is a cluster: {$clusterTable->errorMsg()}\n";
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

