ALTER SECURITY POLICY DataAccess USE ROLE AUTHORIZATIONS;

-- Grant security label 'TOP_SECRET' to role Mgr so that all managers of J.K.Avro superstore 
-- can access protected data in 'credit_card' table.
GRANT SECURITY LABEL DataAccess.TOP_SECRET TO ROLE Mgr FOR ALL ACCESS;

-- Grant security label 'SECRET' to role custService so that all employees of J.K.Avro
-- superstore can insert/update data in required columns of 'credit_card' table.
GRANT SECURITY LABEL DataAccess.SECRET TO ROLE custservice FOR WRITE ACCESS;

-- Add security policy to table 'credit_card'
ALTER TABLE ?SCHEMA?.credit_card ADD SECURITY POLICY DataAccess;

-- Add security label 'TOP_SECRET' to 'card_number' column of credit_card table.
ALTER TABLE ?SCHEMA?.credit_card ALTER COLUMN CARD_NUMBER SECURED WITH TOP_SECRET;

-- Add security label 'SECRET' to all other columns of 'credit_card' table.
ALTER TABLE ?SCHEMA?.credit_card 
  ALTER COLUMN ID SECURED WITH SECRET 
  ALTER COLUMN CARDHOLDER_NAME SECURED WITH SECRET 
  ALTER COLUMN CCV SECURED WITH SECRET 
  ALTER COLUMN EXPIRY_DATE SECURED WITH SECRET 
  ALTER COLUMN BANK SECURED WITH SECRET 
  ALTER COLUMN CARD_TYPE SECURED WITH SECRET 
  ALTER COLUMN CUSTOMER_ID SECURED WITH SECRET;




