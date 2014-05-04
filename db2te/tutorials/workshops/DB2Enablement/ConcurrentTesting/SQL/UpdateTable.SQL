CREATE OR REPLACE PROCEDURE update_customer_info (IN v_phone_no VARCHAR(10), IN v_email_id VARCHAR(20))
BEGIN
  DECLARE v_name    VARCHAR(30) DEFAULT 'alert_test_custinfo';
  DECLARE v_msg     VARCHAR(80);
  DECLARE v_status  INTEGER;
  DECLARE v_timeout INTEGER DEFAULT 50;

  CALL DBMS_ALERT.REGISTER(v_name);
  UPDATE ?SCHEMA?.customer SET phone_number = v_phone_no WHERE email = v_email_id;
  CALL DBMS_ALERT.WAITONE(v_name , v_msg , v_status , v_timeout);
  CALL DBMS_ALERT.REMOVE(v_name);

END@


CREATE OR REPLACE PROCEDURE update_product_price (IN v_product_name VARCHAR(20), IN v_product_price INTEGER)
BEGIN
  DECLARE v_name    VARCHAR(30) DEFAULT 'alert_test_product';
  DECLARE v_msg     VARCHAR(80);
  DECLARE v_status  INTEGER;
  DECLARE v_timeout INTEGER DEFAULT 50;

  CALL DBMS_ALERT.REGISTER(v_name);
  UPDATE ?SCHEMA?.product SET product_price = v_product_price WHERE product_name = v_product_name;
  CALL DBMS_ALERT.WAITONE(v_name , v_msg , v_status , v_timeout);
  CALL DBMS_ALERT.REMOVE(v_name);
END@