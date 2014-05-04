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