select XMLELEMENT( NAME "tables"
	,	XMLAGG(XMLELEMENT(NAME "table"
				,XMLATTRIBUTES(TABSCHEMA,TABNAME)
				) order by TABSCHEMA,TABNAME
			)
		)
from (select * from syscat.tables t where type='T')