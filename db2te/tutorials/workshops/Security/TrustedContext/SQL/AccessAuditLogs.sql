-- Archive audited data 
CALL SYSPROC.AUDIT_ARCHIVE(NULL, NULL);

-- Extract audit data from archived log files to ASCII delimited files.
CALL SYSPROC.AUDIT_DELIM_EXTRACT ('',NULL,NULL,'db2audit.db.SECURITY.log.%.20%',' ');

-- Import audit data from ASCII delimited files to audit tables.
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\checking.del OF DEL REPLACE INTO DB2AUDIT.CHECKING');
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\execute.del OF DEL REPLACE INTO DB2AUDIT.EXECUTE');

-- View audited data from audit tables.
SELECT * FROM DB2AUDIT.CHECKING;
SELECT * FROM DB2AUDIT.EXECUTE;