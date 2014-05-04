
SELECT colname, typename FROM syscat.columns 
	WHERE tabschema = '?SCHEMA?' AND tabname ='CUSTOMER'@
	
	

ALTER TABLE ?SCHEMA?.customer 
	DROP COLUMN customer_type@
		

SELECT colname, typename FROM syscat.columns 
	WHERE tabschema = '?SCHEMA?' AND tabname ='CUSTOMER'@