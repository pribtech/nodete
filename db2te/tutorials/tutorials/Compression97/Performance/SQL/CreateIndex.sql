
CREATE INDEX customer_index_without_compression 
  on customer_address_without_compression 
  (customer_name);

CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.CUSTOMER_ADDRESS_WITHOUT_COMPRESSION AND INDEXES ALL');


CREATE INDEX customer_index_with_compression 
  on customer_address_with_compression 
  (customer_name);
  
CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.CUSTOMER_ADDRESS_WITH_COMPRESSION AND INDEXES ALL');


SELECT INDNAME AS NAME, INDCARD AS ROWS, PCTPAGESSAVED AS PERCENT_SAVED_SPACE, COMPRESSION AS COMPRESSED 
	FROM SYSCAT.INDEXES  
	WHERE INDSCHEMA='?SCHEMA?';

