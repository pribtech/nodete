CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.WITHOUT_COMPRESSION');  

SELECT NPAGES 
	FROM SYSIBM.SYSTABLES 
	WHERE CREATOR= '?SCHEMA?' 
	AND NAME='WITHOUT_COMPRESSION';