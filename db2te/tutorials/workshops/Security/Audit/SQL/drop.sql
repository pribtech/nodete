

-- Remove audit policies on table, on roles, on authorities
AUDIT TABLE ?SCHEMA?.credit_card REMOVE POLICY;
AUDIT ROLE custService, SECADM REMOVE POLICY;
AUDIT SYSADM, DBADM REMOVE POLICY;

-- Drop audit policies
DROP AUDIT POLICY creditcardtablePolicy;
DROP AUDIT POLICY custserviceRolePolicy;
DROP AUDIT POLICY adminsPolicy;

-- Revoke roles from users Bob and Joe
REVOKE ROLE custService FROM USER bob;
REVOKE ROLE Mgr FROM USER joe;

-- Drop roles
DROP ROLE Mgr;
DROP ROLE custService;

-- Drop audit tables.
DROP TABLE DB2AUDIT.AUDIT;
DROP TABLE DB2AUDIT.CHECKING;
DROP TABLE DB2AUDIT.OBJMAINT;
DROP TABLE DB2AUDIT.SECMAINT;
DROP TABLE DB2AUDIT.EXECUTE;




