SELECT
		tabschema,
		tabname,
		dtype,
		owner,
		ownertype,
		tabauth,
		bschema,
		bname,
		btype
	FROM
		SYSCAT.TABDEP
	WHERE
		bschema = 'DEMOADM'
			and
		bname = 'DEPT'
