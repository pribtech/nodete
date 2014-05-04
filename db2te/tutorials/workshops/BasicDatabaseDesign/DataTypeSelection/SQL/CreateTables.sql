-- Create the tables enabled for 3NF with appropriate datatypes

-- Create table 'customer' to store customer details

CREATE TABLE ?SCHEMA?.customer (
  customer_ID SMALLINT,
  customer_name VARCHAR(50),
  customer_address VARCHAR(50)) ;

-- Create table 'product' to store details of products sold in the store

CREATE TABLE ?SCHEMA?.product (
  product_ID SMALLINT,
  product_name VARCHAR(20),
  selling_price DECIMAL(7,2)) ;

-- Create table 'order_status' that reflects the status of delivery of products to the customer

CREATE TABLE ?SCHEMA?.order_status (
  order_status INTEGER,
  order_status_desc VARCHAR(10)) ;

-- Create table 'order_master' that stores the purchase order details of the customer

CREATE TABLE ?SCHEMA?.order_master (
  order_master_ID SMALLINT,
  customer_ID SMALLINT,
  order_date DATE,
  total_amount DECIMAL(7,2),
  payment_mode VARCHAR(10),
  order_status INTEGER) ;

-- Create table 'order_details' that stores details of products purchased by the customers for each purchase order

CREATE TABLE ?SCHEMA?.order_details (
  order_details_ID SMALLINT,
  product_ID SMALLINT,
  product_quantity INTEGER,
  total_cost DECIMAL(7,2));

