CONNECT TO designdb @

CREATE DATABASE PARTITION GROUP PGA ON DBPARTITIONNUMS (0 TO 2) @
CREATE DATABASE PARTITION GROUP PGB ON DBPARTITIONNUMS (3) @

CREATE TABLESPACE FACTSPACE IN PGA @
CREATE TABLESPACE INDSPACE1 IN PGA @
CREATE TABLESPACE INDSPACE2 IN PGB @
CREATE TABLESPACE DIMSPACE IN PGB @

DROP TABLE TE_TEMP.SUBSCRIBER_RATED_USAGE @
DROP TABLE TE_TEMP.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE @
DROP TABLE TE_TEMP.SUBSCRIBER_MSISDN_HISTORY @
DROP TABLE TE_TEMP.DEDICATED_ACCOUNT_TEMP @

COMMIT @
UPDATE COMMAND OPTIONS USING c OFF @

-- Create subscriber_rated_usage_table 
CREATE TABLE TE_TEMP.SUBSCRIBER_RATED_USAGE  (
				  OUT_ROAMING_IND 		SMALLINT ,
                  OUT_ROAMING_NW_OP_KEY 	INTEGER ,
                  EVENT_START_DT 		DATE ,
                  EVENT_START_TIME 		TIME ,
                  EVENT_DURATION 		INTEGER ,
                  CORE_ACC_CHARGE_AMT 		DECIMAL(10,2) ,
                  CC_NUM 			VARCHAR(21) ,
                  EVENT_TYPE_KEY 		SMALLINT ,
                  CDR_ID_KEY 			VARCHAR(21) ,
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
                  IN FACTSPACE 
				  NOT LOGGED INITIALLY @
				  
-- Create the subscriber_dedicated_account_usage table
CREATE TABLE TE_TEMP.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE  (  
                  CDR_ID_KEY 		VARCHAR(21) ,
                  DED_ACC_KEY 		SMALLINT ,
                  DED_ACC_CHARGE_AMT 	DECIMAL(10,2) , 
                  SUBSCRIBER_MSISDN 	BIGINT ,   
                  SUBSCRIBER_CIRCLE_ID 	SMALLINT ,
                  CC_NUM	 	VARCHAR(21) ,
                  EVENT_START_DT 	DATE ,
                  EVENT_START_TIME 	TIME ,
                  EVENT_DURATION 	INTEGER )
                  IN FACTSPACE 
				  NOT LOGGED INITIALLY @

-- Create subscriber_msisdn_history table
CREATE TABLE TE_TEMP.SUBSCRIBER_MSISDN_HISTORY (  
                  SUBSCRIBER_MSISDN 	BIGINT ,
                  MSISDN_START_DT 	DATE ,
                  CIRCLE_ID 		SMALLINT ,
                  SUBSCRIBER_KEY 	VARCHAR(21) ,
                  MSISDN_END_DT 	DATE ,
                  MSISDN_EFF_TIME 	TIME ,
                  MSISDN_END_TIME 	TIME )
                  IN FACTSPACE 
				  NOT LOGGED INITIALLY @

-- Create Dedicated_account_temp table
CREATE TABLE TE_TEMP.DEDICATED_ACCOUNT_TEMP  ( 
                  DED_ACC_KEY 			SMALLINT ,
                  DED_ACC_EFF_DT 		DATE , 
                  DED_ACC_END_DT 		DATE , 
                  DED_ACC_CONVERSION_FACTOR 	DECIMAL(10,2) , 
                  CIRCLE_ID 			SMALLINT) 
                  IN DIMSPACE 
				  NOT LOGGED INITIALLY @

-- Populate the tables with data
LOAD FROM subscriber_rated_usage.del OF DEL INSERT INTO TE_TEMP.SUBSCRIBER_RATED_USAGE @
LOAD FROM subscriber_dedicated_account_usage.del OF DEL INSERT INTO TE_TEMP.SUBSCRIBER_DEDICATED_ACCOUNT_USAGE @
LOAD FROM subscriber_msisdn_history.del OF DEL INSERT INTO TE_TEMP.SUBSCRIBER_MSISDN_HISTORY @
LOAD FROM dedicated_account_temp.del OF DEL INSERT INTO TE_TEMP.DEDICATED_ACCOUNT_TEMP @	

COMMIT @
UPDATE COMMAND OPTIONS USING c ON @			  