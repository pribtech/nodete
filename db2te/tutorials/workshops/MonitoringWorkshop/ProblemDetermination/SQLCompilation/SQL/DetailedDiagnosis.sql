SELECT SUM(TOTAL_COMPILE_PROC_TIME) TOTAL_COMPILE_PROC_TIME,
       SUM(TOTAL_COMMIT_PROC_TIME) TOTAL_COMMIT_PROC_TIME
	FROM TABLE(MON_GET_SERVICE_SUBCLASS('','',-2)) as t;
