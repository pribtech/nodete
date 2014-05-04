/*
Try to create the SYSTOOLS schema in case it does not exist 
*/
CREATE SCHEMA SYSTOOLS;

/*
Create a empty task that will not run so that the Administrative Task Scheduler views are created
*/
CALL SYSPROC.ADMIN_TASK_ADD(
	'TempJob', 
	NULL, 
	NULL, 
	0, 
	NULL, 
	'SQLJ', 
	'REFESH_CLASSES', 
	NULL, 
	NULL, 
	NULL
);