CREATE TABLE ?SCHEMA?.LOBDATA (
	  CUSTOMER_ID        INT      NOT NULL
	, ITEM_ID            INT      NOT NULL
	, SALE_QUANTITY      SMALLINT NOT NULL
	, SALE_DATE          DATE     NOT NULL
	, VIEW_TEXT          CLOB(2M) 
	, COLUMN_TEXT        CLOB(20M) )
	NOT LOGGED INITIALLY
;	

INSERT INTO ?SCHEMA?.LOBDATA 
	SELECT SYSFUN.RAND()*500 + 1 AS CUSTOMER_ID
	     , SYSFUN.RAND()*100 + 1 AS ITEM_ID
	     , 1 + SYSFUN.RAND()*10 AS SALE_QUANTITY
	     , DATE('01/01/2003') + (SYSFUN.RAND()*2000) DAYS AS SALE_DATE
	     , T1.TEXT
             , T2.TEXT
	  FROM SYSCAT.VIEWS T1, SYSCAT.COLUMNS T2
         WHERE T1.VIEWSCHEMA='SYSSTAT'
         FETCH FIRST 10000 ROWS ONLY
;