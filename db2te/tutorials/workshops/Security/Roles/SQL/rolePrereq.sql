-- Grant SECADM authority to Pat to perform security related operations like create roles, grant roles to users.
GRANT SECADM ON DATABASE TO USER pat;

-- Create and populate credit_card table
CREATE TABLE ?SCHEMA?.credit_card(
		  ID               BIGINT NOT NULL , 
		  cardholder_name  VARCHAR(100) NOT NULL , 
		  ccv              SMALLINT NOT NULL , 
		  expiry_date      DATE NOT NULL , 
		  card_number      VARCHAR(20) NOT NULL , 
		  card_type        VARCHAR(50) NOT NULL , 
		  bank             VARCHAR(100) NOT NULL , 
		  customer_id      BIGINT NOT NULL);


INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900000,'Al',137,'2012-02-28','1870740178','Visa','HDFC',1);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900001,'Blair',99,'2011-07-27','1991952299','Mastero','Citi',2);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900002,'Bob',178,'2012-12-02','2113164420','Master Card','HDFC',3);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900003,'Bradley',49,'2011-04-30','2060590755','Master Card','ICICI',4);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900004,'Cleo',136,'2012-09-19','1939378634','Mastero','HSBC',5);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900005,'Donnell',88,'2012-05-20','1818166513','Mastero','HSBC',6);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900006,'Earnest',18,'2011-06-23','1696954392','Master Card','HSBC',7);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900007,'Horacio',169,'2011-03-16','1575742271','Visa','HSBC',8);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900008,'Jamel',27,'2012-07-17','1454530150','Master Card','HDFC',9);

INSERT INTO ?SCHEMA?.credit_card 
   VALUES(900009,'Jarred',194,'2012-02-27','1333318029','Mastero','Axis',10);
