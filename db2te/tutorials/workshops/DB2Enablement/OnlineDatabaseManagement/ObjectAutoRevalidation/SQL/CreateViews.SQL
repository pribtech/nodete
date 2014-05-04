CREATE VIEW month_customer AS 
		SELECT full_name FROM registered_customers 
			WHERE email =(SELECT email FROM registered_customers ORDER BY RAND() FETCH FIRST 1 ROW ONLY);


CREATE OR REPLACE VIEW registered_customers 
	AS SELECT full_name(customer_id) AS full_name, email, phone_number 
		FROM ?SCHEMA?.customer 
			WHERE customer_type = 'Registered';
		
		
CREATE OR REPLACE function full_name(p_customer_id INTEGER) RETURNS VARCHAR(100) 
	RETURN SELECT first_name || ', ' || last_name FROM customer 
		WHERE customer_id=p_customer_id;
		
		
ALTER TABLE ?SCHEMA?.CUSTOMER 
	ADD COLUMN customer_type VARCHAR (10)  
		NOT NULL  WITH DEFAULT 'Temporary';
		
		
CALL SYSPROC.ADMIN_CMD('REORG TABLE ?SCHEMA?.CUSTOMER');


UPDATE ?SCHEMA?.CUSTOMER
	SET customer_type = 'Registered'
		WHERE MOD(customer_id, 2) = 0;