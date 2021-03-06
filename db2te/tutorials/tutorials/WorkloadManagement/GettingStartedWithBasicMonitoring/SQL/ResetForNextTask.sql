ALTER WORKLOAD SYSDEFAULTUSERWORKLOAD COLLECT ACTIVITY DATA NONE;

ALTER SERVICE CLASS SYSDEFAULTSUBCLASS UNDER SYSDEFAULTUSERCLASS
      COLLECT AGGREGATE ACTIVITY DATA NONE;

SET EVENT MONITOR DB2ACTIVITIES STATE 0;
SET EVENT MONITOR DB2STATISTICS STATE 0;

DELETE FROM ACTIVITY_DB2ACTIVITIES;
DELETE FROM ACTIVITYSTMT_DB2ACTIVITIES;
DELETE FROM SCSTATS_DB2STATISTICS;
DELETE FROM WLSTATS_DB2STATISTICS;

CALL WLM_COLLECT_STATS();