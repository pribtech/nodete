-- Create audit policy to audit user privileges accessing 'credit_card' table and SQL statements executed on 'credit_card' table.
CREATE AUDIT POLICY trustedcontextPolicy CATEGORIES EXECUTE STATUS BOTH, CHECKING STATUS BOTH ERROR TYPE AUDIT;
COMMIT;

-- Enable audit on trusted context object.
AUDIT TRUSTED CONTEXT trCtx USING POLICY trustedcontextPolicy;
COMMIT;
