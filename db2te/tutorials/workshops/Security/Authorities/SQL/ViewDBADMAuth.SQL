-- User who created the database tries to grant SECADM authority to user Joe
GRANT SECADM ON DATABASE TO USER joe;

-- User who created the database tries to grant DBADM authority to user Bob
GRANT DBADM ON DATABASE TO USER bob;

-- User who created the database tries to revoke SECADM authority from user Pat
REVOKE SECADM ON DATABASE FROM USER pat;

