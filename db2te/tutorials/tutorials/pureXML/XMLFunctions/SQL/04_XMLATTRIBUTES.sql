SELECT d.deptno, XML2CLOB(
       XMLELEMENT(NAME "Mgr",
       XMLATTRIBUTES(d.mgrno)))
       AS "Result" 
FROM ?SCHEMA?.department d
