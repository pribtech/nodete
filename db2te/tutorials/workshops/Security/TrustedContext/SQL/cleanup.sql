-- Drop trusted context object
DROP TRUSTED CONTEXT trCtx;

-- Drop role 'Mgr'.
DROP ROLE Mgr;

-- Drop role 'custService'.
DROP ROLE custService;

-- Drop Audit tables.

DROP TABLE DB2AUDIT.CHECKING;
DROP TABLE DB2AUDIT.EXECUTE;


-- Drop audit policy
DROP AUDIT POLICY trustedcontextPolicy;


