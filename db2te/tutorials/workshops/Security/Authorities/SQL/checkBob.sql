-- Check if DBADM Sam can access 'customer' table data
SELECT * FROM customer;

-- Check if DBADM Sam can grant privileges on 'customer' table to other users.
GRANT SELECT, INSERT ON customer TO USER joe;