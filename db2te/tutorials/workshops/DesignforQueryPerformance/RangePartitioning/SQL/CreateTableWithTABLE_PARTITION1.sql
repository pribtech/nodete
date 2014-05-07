-- Create tablespaces for different ranges of range partitioned table
CREATE TABLESPACE RP0 IN PGA ;
CREATE TABLESPACE RP1 IN PGA ;
CREATE TABLESPACE RP2 IN PGA ;
CREATE TABLESPACE RP3 IN PGA ;
CREATE TABLESPACE RP4 IN PGA ;

-- Create tablespaces for hosting the local indexes for each range
CREATE TABLESPACE Ind0 IN PGA ;
CREATE TABLESPACE Ind1 IN PGA ;
CREATE TABLESPACE Ind2 IN PGA ;
CREATE TABLESPACE Ind3 IN PGA ;
CREATE TABLESPACE Ind4 IN PGA ;

-- Create table SUBSCRIBER_RATED_USAGE_RANGE range partitioned by date 

CREATE TABLE ?SCHEMA?.SUBSCRIBER_RATED_USAGE_RANGE  (
		  OUT_ROAMING_IND 		SMALLINT ,
                  OUT_ROAMING_NW_OP_KEY 	INTEGER ,
                  EVENT_START_DT 		DATE ,
                  EVENT_START_TIME 		TIME ,
                  EVENT_DURATION 		INTEGER ,
                  CORE_ACC_CHARGE_AMT 	DECIMAL(10,2) ,
                  CC_NUM 			VARCHAR(21) ,
                  EVENT_TYPE_KEY 		SMALLINT ,
                  CDR_ID_KEY 			VARCHAR(75) ,
                  EVENT_TYPE_CLSF_KEY 	SMALLINT ,
                  SUBSCRIBER_CIRCLE_ID 	SMALLINT ,
                  SUBSCRIBER_MSISDN 	BIGINT ,
                  CALL_PULSE_30 		INTEGER ,
                  CALL_PULSE_60 		INTEGER ,
                  FORWARD_TO_NUM 		BIGINT ,
                  FIRST_CELLSITE 		VARCHAR(21) ,
                  SOURCE_DESTINATION_NW_OP_KEY 	INTEGER ,
                  EVENT_DIR 			SMALLINT ,
                  TRF_PLAN_KEY 		VARCHAR(21) )
                  DISTRIBUTE BY HASH(SUBSCRIBER_MSISDN) 
                    PARTITION BY RANGE(EVENT_START_DT)
                      (PART PART0 STARTING '2009-02-01' ENDING '2009-02-28' IN RP0 INDEX IN Ind0 ,
		       PART PART1 STARTING '2009-03-01' ENDING '2009-03-31' IN RP1 INDEX IN Ind1 ,
		       PART PART2 STARTING '2009-04-01' ENDING '2009-04-30' IN RP2 INDEX IN Ind2 ,
		       PART PART3 STARTING '2009-05-01' ENDING '2009-05-31' IN RP3 INDEX IN Ind3 ,
                       PART PART4 STARTING '2009-06-01' ENDING '2009-06-30' IN RP4 INDEX IN Ind4)           
                  NOT LOGGED INITIALLY ;

-- Populate the tables with data

INSERT INTO ?SCHEMA?.SUBSCRIBER_RATED_USAGE_RANGE (SELECT * FROM TE_TEMP.SUBSCRIBER_RATED_USAGE) ;

-- Create a regular local index that is present in each range
CREATE INDEX ?SCHEMA?.INDEX_RATED_USAGE_RANGE_1 
  ON ?SCHEMA?.SUBSCRIBER_RATED_USAGE_RANGE
  (SUBSCRIBER_MSISDN) PARTITIONED 
  ALLOW REVERSE SCANS ; 

-- Create a composite local index that is present in each range
CREATE INDEX ?SCHEMA?.INDEX_RATED_USAGE_RANGE_2 
  ON ?SCHEMA?.SUBSCRIBER_RATED_USAGE_RANGE
  (SUBSCRIBER_CIRCLE_ID, EVENT_START_DT) PARTITIONED 
  ALLOW REVERSE SCANS ;

-- Execute RUNSTATS to ensure current statistics are present in the Index
CALL ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.SUBSCRIBER_RATED_USAGE_RANGE FOR INDEXES ALL') ;
