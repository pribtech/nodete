CALL DBMS_OUTPUT.ENABLE(NULL)@

/* Example of anonymous block */
DECLARE
  customer_id customer.customer_id%TYPE;
  customer_exists BOOLEAN;
  category_id category.category_id%TYPE;
  v_product_id product.product_id%TYPE;
  error BOOLEAN;
  message VARCHAR2(100);

BEGIN
  DBMS_OUTPUT.PUT_LINE('CUSTOMER TEST');
  DBMS_OUTPUT.PUT_LINE('-----------------------------------------------------------');
  customer_package.create_customer(   'Mike',  'Smith' ,     'mikesmith@yahoo.com', '534-234-2323', TO_DATE('1988-01-16','yyyy-mm-dd'),  customer_id, customer_exists);
  customer_package.create_customer(   'Joan',   'Jett' ,      'jjett@cardinal.net', '585-245-1212', TO_DATE('1960-02-02','yyyy-mm-dd'),  customer_id, customer_exists); 
  customer_package.create_customer('Sanjeev',  'Kumar' ,           'kumar@mail.ru', '234-321-2341', TO_DATE('1982-03-16','yyyy-mm-dd'),  customer_id, customer_exists);
  customer_package.create_customer( 'Graham', 'Norton' ,        'spider@gmail.com', '416-683-1092', TO_DATE('1985-04-24','yyyy-mm-dd'),  customer_id, customer_exists);
  customer_package.create_customer( 'Patsy' ,  'Stone' ,        'patsy01@yahoo.ca', '904-643-1432', TO_DATE('1959-05-30','yyyy-mm-dd'),  customer_id, customer_exists);
  customer_package.create_customer( 'Patsy' ,  'Stone' , 'stone_patsy@hotmail.com', '317-683-0001', TO_DATE('1959-05-30','yyyy-mm-dd'),  customer_id, customer_exists); 
  
  DBMS_OUTPUT.PUT_LINE('PRODUCT TEST');
  DBMS_OUTPUT.PUT_LINE('-----------------------------------------------------------');
  product_package.create_product(       'Wild Rose',     'Flowers', 19.99,  2000, v_product_id);
  product_package.create_product(           'Tulip',     'Flowers', 15.99,  3000, v_product_id);
  product_package.create_product(     'Garden Rake',  'Hand Tools', 18.99,   500, v_product_id);
  product_package.create_product('Electric Trimmer', 'Power Tools', 68.99,   200, v_product_id);
  product_package.create_product(   'Air Freshener',  'Automotive',  5.99,  4400, v_product_id);
  product_package.create_product(             'Wax',  'Automotive', 15.68, 10000, v_product_id);
  product_package.create_product(      'Antifreeze',  'Automotive', 20.98, 15000, v_product_id);

END;
@

call product_package.write_catalog(?!?)@

call DBMS_OUTPUT.GET_TEXT(?!?)@



