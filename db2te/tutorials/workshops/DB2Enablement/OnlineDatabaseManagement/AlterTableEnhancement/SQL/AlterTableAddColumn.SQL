ALTER TABLE ?SCHEMA?.CUSTOMER 
	ADD COLUMN type CHAR (1)  
		NOT NULL  WITH DEFAULT 'T' @

		
UPDATE ?SCHEMA?.customer SET type = 'R'
	WHERE MOD(customer_id, 2) = 0@

	
	
CALL SYSPROC.ADMIN_CMD('REORG TABLE ?SCHEMA?.CUSTOMER')@



SELECT colname, typename FROM syscat.columns 
	WHERE tabschema = '?SCHEMA?' AND tabname = 'CUSTOMER'@

	
	
SELECT customer_id, first_name, last_name, type FROM ?SCHEMA?.CUSTOMER FETCH FIRST 10 ROWS ONLY@