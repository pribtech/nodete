-- Move audit data from active logs to archive log files.
CALL SYSPROC.AUDIT_ARCHIVE(NULL, NULL);

-- Extract audit data from archived log files to ASCII delimited files.
CALL SYSPROC.AUDIT_DELIM_EXTRACT ('',NULL,NULL,'db2audit.db.SECURITY.log.%.20%',' ');

-- Import extracted data from ASCII delimited files into DB2 audit tables.
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\audit.del OF DEL REPLACE INTO DB2AUDIT.AUDIT');
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\checking.del OF DEL REPLACE INTO DB2AUDIT.CHECKING');
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\objmaint.del OF DEL REPLACE INTO DB2AUDIT.OBJMAINT');
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\secmaint.del OF DEL REPLACE INTO DB2AUDIT.SECMAINT');
CALL ADMIN_CMD('IMPORT FROM C:\\Audit\\execute.del OF DEL REPLACE INTO DB2AUDIT.EXECUTE');


