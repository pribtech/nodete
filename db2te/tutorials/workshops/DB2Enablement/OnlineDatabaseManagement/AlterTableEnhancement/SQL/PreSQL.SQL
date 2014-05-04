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



CREATE OR REPLACE PACKAGE product_package IS
   PROCEDURE create_product(p_product_name VARCHAR2, p_category_name VARCHAR2, p_product_price NUMBER, p_quantity NUMBER, o_product_id OUT NUMBER);
   PROCEDURE verify_product_availability (p_product_id NUMBER, p_items_requested NUMBER, 
					       available_yn OUT BOOLEAN, error OUT BOOLEAN, message OUT VARCHAR2); 
   PROCEDURE write_catalog(message OUT VARCHAR2);
END product_package; 
@



CREATE OR REPLACE PACKAGE BODY product_package IS   

   PROCEDURE create_product( p_product_name VARCHAR2, p_category_name VARCHAR2, p_product_price NUMBER, p_quantity NUMBER, 
			     o_product_id OUT NUMBER) IS
                             
      v_category_id NUMBER;
      
   BEGIN
      /* Example of implicit cursor and usage of its attribute %NOTFOUND */
      SELECT category_id INTO v_category_id FROM category WHERE INITCAP(category_name)=INITCAP(p_category_name);
      IF(SQL%NOTFOUND) THEN
	 			DBMS_OUTPUT.PUT_LINE('Cannot find the category name');
      ELSE
      /* Example of new sequence keywords - NEXTVAL and CURRVAL */
	      INSERT INTO product VALUES(seq_product_id.NEXTVAL, v_category_id, p_product_name, p_product_price, p_quantity);
        SELECT seq_product_id.CURRVAL INTO o_product_id FROM dual;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Product ' || p_product_name || ' was added to our warehouse with new id ' || o_product_id);
      END IF;
        
   END CREATE_product;


   PROCEDURE verify_product_availability (p_product_id NUMBER, p_items_requested NUMBER, 
					       available_yn OUT BOOLEAN, error OUT BOOLEAN, message OUT VARCHAR2) IS
					       
	    /* Example of explicit cursor and usage of its actions and attributes: OPEN, FETCH, CLOSE, %ISOPEN, %NOTFOUND, %ROWCOUNT */                                   
      CURSOR c_verify_product IS SELECT inventory_quantity FROM product WHERE product_id=p_product_id;
           
       v_inventory_quantity NUMBER:=0;
      
   BEGIN
      available_yn := FALSE;
      error:=FALSE;
      message:='';
           IF(NOT c_verify_product%ISOPEN) THEN
      	OPEN c_verify_product;
      END IF;

      LOOP
      	FETCH c_verify_product INTO v_inventory_quantity;
        EXIT WHEN c_verify_product%NOTFOUND;
      END LOOP;

      IF(c_verify_product%ROWCOUNT<>1) THEN
				error:=TRUE;
				message:='Invalid product_id';
      END IF;
      CLOSE c_verify_product;
      
      IF(v_inventory_quantity >= p_items_requested) THEN
         available_yn := TRUE;
      END IF; 

   END verify_product_availability;
   
   
   /* Example of new built-in packages: UTL_DIR, UTL_FILE and DBMS_OUTPUT */
   PROCEDURE write_catalog( message OUT VARCHAR2) IS
      v_filehandle      UTL_FILE.FILE_TYPE;
      v_filename        VARCHAR2(100) DEFAULT 'catalog.out';  
      v_temp_line       VARCHAR2(100);
   BEGIN
      message:='';
      UTL_DIR.CREATE_DIRECTORY('mydir1', 'C:\\');
      v_filehandle := UTL_FILE.FOPEN('mydir1',v_filename,'w');
      FOR i IN             
        (SELECT level, category_name FROM category 
         START WITH category_name = 'Main' CONNECT BY PRIOR category_name = category_parent_name) 
      LOOP
         UTL_FILE.PUT_LINE(v_filehandle,i.level || LPAD(' ', 4 * i.level - 1) ||i.category_name);
      END LOOP;
      UTL_FILE.FCLOSE(v_filehandle);
      
      BEGIN
          v_filehandle := UTL_FILE.FOPEN('mydir1',v_filename,'r');
          LOOP
             UTL_FILE.GET_LINE(v_filehandle, v_temp_line);
             message:=message || chr(10) || v_temp_line ;
          END LOOP;
          EXCEPTION
          WHEN no_data_found THEN
              NULL;
      END;
     
      UTL_DIR.DROP_DIRECTORY('mydir1');

   END write_catalog;

END; 
@



CREATE OR REPLACE PACKAGE customer_package IS   
   /* Example of new types: record, reference cursor and associative array */
   TYPE customer_record IS RECORD(customer_id customer.customer_id%TYPE, first_name customer.first_name%TYPE, last_name customer.last_name%TYPE, email customer.email%TYPE, phone_number customer.phone_number%TYPE, birth_date customer.birth_date%TYPE);  
   TYPE search_refcursor IS REF CURSOR;
   TYPE search_criteria IS TABLE OF VARCHAR2(200) INDEX BY VARCHAR(20);
   
   FUNCTION  search_customer_records(p_search_criteria SEARCH_CRITERIA) RETURN search_refcursor;

   PROCEDURE create_customer(p_first_name customer.first_name%TYPE, p_last_name customer.last_name%TYPE, p_email customer.email%TYPE, p_phone_number customer.phone_number%TYPE, p_birth_date DATE, customer_id OUT customer.customer_id%TYPE, customer_exists OUT BOOLEAN);     
   PROCEDURE get_customer(p_customer_id customer.customer_id%TYPE, customer_out OUT customer_record);
   PROCEDURE generate_promotion(promotion_type VARCHAR2, promotion_output VARCHAR2, output OUT VARCHAR2);
END customer_package; 
@



CREATE OR REPLACE PACKAGE BODY customer_package IS  

   PROCEDURE create_customer(p_first_name customer.first_name%TYPE, p_last_name customer.last_name%TYPE, p_email customer.email%TYPE, p_phone_number customer.phone_number%TYPE, p_birth_date DATE,   customer_id OUT customer.customer_id%TYPE, customer_exists OUT BOOLEAN) IS
      
      /* Example of %ROWTYPE and %TYPE pseudo/anchor data type */
      v_customer_rec customer%ROWTYPE;
      v_customer_id customer.customer_id%TYPE;            
      
      CURSOR c_customer_exists IS SELECT * FROM customer WHERE UPPER(first_name)=UPPER(p_first_name) and UPPER(last_name)=UPPER(p_last_name) and birth_date=p_birth_date;

   BEGIN
      customer_exists := TRUE;
      OPEN c_customer_exists;
      FETCH c_customer_exists INTO v_customer_rec;
      IF(c_customer_exists%NOTFOUND) THEN
          customer_exists := FALSE;
          /* Example of EXECUTE IMMEDIATEs command */
          EXECUTE IMMEDIATE 'INSERT INTO customer VALUES( ' || seq_customer_id.NEXTVAL || ', INITCAP(''' || p_first_name || '''), INITCAP(''' || p_last_name || '''), '''|| p_email || ''',''' || p_phone_number || ''', ''' || p_birth_date || ''',''' ||sysdate|| ''')';
          SELECT seq_customer_id.CURRVAL INTO v_customer_id FROM dual;
          DBMS_OUTPUT.PUT_LINE('SUCCESS: Customer "' || p_first_name || ' ' || p_last_name || '" was created with id ' || v_customer_id);
      ELSE
          DBMS_OUTPUT.PUT_LINE('FAILURE: Customer "' || p_first_name || ' ' || p_last_name || '" already registered with id ' || v_customer_rec.customer_id);
      END IF;
   END create_customer;
  
  /* Example of function that takes ASSOCIATIVE ARRAY as an input and returns REFERENCE CURSOR */
  FUNCTION search_customer_records(p_search_criteria SEARCH_CRITERIA) RETURN SEARCH_REFCURSOR IS
      refcursor_out SEARCH_REFCURSOR;
      search_argument VARCHAR2(20);
      search_value VARCHAR2(200);
      where_clause VARCHAR2(300):='';
      stmt VARCHAR2(300);
   BEGIN
   /* Example of associative array and its attributes: COUNT, FIRST, NEXT */
        IF(p_search_criteria.COUNT>0) THEN
          where_clause := ' WHERE ';
        END IF;
        FOR i IN 1..p_search_criteria.COUNT LOOP
            IF i = 1 THEN
              search_argument := p_search_criteria.FIRST;
              search_value := p_search_criteria(search_argument);
            ELSE
              IF(p_search_criteria.NEXT(search_argument) IS NOT NULL) THEN
                search_argument := p_search_criteria.NEXT(search_argument);
                search_value := p_search_criteria(search_argument);
              ELSE
                EXIT;
              END IF;
            END IF;
            /* Example of CASE syntax */
            CASE search_argument
              WHEN 'Last Name' THEN
                where_clause := where_clause || ' last_name IN' || search_value;
              WHEN 'Birthday' THEN
                where_clause := where_clause || ' birth_date IN' || search_value;
            END CASE;
        END LOOP;
      stmt:='SELECT * FROM customer ' || where_clause;
      OPEN refcursor_out FOR stmt;
      RETURN refcursor_out;      
   END search_customer_records;

   PROCEDURE generate_promotion(promotion_type VARCHAR2, promotion_output VARCHAR2, output OUT VARCHAR2) IS 
      promotion_search_criteria SEARCH_CRITERIA;
      c_search_results SEARCH_REFCURSOR;
      search_results customer%ROWTYPE;
      
   BEGIN
      IF(promotion_type='Birthday Month') THEN
        output:='Search results for Birthday Promotion' || chr(10);
        promotion_search_criteria('Birthday'):='(SELECT birth_date FROM customer WHERE MOD(MONTHS_BETWEEN(sysdate, birth_date),2)=0)';
      ELSIF (promotion_type='Lucky number 13') THEN
        output:='Search results for Lucky number 13 Promotion' || chr(10);
        promotion_search_criteria('Last Name'):='(SELECT last_name FROM customer WHERE MOD(ROWNUM,13)=0 ORDER BY sysfun.rand())';
      END IF;
      
      /* Example of usage of function that returns REFERENCE CURSOR */      
      c_search_results := search_customer_records(promotion_search_criteria);
      output := output || '------------------------------------------' || chr(10);
      LOOP
        FETCH c_search_results INTO search_results;
        EXIT WHEN (c_search_results%ROWCOUNT > 100) OR (c_search_results%NOTFOUND);
          output := output || search_results.first_name || ',' || search_results.last_name || ' : ' || search_results.phone_number || ', ' || search_results.email;
      END LOOP;
      
  END generate_promotion;
   
  PROCEDURE get_customer(p_customer_id customer.customer_id%TYPE, customer_out OUT customer_record) IS           
      CURSOR c_get_customer IS 
         SELECT customer_id, first_name, last_name, email, phone_number, birth_date 
         FROM customer 
         WHERE customer_id=p_customer_id;     
   BEGIN
      OPEN c_get_customer;
      FETCH c_get_customer INTO customer_out;
      CLOSE c_get_customer;
   /* Example of handling the exceptions inside the procedure */
   EXCEPTION
    		WHEN others THEN
        	DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE);
        	DBMS_OUTPUT.PUT_LINE('SQLERRM: ' || SQLERRM);
        	RAISE;
   END get_customer;
   
END customer_package;
@


CREATE OR REPLACE PACKAGE order_package IS
   
   TYPE shopping_cart_item IS RECORD (product_id shopping_cart.product_id%TYPE, quantity shopping_cart.product_quantity%TYPE);
   /* Example of VARRAY datatype */
   TYPE shopping_cart_product IS VARRAY(10) OF shopping_cart.product_id%TYPE;
   TYPE shopping_cart_quantity IS VARRAY(10) OF shopping_cart.product_quantity%TYPE;

   PROCEDURE add_item_to_shopping_cart(p_product_id shopping_cart.product_id%TYPE, p_product_quantity shopping_cart.product_quantity%TYPE);    
   PROCEDURE create_order (p_customer_id customer.customer_id%TYPE, o_order_id OUT orders.order_id%TYPE);
   PROCEDURE print_order(p_order_id orders.order_id%TYPE);
END order_package;
@

CREATE OR REPLACE PACKAGE BODY order_package IS   

   PROCEDURE add_item_to_shopping_cart(p_product_id shopping_cart.product_id%TYPE, p_product_quantity shopping_cart.product_quantity%TYPE) IS
   
       v_total_quantity NUMBER := p_product_quantity;
       product_exists_in_cart BOOLEAN :=FALSE;
       product_available_yn BOOLEAN := FALSE;
       err BOOLEAN;
       message VARCHAR2(100);
       CURSOR test_existance IS SELECT product_quantity FROM shopping_cart WHERE product_id=p_product_id;  
   BEGIN
       OPEN test_existance;
       FETCH test_existance INTO v_total_quantity;
       IF(test_existance%FOUND) THEN      
           product_exists_in_cart := TRUE;
          v_total_quantity := v_total_quantity+p_product_quantity;
       ELSE
          v_total_quantity := p_product_quantity;
         
       END IF;
       
       /* Example of calling the procedure defined in another package */
       product_package.verify_product_availability(p_product_id, v_total_quantity, product_available_yn, err, message);
       IF(product_available_yn=TRUE) THEN
          IF(product_exists_in_cart = TRUE) THEN
              UPDATE shopping_cart SET product_quantity=v_total_quantity;
          ELSE
               INSERT INTO shopping_cart VALUES(p_product_id, v_total_quantity); 
          END IF;
       ELSE 
           DBMS_OUTPUT.PUT_LINE('We do not have '|| v_total_quantity || ' items in our warehouse');
       END IF;
       EXCEPTION
       WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE);
        DBMS_OUTPUT.PUT_LINE('SQLERRM: ' || SQLERRM);
   END;
	 
   
   PROCEDURE create_order (p_customer_id customer.customer_id%TYPE, o_order_id OUT orders.order_id%TYPE) IS  
      /* Example of usage of VARRAY data type */
      v_shopping_cart_product SHOPPING_CART_PRODUCT; 
      v_shopping_cart_quantity SHOPPING_CART_QUANTITY;       
      CURSOR c_get_shopping_cart IS SELECT product_id, product_quantity FROM shopping_cart;     
      i INTEGER := 1;   
      v_total_price orders.total_price%TYPE := 0;  
      v_product_price product.product_price%TYPE;
      order_rec orders%ROWTYPE;
   BEGIN    
      o_order_id := 0;
       
      /* Example of FOR LOOP over explicit cursor */     
      FOR shopping_cart_rec IN c_get_shopping_cart LOOP
          v_shopping_cart_product(i):=shopping_cart_rec.product_id; 
          v_shopping_cart_quantity(i):=shopping_cart_rec.product_quantity;
          i := i + 1; 
          IF(i=11) THEN
             DBMS_OUTPUT.PUT_LINE('Shopping cart contains more than 10 items. Only first 10 items will be part of your order');
             EXIT;
          END IF;
      END LOOP;


      IF(i<1) THEN
          DBMS_OUTPUT.PUT_LINE('You need to have at least 1 product in your shopping cart');
      ELSE
      INSERT INTO orders VALUES(seq_order_id.NEXTVAL, p_customer_id, sysdate, sysdate + 3.5, 0, 'PROCESSING');
      SELECT seq_order_id.CURRVAL INTO o_order_id FROM dual;
           
           /* Example of FOR LOOP over integer value */
           FOR k IN 1..v_shopping_cart_product.COUNT LOOP
               SELECT product_price INTO v_product_price FROM product WHERE product_id=v_shopping_cart_product(k);
               v_total_price := v_total_price + v_product_price*v_shopping_cart_quantity(k);
               INSERT INTO order_details VALUES(o_order_id, v_shopping_cart_product(k), v_shopping_cart_quantity(k)); 
               UPDATE product SET inventory_quantity=inventory_quantity-v_shopping_cart_quantity(k) WHERE product_id=v_shopping_cart_product(k);
          END LOOP;
                    
          UPDATE orders SET total_price=v_total_price WHERE order_id=o_order_id;
      END IF;
   END create_order;

  
   PROCEDURE print_order(p_order_id orders.order_id%TYPE) IS
       order_rec orders%ROWTYPE;
       customer_rec customer_package.customer_record;
   BEGIN
       DBMS_OUTPUT.PUT_LINE('');
       DBMS_OUTPUT.PUT_LINE('');
       DBMS_OUTPUT.PUT_LINE('Order : ' || p_order_id);
       DBMS_OUTPUT.PUT_LINE('--------------------------------------------------------');
       SELECT * INTO order_rec FROM orders WHERE order_id=p_order_id;
       
       customer_package.get_customer(order_rec.customer_id, customer_rec);
       DBMS_OUTPUT.PUT_LINE('Customer           : ' || customer_rec.first_name || ', ' || customer_rec.last_name);
       DBMS_OUTPUT.PUT_LINE('Order creation     : ' || TO_CHAR(order_rec.creation_time,'MM-DD-YYYY'));
       DBMS_OUTPUT.PUT_LINE('Estimated Delivery : ' || TO_CHAR(order_rec.estimated_delivery_time,'MM-DD-YYYY'));
       DBMS_OUTPUT.PUT_LINE('Status             : ' || DECODE(order_rec.order_status,'D', 'Delivered', 'Shipped'));
       DBMS_OUTPUT.PUT_LINE('Total price        : ' || TO_CHAR(order_rec.total_price , '$999,999.99'));
       DBMS_OUTPUT.PUT_LINE('--------------------------------------------------------');
       DBMS_OUTPUT.PUT_LINE('Products : ');
       
       /* Example of FOR LOOP over implicit cursor */
       FOR i IN (SELECT product_name, product_quantity FROM order_details o, product p WHERE o.product_id=p.product_id AND order_id=p_order_id) LOOP          
           DBMS_OUTPUT.PUT_LINE('          ' || i.product_name || ' (' || i.product_quantity || ' pcs)');
       END LOOP;
   END; 
END;
@

/* Example of Trigger that has PL/SQL logic */

CREATE OR REPLACE TRIGGER estimated_delivery AFTER INSERT ON orders FOR EACH ROW
  DECLARE 
  v_shipment_in_days NUMBER:=3; 
  v_day_of_week NUMBER:=0;
BEGIN  
  SELECT DAYOFWEEK(creation_time) INTO v_day_of_week FROM DUAL WHERE order_id=:NEW.order_id;
  IF( :NEW.total_price>=1000) THEN
       v_shipment_in_days:=2;
       IF(v_day_of_week>3) THEN
          v_shipment_in_days:=4;
       END IF;
  ELSE
       IF(v_day_of_week>1) THEN
	  v_shipment_in_days:=5;
       END IF;
  END IF;
  UPDATE orders SET estimated_delivery_time=sysdate+v_shipment_in_days days WHERE order_id=:NEW.order_id; 
END;
@



CALL DBMS_OUTPUT.ENABLE(3000000)@

DECLARE
  v_customer_id customer.customer_id%TYPE;
  customer_exists BOOLEAN;
  category_id category.category_id%TYPE;
  product_id product.product_id%TYPE:=1;
  v_order_id orders.order_id%TYPE;
  i INTEGER :=6;

BEGIN
   WHILE i<10 LOOP
      customer_package.create_customer('First' || i , 'last' || i , 'email' || i||'@test.com', '111-222-333', '1960-02-02' , v_customer_id , customer_exists);
      i:=i+1;
   END LOOP;
   i:=8;
   WHILE i<20 LOOP
	    product_package.create_product('Product ' || i , 'Main' , CAST(CAST(sysfun.rand() * 10000 as integer) / 100 as decimal(8 , 2)) , CAST(sysfun.rand() * 100000 as integer) , product_id);
	    i:=i+1;
   END LOOP;
   i:=2; 
   WHILE i<150 LOOP
     i:=i+1;
     DELETE from shopping_cart;
     FOR i IN (select product_id, CAST(sysfun.rand()*50 as integer) as quantity FROM product WHERE ROWNUM<CAST(sysfun.rand()*10 as integer)+1) LOOP
         order_package.add_item_to_shopping_cart(i.product_id, i.quantity);
     END LOOP;
     SELECT customer_id INTO v_customer_id FROM customer ORDER BY sysfun.rand() FETCH FIRST 1 ROW ONLY;
     FOR i IN (select product_id, CAST(sysfun.rand()*50 as integer)+1 as quantity FROM product WHERE ROWNUM<CAST(sysfun.rand()*10 as integer)) LOOP
          order_package.add_item_to_shopping_cart(i.product_id, i.quantity);
     END LOOP;
     order_package.create_order(v_customer_id, v_order_id);
	 order_package.print_order(v_order_id);
	 END LOOP;
END;
@

call DBMS_OUTPUT.GET_TEXT(?!?)@
