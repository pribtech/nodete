
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