-- Create table SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_RANGE range partitioned by date 

CREATE TABLE ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_RANGE  (
                  CDR_ID_KEY 			VARCHAR(75) ,
                  DED_ACC_KEY 		SMALLINT ,
                  DED_ACC_CHARGE_AMT 	DECIMAL(10,2) ,
                  SUBSCRIBER_MSISDN 	BIGINT ,
                  SUBSCRIBER_CIRCLE_ID 	SMALLINT ,
                  CC_NUM	 		VARCHAR(21) ,
                  EVENT_START_DT 		DATE ,
                  EVENT_START_TIME 		TIME ,
                  EVENT_DURATION 		INTEGER )
                  DISTRIBUTE BY HASH(SUBSCRIBER_MSISDN) 
                    PARTITION BY RANGE(EVENT_START_DT)
                      (PART PART0 STARTING '2009-02-01' ENDING '2009-02-28' IN RP0 INDEX IN Ind0 ,
		       PART PART1 STARTING '2009-03-01' ENDING '2009-03-31' IN RP1 INDEX IN Ind1 ,
		       PART PART2 STARTING '2009-04-01' ENDING '2009-04-30' IN RP2 INDEX IN Ind2 ,
		       PART PART3 STARTING '2009-05-01' ENDING '2009-05-31' IN RP3 INDEX IN Ind3 ,
                       PART PART4 STARTING '2009-06-01' ENDING '2009-06-30' IN RP4 INDEX IN Ind4)           
                  NOT LOGGED INITIALLY ;

-- Populate the tables with data

INSERT INTO ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_RANGE (SELECT * FROM TE_TEMP.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE) ;

-- Create a regular local index that is present in each range

CREATE INDEX ?SCHEMA?.INDEX_DEDICATED_USAGE_RANGE_1 
  ON ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_RANGE
  (SUBSCRIBER_MSISDN) PARTITIONED
  ALLOW REVERSE SCANS ;

-- Create a composite local index that is present in each range

CREATE INDEX ?SCHEMA?.INDEX_DEDICATED_USAGE_RANGE_2 
  ON ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_RANGE
  (SUBSCRIBER_CIRCLE_ID, EVENT_START_DT) PARTITIONED
  ALLOW REVERSE SCANS ;


-- Execute RUNSTATS to ensure current statistics are present in the Index

CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_RANGE FOR INDEXES ALL') ;

