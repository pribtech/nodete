
/* To enable Administrative Task Scheduler */

db2set DB2_ATS_ENABLE=1
db2stop force
db2start
