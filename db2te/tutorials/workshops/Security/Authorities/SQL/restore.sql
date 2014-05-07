-- Replace ~~~~DATABASE_CREATOR~~~~ with the username used to create the SECURITY database.

GRANT SECADM ON DATABASE TO USER ~~~~DATABASE_CREATOR~~~~;

DROP ROLE mgr;

REVOKE DBADM ON DATABASE FROM USER sam;

REVOKE DATAACCESS, ACCESSCTRL ON DATABASE FROM USER bob;

