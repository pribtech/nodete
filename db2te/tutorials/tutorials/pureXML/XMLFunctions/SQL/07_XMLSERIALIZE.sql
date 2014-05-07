SELECT e.empno, 
       XMLserialize( 
          CONTENT 
            (
            XMLELEMENT(NAME "Emp", e.firstnme || ' ' || e.lastname)
            )
          as varchar(100)
       )
AS "Result" FROM ?SCHEMA?.employee e