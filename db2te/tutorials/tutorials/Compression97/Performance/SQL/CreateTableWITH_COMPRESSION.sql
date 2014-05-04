CREATE TABLE customer_address_with_compression 
	LIKE customer_address_without_compression
 	not logged initially; 

INSERT INTO customer_address_with_compression 
  SELECT * FROM customer_address_without_compression; 

ALTER TABLE customer_address_with_compression 
  COMPRESS YES; 

CALL ADMIN_CMD('REORG TABLE ?SCHEMA?.customer_address_with_compression'); 

CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.customer_address_with_compression'); 