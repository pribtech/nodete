DROP PROCEDURE WLMTUT.WAIT#

CREATE PROCEDURE WLMTUT.WAIT(IN WAITTIME INT)
  LANGUAGE SQL
BEGIN
  DECLARE I INTEGER DEFAULT 0;
  DECLARE START_TIME TIMESTAMP;
  DECLARE END_TIME TIMESTAMP;
  DECLARE DELTA INTEGER;
  
  SET START_TIME = CURRENT TIMESTAMP;
  WHILE I = 0 DO
     SET END_TIME = CURRENT TIMESTAMP;
     SET DELTA = TIMESTAMPDIFF(2,CHAR(END_TIME-START_TIME));
     IF (DELTA >= WAITTIME) THEN 
         SET I = 1;
     END IF;
  END WHILE;
END
#

DROP TABLE WLMTUT.EXITDEMO#
CREATE TABLE WLMTUT.EXITDEMO (A int)#