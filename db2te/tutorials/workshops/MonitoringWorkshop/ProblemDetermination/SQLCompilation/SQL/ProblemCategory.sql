SELECT SUM(TOTAL_CPU_TIME) TOTAL_CPU_TIME,
       SUM(CLIENT_IDLE_WAIT_TIME) CLIENT_IDLE_WAIT_TIME,
	   SUM(TOTAL_WAIT_TIME) TOTAL_WAIT_TIME,
	   SUM(TOTAL_SECTION_PROC_TIME) TOTAL_SECTION_PROC_TIME
	FROM TABLE(MON_GET_SERVICE_SUBCLASS('','',-2)) as t;
