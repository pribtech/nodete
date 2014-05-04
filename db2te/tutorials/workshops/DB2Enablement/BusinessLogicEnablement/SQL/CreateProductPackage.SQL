
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
