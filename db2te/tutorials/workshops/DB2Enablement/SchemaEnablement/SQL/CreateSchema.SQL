/* Create Tablespace tbs1 and create tables in tbs1*/
CREATE TABLESPACE tbs1 MANAGED BY AUTOMATIC STORAGE@

/* generate product id automatically*/
CREATE SEQUENCE seq_product_id INCREMENT BY 1 START WITH 1 NOCACHE@

/* generate category id automatically*/
CREATE SEQUENCE seq_category_id INCREMENT BY 1 START WITH 1 NOCACHE@

/* generate category id automatically*/
CREATE SEQUENCE seq_customer_id INCREMENT BY 1 START WITH 1 NOCACHE@

/* generate order id automatically*/
CREATE SEQUENCE seq_order_id INCREMENT BY 1 START WITH 1 NOCACHE@

/* Create customer table to store customer information */
CREATE TABLE customer(
	customer_id NUMBER(10) NOT NULL ,
	first_name VARCHAR2(30) NOT NULL,
	last_name VARCHAR2(40) NOT NULL,
	email VARCHAR2(100) NOT NULL,
	phone_number char(14) NOT NULL,
	birth_date date NOT NULL,
	registration_time TIMESTAMP(0) DEFAULT SYSDATE NOT NULL) in tbs1@

/* Alter table customer to add primary key */
ALTER TABLE customer ADD CONSTRAINT cust_pk_id PRIMARY KEY (customer_id)@

/* Create category table to store information about the categories*/
CREATE TABLE category(
	category_id NUMBER(10) NOT NULL ,
	category_name VARCHAR2(30) NOT NULL,
	category_parent_name VARCHAR2(30) 
) in tbs1@

/* Alter table category to add primary key */
ALTER TABLE category ADD CONSTRAINT CAT_PK_ID PRIMARY KEY (category_id)@


/* Insert category details in the category table */
INSERT INTO category(category_id, category_name, category_parent_name) VALUES
	(seq_category_id.NEXTVAL, 'Main', ''),
	(seq_category_id.NEXTVAL, 'Automotive', 'Main'),
	(seq_category_id.NEXTVAL, 'Gardening', 'Main'  ),
	(seq_category_id.NEXTVAL, 'Gardening', 'Main'),
	(seq_category_id.NEXTVAL, 'Hardware', 'Main'),
	(seq_category_id.NEXTVAL, 'Power Tools', 'Hardware'),
	(seq_category_id.NEXTVAL, 'Hand Tools', 'Hardware'),
	(seq_category_id.NEXTVAL, 'Flowers', 'Gardening')@

/* Create product table to store customer information */
CREATE TABLE product(
	product_id NUMBER(10) NOT NULL,
	category_id NUMBER(10) NOT NULL,
	product_name VARCHAR2(30) NOT NULL,
	product_price NUMBER(8,2) NOT NULL,
	inventory_quantity NUMBER default 0 NOT NULL 
) in tbs1@

/* Alter table product to add primary key and foreign key */
ALTER TABLE product ADD CONSTRAINT prod_pk_id PRIMARY KEY (product_id)@
ALTER TABLE product ADD CONSTRAINT fk_category FOREIGN KEY ( category_id ) REFERENCES category ( category_id)@

/* Create order table to store the information of orders*/
CREATE TABLE orders(
	order_id NUMBER(10) NOT NULL,
	customer_id NUMBER(10) NOT NULL,
	creation_time TIMESTAMP(1) default sysdate NOT NULL,
	estimated_delivery_time date,
	total_price NUMBER(8,2) NOT NULL,
	order_status VARCHAR2(15),
	CONSTRAINT check_order_status CHECK (order_status IN ('PROCESSING','ENROUTE','COMPLETE'))
) in tbs1@

/* Alter table orders to add primary key and foreign key */
ALTER TABLE orders ADD CONSTRAINT PK_ID PRIMARY KEY (order_id )@
ALTER TABLE orders ADD CONSTRAINT FK_CUSTOMER FOREIGN KEY ( customer_id ) REFERENCES customer ( customer_id)@

/* Create order table to store the information of order details */
CREATE TABLE order_details(
	order_id NUMBER(10),
	product_id NUMBER(10),
	product_quantity NUMBER(8)
) in tbs1@

/* Alter table order_details to add primary key and foreign key */
ALTER TABLE order_details ADD CONSTRAINT FK_ORDER FOREIGN KEY ( order_id ) REFERENCES orders ( order_id ) ON DELETE CASCADE@
ALTER TABLE order_details ADD CONSTRAINT FK_PRODUCT FOREIGN KEY ( product_id ) REFERENCES product ( product_id )@

/* Create temporary tablespace user_temp */
CREATE USER TEMPORARY TABLESPACE user_temp@

/* Create temporary tables shopping_cart*/
CREATE GLOBAL TEMPORARY TABLE shopping_cart (
	product_id NUMBER(10), 
	product_quantity NUMBER
) ON COMMIT PRESERVE ROWS@


CREATE OR REPLACE PROCEDURE DBMS_OUTPUT.GET_TEXT(RETURN_TEXT OUT CLOB) AS
    lines DBMS_OUTPUT.CHARARR;
    numlines INTEGER := 5000;
    BEGIN
        DBMS_OUTPUT.GET_LINES( lines, numlines );
        RETURN_TEXT := ' ';
        WHILE numlines > 0 LOOP
            RETURN_TEXT := lines[numlines] || chr(10) || RETURN_TEXT;
            numlines := numlines - 1;
        END LOOP;
END@
