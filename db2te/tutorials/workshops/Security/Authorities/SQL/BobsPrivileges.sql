-- SECADM Pat can revoke ACCESSCTRL and DATAACCESS authorities from users
REVOKE ACCESSCTRL, DATAACCESS ON DATABASE FROM USER sam;

-- SECADM Pat can grant DBADM authority to users
GRANT DBADM WITHOUT ACCESSCTRL WITHOUT DATAACCESS ON DATABASE TO USER sam;

-- SECADM Pat creates a table 'customer' and grants least privileges to sam
-- such that sam can neither access table data nor grant privileges to users.
CREATE TABLE customer(name VARCHAR(20), ID integer, address VARCHAR(30));