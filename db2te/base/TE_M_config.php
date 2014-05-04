<?php


@define("DEBUG_MODE_ENABLED", false);

@define("MAJOR_VERSION", "mon");

@define("MINOR_VERSION", "1");

@define("SUB_VERSION", "0");

@define("USE_PERSISTENT_CONNECTION", true);

@define("FORCE_CONNECTION_WITH_DEFAULT", false);

@define("MONITOR_NAME", "pureScale");

@define("PHP_INCLUDE_BASE_DIRECTORY", "");

@define("MONITOR_FOLDER", 'TE_Monitors/');

@define("TE_SQL_MONITORS", 'SQL/');

@define("SQL_CHECK_FOR_MANAGMENT_TABLE", "select count(*) from syscat.tables where TABSCHEMA = 's#db2mc' and TABNAME = 'TE_BACKMON'");

@define("SQL_CREATE_MANAGMENT_TABLE", "create table \"s#db2mc\".TE_backmon(monitor_name varchar(256), disable_monitor char(1), is_alive timestamp)");


@define("SQL_CHECK_FOR_SYSTEM_TABLE", "select count(*) from syscat.tables where TABSCHEMA = 's#db2mc' and TABNAME = 'TE_SYSTEMS'");

@define("SQL_CREATE_HOST_MONITOR_MANAGMENT_TABLE", "create table \"s#db2mc\".TE_SYSTEMS(monitor_name varchar(256), hostname varchar(256), database varchar(256), username varchar(256), password varchar(256), port integer)");



@define("SQL_CHECK_FOR_HOST_MONITOR_MANAGMENT_TABLE", "select count(*) from syscat.tables where TABSCHEMA = 's#db2mc' and TABNAME = 'TE_SYSTEM_BACKMON'");

@define("SQL_CREATE_HOST_MONITOR_MANAGMENT_TABLE", "create table \"s#db2mc\".TE_SYSTEM_BACKMON(monitor_name varchar(256), system_name varchar(256), disable_monitor char(1), is_alive timestamp)");




