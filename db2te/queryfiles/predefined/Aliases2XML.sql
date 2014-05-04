select XMLELEMENT( NAME "aliases"
	,	XMLAGG(XMLELEMENT(NAME "alias"
				,XMLATTRIBUTES(TABSCHEMA as schema,TABNAME as name)
				) order by TABSCHEMA,TABNAME
			)
		)
from (select * from syscat.tables t where type='A')