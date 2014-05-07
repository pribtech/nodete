select XMLELEMENT( NAME "database", XMLATTRIBUTES(
	DB_NAME
	)
	,(select XMLELEMENT(NAME "schemas"
				,XMLAGG(XMLELEMENT(NAME "schema"
						,XMLATTRIBUTES(OWNER as SCHEMANAME)
						) order by OWNER
					))
		from (select distinct owner from dba_objects) s
		)
	) 
from (select'database' db_name from dual)  d