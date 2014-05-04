SELECT XML2CLOB(XMLELEMENT(NAME "Department",
                XMLATTRIBUTES(e.workdept AS "name"),
                XMLAGG(XMLELEMENT(NAME "emp", e.lastname)
                ORDER BY e.lastname
               )
              )) AS "dept_list"
FROM ?SCHEMA?.employee e
GROUP BY workdept
