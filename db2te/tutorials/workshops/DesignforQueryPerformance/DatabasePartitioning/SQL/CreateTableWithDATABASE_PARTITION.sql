-- Create the FACT table SUBSCRIBER_RATED_USAGE_DPF with the SUBSCRIBER_MSISDN as the hashing key 
-- as it is used in the join between tables

CREATE TABLE ?SCHEMA?.SUBSCRIBER_RATED_USAGE_DPF  (
		  OUT_ROAMING_IND 		SMALLINT ,
                  OUT_ROAMING_NW_OP_KEY 	INTEGER ,
                  EVENT_START_DT 		DATE ,
                  EVENT_START_TIME 		TIME ,
                  EVENT_DURATION 		INTEGER ,
                  CORE_ACC_CHARGE_AMT 		DECIMAL(10,2) ,
                  CC_NUM 			VARCHAR(21) ,
                  EVENT_TYPE_KEY 		SMALLINT ,
                  CDR_ID_KEY 			VARCHAR(75) ,
                  EVENT_TYPE_CLSF_KEY 		SMALLINT ,
                  SUBSCRIBER_CIRCLE_ID 		SMALLINT ,
                  SUBSCRIBER_MSISDN 		BIGINT ,
                  CALL_PULSE_30 		INTEGER ,
                  CALL_PULSE_60 		INTEGER ,
                  FORWARD_TO_NUM 		BIGINT ,
                  FIRST_CELLSITE 		VARCHAR(21) ,
                  SOURCE_DESTINATION_NW_OP_KEY 	INTEGER ,
                  EVENT_DIR 			SMALLINT ,
                  TRF_PLAN_KEY 			VARCHAR(21) )
                  DISTRIBUTE BY HASH(SUBSCRIBER_MSISDN)
                  IN FACTSPACE NOT LOGGED INITIALLY ;

-- Create the FACT table SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_DPF with the SUBSCRIBER_MSISDN as the hashing key 
-- as it is used in the join between tables

CREATE TABLE ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_DPF  (
                  CDR_ID_KEY 			VARCHAR(75) ,
                  DED_ACC_KEY 			SMALLINT ,
                  DED_ACC_CHARGE_AMT 		DECIMAL(10,2) ,
                  SUBSCRIBER_MSISDN 		BIGINT ,
                  SUBSCRIBER_CIRCLE_ID 		SMALLINT ,
                  CC_NUM	 		VARCHAR(21) ,
                  EVENT_START_DT 		DATE ,
                  EVENT_START_TIME 		TIME ,
                  EVENT_DURATION 		INTEGER )
                  DISTRIBUTE BY HASH(SUBSCRIBER_MSISDN)
                  IN FACTSPACE NOT LOGGED INITIALLY ;


-- Create the FACT table SUBSCRIBER_MSISDN_HISTORY_DPF with the SUBSCRIBER_MSISDN as the hashing key 
-- as it is used in the join between tables

CREATE TABLE ?SCHEMA?.SUBSCRIBER_MSISDN_HISTORY_DPF  (
                  SUBSCRIBER_MSISDN 	        BIGINT ,
                  MSISDN_START_DT 		DATE NOT NULL ,
                  CIRCLE_ID 			SMALLINT ,
                  SUBSCRIBER_KEY 		VARCHAR(21) ,
                  MSISDN_END_DT 		DATE ,
                  MSISDN_EFF_TIME 		TIME ,
                  MSISDN_END_TIME 		TIME )
                  DISTRIBUTE BY HASH(SUBSCRIBER_MSISDN)
                  IN FACTSPACE NOT LOGGED INITIALLY ;


-- Create the DIMENSION table DEDICATED_ACCOUNT_DPF 

CREATE TABLE ?SCHEMA?.DEDICATED_ACCOUNT_DPF  ( 
                  DED_ACC_KEY 			SMALLINT ,
                  DED_ACC_EFF_DT 		DATE , 
                  DED_ACC_END_DT 		DATE , 
                  DED_ACC_CONVERSION_FACTOR 	DECIMAL(10,2) , 
                  CIRCLE_ID 			SMALLINT) 
                  IN DIMSPACE NOT LOGGED INITIALLY ;

INSERT INTO ?SCHEMA?.SUBSCRIBER_RATED_USAGE_DPF (SELECT * FROM TE_TEMP.SUBSCRIBER_RATED_USAGE) ;

INSERT INTO ?SCHEMA?.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE_DPF (SELECT * FROM TE_TEMP.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE) ;

INSERT INTO ?SCHEMA?.SUBSCRIBER_MSISDN_HISTORY_DPF (SELECT * FROM TE_TEMP.SUBSCRIBER_MSISDN_HISTORY) ;

INSERT INTO ?SCHEMA?.DEDICATED_ACCOUNT_DPF (SELECT * FROM TE_TEMP.DEDICATED_ACCOUNT_TEMP) ;


