SELECT ACTIVITY_ID,
                SUBSTR(ACTIVITY_TYPE, 1, 8) AS ACTIVITY_TYPE,
                VARCHAR(APPL_ID, 30) AS APPL_ID,
                VARCHAR(APPL_NAME, 10) AS APPL_NAME
FROM ACTIVITY_DB2ACTIVITIES