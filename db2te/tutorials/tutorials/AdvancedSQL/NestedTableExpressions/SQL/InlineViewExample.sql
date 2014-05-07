select dec(avg(avg_dept_salary),15,2)
  from (
    select workdept, avg(salary) as avg_dept_salary
      from employee
      group by workdept
  ) as avg_dept_tbl