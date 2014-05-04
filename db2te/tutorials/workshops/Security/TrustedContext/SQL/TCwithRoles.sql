-- Create role Mgr
CREATE ROLE Mgr;

-- Grant privileges to role Mgr
GRANT SELECT, INSERT, UPDATE ON TABLE ?SCHEMA?.credit_card TO ROLE Mgr;

-- Create role custService
CREATE ROLE custService;

-- Grant privileges to role custService
GRANT SELECT ON ?SCHEMA?.credit_card TO ROLE custService;

-- Create trusted context Object
CREATE TRUSTED CONTEXT trCtx
BASED UPON CONNECTION USING SYSTEM AUTHID joe
ATTRIBUTES(
   ADDRESS '~~~~ipaddress~~~~~')
DEFAULT ROLE Mgr
ENABLE
WITH USE FOR sue WITH AUTHENTICATION,
bob ROLE custService WITHOUT AUTHENTICATION; 


