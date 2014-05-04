<?php

$TE_SQL_MONITOR_ACTIONS[] = "system_monitor";


class system_monitor extends te_sql_monitor_action {

	public static $name = "System throughput Monitor";
	
	public static $description = "This monitor gathers the overall system throughput statistics for a system";
	
	public static $accessName = "system_monitor";
	
    private static $dataRetrevialQuery = "
SELECT
		-2 as ID,
		CURRENT_TIMESTAMP,
		TPS,
		COMMIT_SQL_STMTS,
		ROLLBACK_SQL_STMTS,
		DYNAMIC_SQL_STMTS,
		STATIC_SQL_STMTS,
		FAILED_SQL_STMTS,
		SELECT_SQL_STMTS,
		UID_SQL_STMTS,
		DDL_SQL_STMTS,
		ROWS_DELETED,
		ROWS_INSERTED,
		ROWS_UPDATED,
		ROWS_SELECTED,
		ROWS_READ,
		TOTAL_SORTS
	FROM
		TABLE(
			SELECT 
					CURRENT_TIMESTAMP, 
					UID_SQL_STMTS + SELECT_SQL_STMTS as TPS, 
					COMMIT_SQL_STMTS, 
					ROLLBACK_SQL_STMTS, 
					DYNAMIC_SQL_STMTS,
					STATIC_SQL_STMTS, 
					FAILED_SQL_STMTS, 
					SELECT_SQL_STMTS, 
					UID_SQL_STMTS, 
					DDL_SQL_STMTS, 
					ROWS_DELETED, 
					ROWS_INSERTED, 
					ROWS_UPDATED, 
					ROWS_SELECTED, 
					ROWS_READ, 
					TOTAL_SORTS
				FROM 
					TABLE(
						SNAP_GET_DB_V97('', -2)
					)
		)";

	private static $insertQuery = "
INSERT INTO PURESCALE.SYSTEM_THROUGHPUT(
		TIME,
		HOST,
		DATABASE,
		MEMBER,
		TIME_INT,
		TPS,
		COMMIT_SQL_STMTS,
		ROLLBACK_SQL_STMTS,
		DYNAMIC_SQL_STMTS,
		STATIC_SQL_STMTS,
		FAILED_SQL_STMTS,
		SELECT_SQL_STMTS,
		UID_SQL_STMTS,
		DDL_SQL_STMTS,
		ROWS_DELETED,
		ROWS_INSERTED,
		ROWS_UPDATED,
		ROWS_SELECTED,
		ROWS_READ,
		TOTAL_SORTS
	)
	VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

	private static $createQuery = "CREATE TABLE PURESCALE.SYSTEM_THROUGHPUT(
                    TIME        timestamp,
                    HOST		varchar(256),
                    DATABASE	varchar(256),
                    MEMBER		int,
                    TIME_INT	DECIMAL(20,4),
                    TPS   bigint,
                    COMMIT_SQL_STMTS   bigint,
                    ROLLBACK_SQL_STMTS   bigint,
                    DYNAMIC_SQL_STMTS   bigint,
                    STATIC_SQL_STMTS   bigint,
                    FAILED_SQL_STMTS   bigint,
                    SELECT_SQL_STMTS   bigint,
                    UID_SQL_STMTS   bigint,
                    DDL_SQL_STMTS   bigint,
                    ROWS_DELETED   bigint,
                    ROWS_INSERTED   bigint,
                    ROWS_UPDATED   bigint,
                    ROWS_SELECTED   bigint,
                    ROWS_READ bigint,
                    TOTAL_SORTS   bigint
                    )";

	private static $checkForTableQuery = "
SELECT
		count(*) 
	FROM 
		SYSCAT.TABLES
	WHERE
		TABSCHEMA = 'PURESCALE' 
			AND
		TABNAME = 'SYSTEM_THROUGHPUT'";

	private static $systemThroughput = null;
	 
    private static $prepareSTMT = null;

    public static function initializeStorageTables($metrics_database_connection)
    {
    	echo "Checking for monitor tables.\n";
        $dataTableExist = $metrics_database_connection->newStatement(self::$checkForTableQuery);
        if($dataTableExist->errorMsg() == "")
        {
            $resultRow = $dataTableExist->fetch();

            if($resultRow != false)
            {
                if($resultRow[0] == 0)
                {
                	echo "Creating data tables...\n\n";
                    $stmt = $metrics_database_connection->newStatement(self::$createQuery);
                    if($stmt->errorMsg() != "")
                    {
                        echo "Error:" . $stmt->errorMsg() . "\n";
                        return false;
                    }
                }
            }
            else 
            {
            	echo "Monitoring tables already created.\n";	
            }
        }
        else 
        {
        	echo "Error checking for monitor tables.\n";
        }
        return true;
    }
    public static function doRun($metrics_database_connection, $monitoring_database_connection)
    {
    	if(self::$prepareSTMT == null) self::$prepareSTMT = $metrics_database_connection->newStatement(self::$insertQuery, true);
        $stmt = $monitoring_database_connection->newStatement(self::$dataRetrevialQuery);
        $time = microtime(true);
        if($stmt->errorMsg() == "")
        {
			if(self::$systemThroughput == null) self::$systemThroughput = array();
            while($resultRow = $stmt->fetch())
            {
            	$resultRow[0] = "$resultRow[0]";
	            if(array_key_exists($resultRow[0], self::$systemThroughput))
	            {
	                $time_e = $time - self::$systemThroughput[$resultRow[0]]['time'];
	                $tps = ($resultRow[2] - self::$systemThroughput[$resultRow[0]]['tps'] )/$time_e;
	                $commit = ($resultRow[3] - self::$systemThroughput[$resultRow[0]]['commit'] )/$time_e;
	                $rollback = ($resultRow[4] - self::$systemThroughput[$resultRow[0]]['rollback'] )/$time_e;
	                $dynamic = ($resultRow[5] - self::$systemThroughput[$resultRow[0]]['dynamic'] )/$time_e;
	                $static = ($resultRow[6] - self::$systemThroughput[$resultRow[0]]['static'] )/$time_e;
	                $failed = ($resultRow[7] - self::$systemThroughput[$resultRow[0]]['failed'] )/$time_e;
	                $select = ($resultRow[8] - self::$systemThroughput[$resultRow[0]]['select'] )/$time_e;
	                $uid = ($resultRow[9] - self::$systemThroughput[$resultRow[0]]['uid'] )/$time_e;
	                $ddl = ($resultRow[10] - self::$systemThroughput[$resultRow[0]]['ddl'] )/$time_e;
	                $row_del = ($resultRow[11] - self::$systemThroughput[$resultRow[0]]['row_del'] )/$time_e;
	                $row_inser = ($resultRow[12] - self::$systemThroughput[$resultRow[0]]['row_inser'] )/$time_e;
	                $row_update = ($resultRow[13] - self::$systemThroughput[$resultRow[0]]['row_update'] )/$time_e;
	                $row_select = ($resultRow[14] - self::$systemThroughput[$resultRow[0]]['row_select'] )/$time_e;
	                $row_read = ($resultRow[15] - self::$systemThroughput[$resultRow[0]]['row_read'] )/$time_e;
	                $total_sorts = ($resultRow[16] - self::$systemThroughput[$resultRow[0]]['total_sorts'] )/$time_e;
	
	                self::$prepareSTMT->execute(array(
			                $resultRow[1], 
			                $monitoring_database_connection->hostname,
			                $monitoring_database_connection->database,
			                $resultRow[0],
			                $time,
			                $tps, 
			                $commit, 
			                $rollback, 
			                $dynamic, 
			                $static, 
			                $failed, 
			                $select, 
			                $uid, 
			                $ddl, 
			                $row_del, 
			                $row_inser, 
			                $row_update, 
			                $row_select, 
			                $row_read, 
			                $total_sorts)
						);
	            }
	            	
                self::$systemThroughput[$resultRow[0]]['firstRun'] = false;
                self::$systemThroughput[$resultRow[0]]['time'] = $time;
                self::$systemThroughput[$resultRow[0]]['tps'] = $resultRow[2];
                self::$systemThroughput[$resultRow[0]]['commit'] = $resultRow[3];
                self::$systemThroughput[$resultRow[0]]['rollback'] = $resultRow[4];
                self::$systemThroughput[$resultRow[0]]['dynamic'] = $resultRow[5];
                self::$systemThroughput[$resultRow[0]]['static'] = $resultRow[6];
                self::$systemThroughput[$resultRow[0]]['failed'] = $resultRow[7];
                self::$systemThroughput[$resultRow[0]]['select'] = $resultRow[8];
                self::$systemThroughput[$resultRow[0]]['uid'] = $resultRow[9];
                self::$systemThroughput[$resultRow[0]]['ddl'] = $resultRow[10];
                self::$systemThroughput[$resultRow[0]]['row_del'] = $resultRow[11];
                self::$systemThroughput[$resultRow[0]]['row_inser'] = $resultRow[12];
                self::$systemThroughput[$resultRow[0]]['row_update'] = $resultRow[13];
                self::$systemThroughput[$resultRow[0]]['row_select'] = $resultRow[14];
                self::$systemThroughput[$resultRow[0]]['row_read'] = $resultRow[15];
                self::$systemThroughput[$resultRow[0]]['total_sorts'] = $resultRow[16];

            }
        }
        else 
        {
            echo "Error:" . $stmt->errorMsg() . "\n";
            self::$prepareSTMT = null;
            return false;
        }
		return true;
    }
}

