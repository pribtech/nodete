CALL ADMIN_CMD('REORG TABLE ?SCHEMA?.CUSTOMER_ADDRESS_WITH_AUTO_COMPRESSION');
  
CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.CUSTOMER_ADDRESS_WITH_AUTO_COMPRESSION');
