-- Revoke role 'Mgr' from manager of J.K Avro superstore 'Joe'.
REVOKE ROLE Mgr 
  FROM USER joe;

-- Revoke role 'custService' from employee of J.K Avro superstore 'Bob'.
REVOKE ROLE custService 
  FROM USER bob;

-- Drop role 'Mgr'.
DROP ROLE Mgr;

-- Drop role 'custService'.
DROP ROLE custService;

