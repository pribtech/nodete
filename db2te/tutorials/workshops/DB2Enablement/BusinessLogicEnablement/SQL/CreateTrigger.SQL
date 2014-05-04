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