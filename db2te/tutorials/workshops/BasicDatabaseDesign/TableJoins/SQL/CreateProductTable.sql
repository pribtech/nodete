-- Cretae and insert values into table 'product' to store details of products 
-- sold in the store

CREATE TABLE ?SCHEMA?.product_c (
  product_ID SMALLINT NOT NULL,
  product_name VARCHAR(20),
  selling_price DECIMAL(7,2),
  PRIMARY KEY (product_ID));

INSERT INTO ?SCHEMA?.product_c VALUES ( 1, 'DVD Player', 6000 ),
	                              	  	 ( 2, 'TV', 25000),
			                         ( 3, 'Laptop', 35000),
					         ( 4, 'mp3 player', 10000),
			                         ( 5, 'Watch', 5000);

