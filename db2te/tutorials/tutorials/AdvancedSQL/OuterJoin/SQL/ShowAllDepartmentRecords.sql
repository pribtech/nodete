select deptname, lastname from
  department left outer join employee on
   deptno = workdept;