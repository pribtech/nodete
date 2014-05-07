SELECT e.empno,
       XML2CLOB(XMLELEMENT(NAME "Emp", e.firstnme || ' ' || e.lastname))
AS "Result"
FROM   ?SCHEMA?.employee e
