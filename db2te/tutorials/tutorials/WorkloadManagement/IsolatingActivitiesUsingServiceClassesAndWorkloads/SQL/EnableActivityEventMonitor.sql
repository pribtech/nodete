SET EVENT MONITOR DB2ACTIVITIES STATE 0;
DROP EVENT MONITOR DB2ACTIVITIES;
CREATE EVENT MONITOR DB2ACTIVITIES FOR ACTIVITIES WRITE TO TABLE;

SET EVENT MONITOR DB2ACTIVITIES STATE 1;