-- In order to separate duties of security administrator from system administrator,  
-- SECADM Pat revokes SECADM authority from the database creator
-- Replace ~~~~DATABASE_CREATOR~~~~ with the proper username

REVOKE SECADM ON DATABASE FROM USER ~~~~DATABASE_CREATOR~~~~;
