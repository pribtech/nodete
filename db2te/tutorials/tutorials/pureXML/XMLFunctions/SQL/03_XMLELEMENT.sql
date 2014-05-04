SELECT e.empno, XML2CLOB(
       XMLELEMENT(NAME "Emp",
       XMLELEMENT(NAME "name", e.firstnme || ' '|| e.lastname),
       XMLELEMENT(NAME "hiredate", e.hiredate)))
       AS "Result" 
FROM ?SCHEMA?.employee e