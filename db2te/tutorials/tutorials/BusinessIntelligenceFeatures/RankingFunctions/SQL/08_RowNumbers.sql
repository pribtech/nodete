SELECT rownumber() over (order by workdept,lastname) as number,
   lastname, salary FROM ?SCHEMA?.employee
   ORDER BY workdept,lastname;