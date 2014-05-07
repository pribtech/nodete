CREATE TABLE CUSTOMER_ADDRESS_WITHOUT_COMPRESSION( 
	customer_id INTEGER, 
	customer_name VARCHAR(128), 
	customer_address VARCHAR(128), 
	customer_state VARCHAR(25), 
	customer_country VARCHAR(30))
	not logged initially;

CREATE USER TEMPORARY TABLESPACE ?SCHEMA?;

DECLARE GLOBAL TEMPORARY TABLE SESSION.MULTIPLE
        LIKE SYSCAT.COLUMNS
        IN ?SCHEMA?
        ON COMMIT DELETE ROWS;

INSERT INTO SESSION.MULTIPLE
SELECT * FROM SYSCAT.COLUMNS
 FETCH FIRST 20 ROWS ONLY;

INSERT INTO customer_address_without_compression
SELECT ROW_NUMBER() OVER (), 
       RTRIM(a.tabschema) || ' ' || RTRIM(a.tabname), 
       CAST(a.colno AS VARCHAR(3)) || ' ' || RTRIM(a.colname) || ' ' || RTRIM(a.tabname),
       RTRIM(a.TYPENAME), RTRIM(a.TABSCHEMA) 
       FROM syscat.columns a, session.multiple b
       ORDER BY sysfun.rand();
  
 call admin_cmd('RUNSTATS ON TABLE ?SCHEMA?.CUSTOMER_ADDRESS_WITHOUT_COMPRESSION');