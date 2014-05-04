DELETE FROM activity_db2activities;
DELETE FROM activitystmt_db2activities;
DELETE FROM activityvals_db2activities;
CALL wlm_collect_stats();