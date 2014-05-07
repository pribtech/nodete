<?php

require_once(PHP_INCLUDE_BASE_DIRECTORY . './TE_M_config.php');

require_once(PHP_INCLUDE_BASE_DIRECTORY . MONITOR_FOLDER . "/te_sql_monitor.php");

$ACTION = getParameter("moniotr_action");
$MONITOR = getParameter("monitor_name");
$CONNECTION = getParameter("MONITOR_CONNECTION");
$META_CONNECTION = getParameter("METRICS_CONNECTION");
$SCHEMA = getParameter("METRICS_SCHEMA");

if(strtoupper($ACTION) == "STOP")
{
	
	$HOSTNAME = getParameter("monitor_hostname");
	$DATABASE = getParameter("monitor_database");
	$CURRENT_USER_SESSION = session_name("ACTIVE_SQL_MONITORS");
	session_start();
	if(array_key_exists('ACTIVE_SYSTEMS', $_SESSION))
	{
		$ACTIVE_SQL_MONITOR = @$_SESSION['ACTIVE_SYSTEMS'][$HOSTNAME][$DATABASE][$MONITOR];
		unset($_SESSION['ACTIVE_SYSTEMS'][$HOSTNAME][$DATABASE ][$MONITOR]);
		if($ACTIVE_SQL_MONITOR != null)
		{
			$ACTIVE_SQL_MONITOR['end_time'] = time();
			$uid = @$ACTIVE_SQL_MONITOR['monitor_pipe'];
			if($uid != null)
				exec("ps -ef | grep " . $uid. " | while read NAME PID OTHER; do kill -9 \$PID; done;");
			echo json_encode(array('returnCode' => "true", 'returnValue' => $ACTIVE_SQL_MONITOR));
		}
		else {
			echo json_encode(array('returnCode' => "false", 'returnValue' => "Monitors not found on this system"));
		}
	}
	else 
	{
		echo json_encode(array('returnCode' => "false", 'returnValue' => "No active monitors on this system"));
	}
	
	session_write_close();
	
	session_name($CURRENT_USER_SESSION);

	exit;
}
else if(strtoupper($ACTION) == "START")
{
	$connection = connectionManager::getConnection($CONNECTION);
	$meta_connection = connectionManager::getConnection($META_CONNECTION);
	if($connection != null && $meta_connection != null)
	{
		$CURRENT_USER_SESSION = session_name("ACTIVE_SQL_MONITORS");
		session_start();
		
		if(!array_key_exists('ACTIVE_SYSTEMS', $_SESSION))
		{
			$_SESSION['ACTIVE_SYSTEMS'] = array();
		}
		if(!array_key_exists($connection->hostname, $_SESSION['ACTIVE_SYSTEMS']))
		{
			$_SESSION['ACTIVE_SYSTEMS'][$connection->hostname] = array();
		}
		if(!array_key_exists($connection->database, $_SESSION['ACTIVE_SYSTEMS'][$connection->hostname]))
		{
			$_SESSION['ACTIVE_SYSTEMS'][$connection->hostname][$connection->database] = array();
		}
		if(!array_key_exists($MONITOR, $_SESSION['ACTIVE_SYSTEMS'][$connection->hostname][$connection->database]))
		{
			$ACTIVE_SQL_MONITOR = array();
			$ACTIVE_SQL_MONITOR['start_time'] = time();
			$ACTIVE_SQL_MONITOR['name'] = $MONITOR;
			$ACTIVE_SQL_MONITOR['database'] = $connection->database;
			$ACTIVE_SQL_MONITOR['host'] = $connection->hostname;
			$ACTIVE_SQL_MONITOR['MONITOR_HOST'] = $CONNECTION;
			$ACTIVE_SQL_MONITOR['METRICS_HOST'] = $META_CONNECTION;
			$ACTIVE_SQL_MONITOR['METRICS_SCHEMA'] = $SCHEMA;

			$monitorParameters = array();
			
			
			$monitorParameters['metaConnection'] = array();
			$monitorParameters['metaConnection']['host']     = $meta_connection->hostname;
			$monitorParameters['metaConnection']['port']     = $meta_connection->portnumber;
			$monitorParameters['metaConnection']['username'] = $meta_connection->username;
			$monitorParameters['metaConnection']['schema']   = $SCHEMA;
			$monitorParameters['metaConnection']['password'] = $meta_connection->password;
			$monitorParameters['metaConnection']['database'] = $meta_connection->database;
			
			
			$monitorParameters['bassSystemConnection'] = array();
			$monitorParameters['bassSystemConnection']['host']     = $connection->hostname;
			$monitorParameters['bassSystemConnection']['port']     = $connection->portnumber;
			$monitorParameters['bassSystemConnection']['username'] = $connection->username;
			$monitorParameters['bassSystemConnection']['password'] = $connection->password;
			$monitorParameters['bassSystemConnection']['database'] = $connection->database;

			$monitorParameters = json_encode($monitorParameters);
$descriptorspec = array(
   0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
   1 => array("file", "/tmp/output.txt", "a"),  // stdout is a pipe that the child will write to
   2 => array("file", "/tmp/error-output.txt", "a") // stderr is a file to write to
);
			$uid = uniqid();
			$command = 'php ' . PHP_INCLUDE_BASE_DIRECTORY . '/TE_SQL_M.php --monitor ' . $MONITOR . ' --input ' . escapeshellarg($monitorParameters) . " " . $uid;
			if (substr(php_uname(), 0, 7) == "Windows"){
	            pclose(popen("start " . $command, "r"));   
	        } else {
	            exec($command . " > /dev/null &");   
	            //echo system("ps -ef | grep " . $uid);
	        } 
	        // comment out above and use below to debug
			//proc_open($command, $descriptorspec, $pipes);
			$ACTIVE_SQL_MONITOR['monitor_pipe'] = $uid;
			
			$_SESSION['ACTIVE_SYSTEMS'][$connection->hostname][$connection->database][$MONITOR] = $ACTIVE_SQL_MONITOR;
			echo @json_encode(array('returnCode' => "true", 'returnValue' => $ACTIVE_SQL_MONITOR));
		}
		else 
		{
			echo json_encode(array('returnCode' => "false", 'returnValue' => "Monitor already exists"));
		}
		session_write_close();
		
		session_name($CURRENT_USER_SESSION);
	}
	else 
	{
		echo json_encode(array('returnCode' => "false", 'returnValue' => "Connection does not exist"));
	}
	exit;	
}

echo json_encode(array('returnCode' => "false", 'returnValue' => "Unknown action"));