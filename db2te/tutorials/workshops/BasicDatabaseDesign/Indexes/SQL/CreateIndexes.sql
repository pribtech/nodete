-- Create non-unique indexes on the 'customer_ID' and 'order_status' columns of the 'order_master' table

CREATE INDEX ?SCHEMA?.order_cust
  ON ?SCHEMA?.order_master_i (customer_ID);
  
CREATE INDEX ?SCHEMA?.order_status
  ON ?SCHEMA?.order_master_i (order_status);

-- Create composite index on the order_details table

CREATE INDEX ?SCHEMA?.fkorder
  ON ?SCHEMA?.order_details_i (order_details_ID, product_ID);

-- Create clustered index on the 'order_date' column 

CREATE INDEX ?SCHEMA?.date
  ON ?SCHEMA?.order_master_i (order_date) CLUSTER;