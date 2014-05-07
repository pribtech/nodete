SELECT
		userid as USERID,
		pw_expire_date as PW_EXPIRE_DATE,
		account_status as ACCOUNT_STATUS,
		failed_logins as RUN_END_TIME

	FROM
			DB2AUTH.USERS
				as db2authUsers