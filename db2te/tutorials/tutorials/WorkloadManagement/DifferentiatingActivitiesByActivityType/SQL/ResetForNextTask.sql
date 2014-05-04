SET EVENT MONITOR DB2ACTIVITIES STATE 0;
DROP THRESHOLD stop_large_activities;
DROP WORK ACTION SET sc_was;

DELETE FROM activity_db2activities;
DELETE FROM activitystmt_db2activities;
DELETE from activityvals_db2activities;

ALTER WORKLOAD work1_wl DISABLE;
ALTER WORKLOAD work2_wl DISABLE;
ALTER WORKLOAD work3_wl DISABLE;
ALTER WORKLOAD workth_wl DISABLE;

CALL wlm_collect_stats()