-- Create a table for showcasing detach and delete			
CREATE TABLE SUBSCRIBER_RATED_USAGE_DET  (
                  OUT_ROAMING_IND               SMALLINT ,
                  OUT_ROAMING_NW_OP_KEY         INTEGER ,
                  EVENT_START_DT                DATE ,
                  EVENT_START_TIME              TIME ,
                  EVENT_DURATION                INTEGER ,
                  CORE_ACC_CHARGE_AMT   DECIMAL(10,2) ,
                  CC_NUM                        VARCHAR(21) ,
                  EVENT_TYPE_KEY                SMALLINT ,
                  CDR_ID_KEY                    VARCHAR(75) ,
                  EVENT_TYPE_CLSF_KEY   SMALLINT ,
                  SUBSCRIBER_CIRCLE_ID  SMALLINT ,
                  SUBSCRIBER_MSISDN     BIGINT ,
                  CALL_PULSE_30                 INTEGER ,
                  CALL_PULSE_60                 INTEGER ,
                  FORWARD_TO_NUM                BIGINT ,
                  FIRST_CELLSITE                VARCHAR(21) ,
                  SOURCE_DESTINATION_NW_OP_KEY  INTEGER ,
                  EVENT_DIR                     SMALLINT ,
                  TRF_PLAN_KEY          VARCHAR(21) )
                  DISTRIBUTE BY HASH(SUBSCRIBER_MSISDN)
                    PARTITION BY RANGE(EVENT_START_DT)
                      (PART PART0 STARTING '2009-02-01' ENDING '2009-02-28' IN RP0 ,
                       PART PART1 STARTING '2009-03-01' ENDING '2009-03-31' IN RP1 ,
                       PART PART2 STARTING '2009-04-01' ENDING '2009-04-30' IN RP2 ,
                       PART PART3 STARTING '2009-05-01' ENDING '2009-05-31' IN RP3 ,
                       PART PART4 STARTING '2009-06-01' ENDING '2009-06-30' IN RP4 )
                  NOT LOGGED INITIALLY ;


INSERT INTO ?SCHEMA?.SUBSCRIBER_RATED_USAGE_DET (SELECT * FROM TE_TEMP.SUBSCRIBER_RATED_USAGE) ;
