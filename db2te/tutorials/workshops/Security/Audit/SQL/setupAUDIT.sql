-- The J.K.Avro superstore wants to audit the SQL statements executed on 'credit_card' table. Hence he creates 
-- creditcardtablePolicy audit policy 
CREATE AUDIT POLICY creditcardtablePolicy 
   CATEGORIES EXECUTE STATUS BOTH 
   ERROR TYPE AUDIT;
COMMIT;

-- Audit table 'credit_card'. Whenever anyone tries to access 'credit_card' table,
-- an audit entry will be made.
AUDIT TABLE ?SCHEMA?.credit_card USING POLICY creditcardtablePolicy;
COMMIT;


-- The J.K.Avro superstore wants to audit roles, SECADM accessing table 'credit_card'.
CREATE AUDIT POLICY custserviceRolePolicy 
  CATEGORIES EXECUTE STATUS BOTH, 
             OBJMAINT STATUS BOTH,  
             SECMAINT STATUS BOTH, 
             AUDIT STATUS BOTH,              
             CHECKING STATUS BOTH 
  ERROR TYPE AUDIT;
COMMIT;

-- Audit roles accessing table 'credit_card' and security admin creating/droping objects, 
-- changing audit configurations, audit privileges of users accessing
-- table 'credit_card'
AUDIT ROLE custService, SECADM USING POLICY custserviceRolePolicy;
COMMIT;


-- J.K.Avro superstore wants to audit SYSADM and DBADM authorities. Hence he creates 
-- adminsPolicy audit policy.
CREATE AUDIT POLICY adminsPolicy 
   CATEGORIES SYSADMIN STATUS BOTH, 
              OBJMAINT STATUS BOTH, 
              CHECKING STATUS BOTH 
   ERROR TYPE AUDIT;
COMMIT;

-- Audit SYSADM, DBADM authorites while performing SYSADM activities, creating/dropping objects,
-- accessing table 'credit_card'
AUDIT SYSADM, DBADM USING POLICY adminsPolicy;
COMMIT;

