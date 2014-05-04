
SELECT colname, typename FROM syscat.columns 
	WHERE tabschema = '?SCHEMA?' AND tabname ='CUSTOMER'@
	
	

ALTER TABLE ?SCHEMA?.customer 
	ALTER COLUMN customer_type 
		SET DATA TYPE VARCHAR(10)@
		
CALL ADMIN_REVALIDATE_DB_OBJECTS('TABLE', '?SCHEMA?', 'CUSTOMER')@

UPDATE ?SCHEMA?.customer SET customer_type = 'Registered'
	WHERE customer_type = 'R'@
	

UPDATE ?SCHEMA?.customer SET customer_type = 'Temporary'
	WHERE customer_type = 'T'@


SELECT colname, typename FROM syscat.columns 
	WHERE tabschema = '?SCHEMA?' AND tabname ='CUSTOMER'@
	

SELECT * FROM ?SCHEMA?.customer@	