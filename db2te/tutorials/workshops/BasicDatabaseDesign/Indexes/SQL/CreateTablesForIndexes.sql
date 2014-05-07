-- Create and insert values into table 'customer' to store customer  
-- details

CREATE TABLE ?SCHEMA?.customer_i (
  customer_ID SMALLINT NOT NULL,
  customer_name VARCHAR(50),
  customer_address VARCHAR(50),
  PRIMARY KEY (customer_ID));

INSERT INTO ?SCHEMA?.customer_i VALUES ( 2010, 'John', '24 Ontario' ),
						  ( 2011, 'Dave', '30 New York' ),
						  ( 2012, 'Jim', '12 Boston' ),
						  ( 2013, 'Kate', '44 Chicago' );

-- Cretae and insert values into table 'product' to store details of products 
-- sold in the store

CREATE TABLE ?SCHEMA?.product_i (
  product_ID SMALLINT NOT NULL,
  product_name VARCHAR(20),
  selling_price DECIMAL(7,2),
  PRIMARY KEY (product_ID));

INSERT INTO ?SCHEMA?.product_i VALUES ( 1, 'DVD Player', 6000 ),
						 ( 2, 'TV', 25000),
						 ( 3, 'Laptop', 35000),
						 ( 4, 'mp3 player', 10000),
						 ( 5, 'Watch', 5000);

-- Create and insert values into table 'order_status' that reflects the status 
-- of delivery of products to the customer

CREATE TABLE ?SCHEMA?.order_status_i (
  order_status INTEGER NOT NULL,
  order_status_desc VARCHAR(10),
  PRIMARY KEY (order_status));

INSERT INTO ?SCHEMA?.order_status_i VALUES ( 0, 'pending' ),
						      ( 1, 'delivered' );

-- Create and insert values into table 'order_master' that stores the purchase  
-- order details of the customer

CREATE TABLE ?SCHEMA?.order_master_i (
  order_master_ID SMALLINT NOT NULL,
  customer_ID SMALLINT NOT NULL,
  order_date DATE,
  total_amount DECIMAL(7,2),
  payment_mode VARCHAR(15),
  order_status INTEGER NOT NULL,
  PRIMARY KEY (order_master_ID),
  CONSTRAINT fk_custid FOREIGN KEY (customer_ID)
    REFERENCES customer_i (customer_ID) ON DELETE CASCADE,
  CONSTRAINT fk_orderstatus FOREIGN KEY (order_status)
    REFERENCES order_status_i (order_status) ON DELETE CASCADE );

INSERT INTO ?SCHEMA?.order_master_i VALUES ( 11010, 2010, '2009-01-12', 6000, 'Cash', 1),
						      ( 11011, 2011, '2009-02-15', 35000, 'Credit', 1),
						      ( 11012, 2012, '2009-03-04', 25000, 'Cheque', 1),
						      ( 11013, 2013, '2009-03-15', 5000, 'Cash', 1),
					   	      ( 11014, 2010, '2009-04-10', 25000, 'Credit', 0),
						      ( 11015, 2011, '2009-04-22', 10000, 'Cash', 0);

-- Create and insert values into table 'order_details' that stores details of 
-- products purchased by the customers for each purchase order

CREATE TABLE ?SCHEMA?.order_details_i (
  order_details_ID SMALLINT NOT NULL,
  product_ID SMALLINT NOT NULL,
  product_quantity INTEGER,
  total_cost DECIMAL(7,2),
  CONSTRAINT fk_orderid FOREIGN KEY (order_details_ID)
    REFERENCES order_master_i (order_master_ID) ON DELETE CASCADE,
  CONSTRAINT fk_prod FOREIGN KEY (product_ID)
    REFERENCES product_i (product_ID)ON DELETE CASCADE);

INSERT INTO ?SCHEMA?.order_details_i VALUES ( 11010, 1, 1, 6000),
						       ( 11011, 3, 1, 35000),
						       ( 11012, 2, 1, 25000),
						       ( 11013, 5, 1, 5000),
						       ( 11014, 2, 1, 25000),
						       ( 11015, 4, 1, 10000);
