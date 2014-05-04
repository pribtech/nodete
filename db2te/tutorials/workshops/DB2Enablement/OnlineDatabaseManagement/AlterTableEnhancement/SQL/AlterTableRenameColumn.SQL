ALTER TABLE ?SCHEMA?.customer 
	RENAME COLUMN type to customer_type@
	

SELECT colname, typename FROM syscat.columns 
	WHERE tabschema = '?SCHEMA?' AND tabname ='CUSTOMER'@

	
SELECT customer_id, first_name, last_name, customer_type FROM ?SCHEMA?.CUSTOMER FETCH FIRST 10 ROWS ONLY@