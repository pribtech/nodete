CALL DBMS_OUTPUT.ENABLE(NULL)@

truncate table shopping_cart@

declare 
  v_customer_id customer.customer_id%TYPE;
   category_id category.category_id%TYPE;
   product_id product.product_id%TYPE:=1;
   v_order_id orders.order_id%TYPE;

begin
  SELECT customer_id INTO v_customer_id FROM customer ORDER BY sysfun.rand() FETCH FIRST 1 ROW ONLY;
  FOR i IN (select product_id, CAST(sysfun.rand()*50 as integer)+1 as quantity FROM product WHERE ROWNUM<CAST(sysfun.rand()*10 as integer)) LOOP
      order_package.add_item_to_shopping_cart(i.product_id, i.quantity);
  END LOOP;

  order_package.create_order(v_customer_id, v_order_id);
  order_package.print_order(v_order_id);
end; 
@

call DBMS_OUTPUT.GET_TEXT(?!?)@