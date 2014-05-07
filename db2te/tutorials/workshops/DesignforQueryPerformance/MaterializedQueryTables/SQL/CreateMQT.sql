-- Create an MQT table that replicates the DIMENSION table on all partitions containing the FACT tables

CREATE SUMMARY TABLE ?SCHEMA?.MQT
  AS (SELECT * FROM ?SCHEMA?.DEDICATED_ACCOUNT_IND) 
  DATA INITIALLY DEFERRED 
  REFRESH DEFERRED 
  DISTRIBUTE BY REPLICATION IN FACTSPACE ;

-- Refresh the table to ensure current data is present

REFRESH TABLE ?SCHEMA?.MQT ;

-- Check for integrity constraints

SET INTEGRITY FOR ?SCHEMA?.MQT 
  All IMMEDIATE UNCHECKED ;

-- Execute RUNSTATS to ensure current statistics are present in the MQT

CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.MQT') ;