-- Grant privileges to Roles 'Mgr' and 'custService'
GRANT SELECT, INSERT, UPDATE ON TABLE ?SCHEMA?.credit_card TO ROLE custService;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ?SCHEMA?.credit_card TO ROLE Mgr;

-- Grant role 'Mgr' to Joe, manager of J.K.Avro superstore.
GRANT ROLE Mgr TO USER joe;

-- Grant role 'custService' to Bob, an employee of J.K Avro superstore.
GRANT ROLE custService TO USER bob;