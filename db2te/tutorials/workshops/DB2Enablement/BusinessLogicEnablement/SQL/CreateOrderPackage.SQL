
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