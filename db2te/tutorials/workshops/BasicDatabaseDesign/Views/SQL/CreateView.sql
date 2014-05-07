-- Create a view containing the information from the 'order_master' and 'order_details' tables

CREATE OR REPLACE VIEW ?SCHEMA?.v_order 
  AS SELECT order_master_ID, customer_ID, order_date, total_amount, product_ID, product_quantity
       FROM ?SCHEMA?.order_master_c, ?SCHEMA?.order_details_c
       WHERE order_master_ID = order_details_ID;
