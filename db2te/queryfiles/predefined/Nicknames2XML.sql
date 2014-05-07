select XMLELEMENT( NAME "nicknames"
	,	XMLAGG(XMLELEMENT(NAME "nickname"
				,XMLATTRIBUTES(TABSCHEMA as schema,TABNAME as name)
				) order by TABSCHEMA,TABNAME
			)
		)
from (select * from syscat.tables t where type='N')