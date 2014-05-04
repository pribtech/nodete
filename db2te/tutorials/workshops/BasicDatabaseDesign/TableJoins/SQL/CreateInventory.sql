-- Create the 'inventory' table containing details of products that are procured from the manufacturer. It also contains 
-- products that may not be up for sale yet in the store

CREATE TABLE ?SCHEMA?.inventory_c(
  product_ID SMALLINT NOT NULL,
  name VARCHAR(20),
  cost_price DECIMAL(7,2),
  quantity INTEGER,
  PRIMARY KEY (product_ID));

-- Populate the 'inventory' table with data

INSERT INTO ?SCHEMA?.inventory_c VALUES ( 1, 'DVD Player', 4500, 100 ),
						   ( 2, 'TV', 22000, 150),
						   ( 3, 'Laptop', 31000, 300),
						   ( 6, 'Apple Ipod', 10000, 150),
						   ( 7, 'Music system', 15000, 10);
