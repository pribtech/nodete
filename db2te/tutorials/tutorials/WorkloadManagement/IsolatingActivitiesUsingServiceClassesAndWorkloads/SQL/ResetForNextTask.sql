ALTER WORKLOAD work2_wl
      COLLECT ACTIVITY DATA NONE;

SET EVENT MONITOR DB2ACTIVITIES STATE 0;

DELETE from ACTIVITY_DB2ACTIVITIES;

CALL WLM_COLLECT_STATS();