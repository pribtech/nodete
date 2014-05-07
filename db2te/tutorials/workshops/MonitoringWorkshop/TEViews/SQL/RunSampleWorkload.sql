CREATE TABLE ?SCHEMA?.customer_address( 
customer_id INTEGER, 
customer_name VARCHAR(128), 
customer_address VARCHAR(128), 
customer_state VARCHAR(25), 
customer_country VARCHAR(30))
not logged initially;

CREATE USER TEMPORARY TABLESPACE Temp_TBSP;

DECLARE GLOBAL TEMPORARY TABLE SESSION.MULTIPLE
LIKE SYSCAT.COLUMNS
IN Temp_TBSP
ON COMMIT PRESERVE ROWS;

INSERT INTO SESSION.MULTIPLE
SELECT * FROM SYSCAT.COLUMNS
FETCH FIRST 10 ROWS ONLY;

INSERT INTO ?SCHEMA?.customer_address
SELECT ROW_NUMBER() OVER (), 
RTRIM(a.tabschema) || ' ' || RTRIM(a.tabname), 
CAST(a.colno AS VARCHAR(3)) || ' ' || RTRIM(a.colname) || ' ' || RTRIM(a.tabname),
RTRIM(a.TYPENAME), RTRIM(a.TABSCHEMA) 
FROM syscat.columns a, session.multiple b
ORDER BY sysfun.rand(); 

DROP TABLE SESSION.MULTIPLE;
DROP TABLE ?SCHEMA?.customer_address;
DROP TABLESPACE temp_TBSP;