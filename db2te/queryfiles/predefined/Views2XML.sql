select XMLELEMENT( NAME "views"
	,	XMLAGG(XMLELEMENT(NAME "view"
				,XMLATTRIBUTES(TABSCHEMA as schema,TABNAME as name)
				) order by TABSCHEMA,TABNAME
			)
		)
from (select * from syscat.tables t where type='V')