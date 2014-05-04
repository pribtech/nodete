<?php

$TE_SQL_MONITOR_ACTIONS = array();

abstract class te_sql_monitor_action {
	public static $name;
	public static $description;
	public static $accessName;
	abstract public static function initializeStorageTables($metrics_database_connection);
	abstract public static function doRun($metrics_database_connection, $monitoring_database_connection);
}