SELECT
		adminTaskList.TASKID,
		adminTaskStatus.STATUS,
		adminTaskList.NAME,
		adminTaskList.OWNER,
		adminTaskList.PROCEDURE_SCHEMA,
		adminTaskList.PROCEDURE_NAME,
		adminTaskStatus.RC,
		adminTaskStatus.INVOCATION,
		DATE(adminTaskStatus.BEGIN_TIME) as RUN_DATE,
		TIME(adminTaskStatus.BEGIN_TIME) as RUN_TIME,
		DATE(adminTaskStatus.END_TIME) as RUN_END_DATE,
		TIME(adminTaskStatus.END_TIME) as RUN_END_TIME

	FROM
			SYSTOOLS.ADMIN_TASK_LIST
				as adminTaskList
		LEFT OUTER JOIN
			SYSTOOLS.ADMIN_TASK_STATUS
				as adminTaskStatus
		ON
			adminTaskList.TASKID = adminTaskStatus.TASKID