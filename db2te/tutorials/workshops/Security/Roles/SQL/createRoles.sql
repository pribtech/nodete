-- Create roles 'custService' and 'Mgr' to protect access to sensitive details 
-- like card_number, ccv number, cardholder_name of 'credit_card' table.
CREATE ROLE custService;
CREATE ROLE Mgr;

-- Grant privileges to Roles 'Mgr' and 'custService'
GRANT SELECT, INSERT, UPDATE ON TABLE ?SCHEMA?.credit_card TO ROLE custService;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ?SCHEMA?.credit_card TO ROLE Mgr;

-- Grant role 'Mgr' to Joe, manager of J.K.Avro superstore.
GRANT ROLE Mgr TO USER joe;

-- Grant role 'custService' to Bob, an employee of J.K Avro superstore.
GRANT ROLE custService TO USER bob;