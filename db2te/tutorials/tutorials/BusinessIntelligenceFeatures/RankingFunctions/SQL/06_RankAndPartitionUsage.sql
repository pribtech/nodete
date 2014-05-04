SELECT workdept, lastname, salary,
  rank() over (partition by workdept ORDER BY salary desc) as rank_salary
  FROM ?SCHEMA?.employee
  ORDER BY workdept, rank_salary;