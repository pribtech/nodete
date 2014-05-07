SELECT e.empno, 
       XMLserialize( 
          CONTENT 
            (
            XMLELEMENT(NAME "Emp", e.firstnme || ' ' || e.lastname)
            )
          as CLOB(1000)
       )
AS "Result" FROM ?SCHEMA?.employee e