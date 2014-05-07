-- SECADM Pat can grant DBADM authority to user Bob
GRANT DBADM ON DATABASE TO USER bob;

-- SECADM Pat can grant SECADM authority to user Joe
GRANT SECADM ON DATABASE TO USER joe;

-- SECADM Pat can create roles
CREATE ROLE Mgr;

-- SECADM Pat can revoke DBADM authority from users
REVOKE DBADM ON DATABASE FROM USER bob;

-- SECADM Pat can revoke SECADM authority from users
REVOKE SECADM ON DATABASE FROM USER joe;

