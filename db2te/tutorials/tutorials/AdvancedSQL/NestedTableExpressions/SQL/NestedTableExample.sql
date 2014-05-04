with avg_dept_tbl(workdept, avg_sal)
  as (
     select workdept, avg(salary)
       from employee
       group by workdept
     )
select dec(avg(avg_sal),15,2) from avg_dept_tbl