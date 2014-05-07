select XMLELEMENT( NAME "table"
	,XMLATTRIBUTES(table_schema as "TABSCHEMA",table_name as "TABNAME")
	,XMLELEMENT(NAME "columns"
		,(	select XMLAGG(
				XMLELEMENT(NAME "column"
					,XMLATTRIBUTES(ordinal_position as "COLNO", column_name AS "COLNAME",data_type as "TYPENAME", character_octet_length as "LENGTH",numeric_precision AS "SCALE",is_nullable as "NULLS")
					) order by c.ordinal_position
				)
			from information_schema.columns c
			where (c.table_schema,c.table_name)=(t.table_schema,t.table_name)
			)
		)
	) 
from information_schema.tables AS T
