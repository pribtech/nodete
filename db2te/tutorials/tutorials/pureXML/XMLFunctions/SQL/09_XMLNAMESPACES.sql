SELECT emp.empno,
  XMLSERIALIZE(CONTENT
     XMLELEMENT(NAME "employee",
                     XMLNAMESPACES(DEFAULT 'http://hr.org'),
                     emp.lastname,
     XMLELEMENT(NAME "job",
                     XMLNAMESPACES(NO DEFAULT),
                     emp.job,
     XMLELEMENT(NAME "department",
                     XMLNAMESPACES(DEFAULT 'http://adm.org'),
                     emp.workdept)
     )
  )
  AS CLOB)

AS      "Result"
FROM    ?SCHEMA?.employee emp
WHERE   emp.edlevel = 12
