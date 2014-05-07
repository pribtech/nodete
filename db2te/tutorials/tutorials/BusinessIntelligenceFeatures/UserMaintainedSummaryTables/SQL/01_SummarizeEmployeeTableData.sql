SELECT workdept, count(*) as EmpCount, sum(salary) as TotSalary, sum(bonus) as TotBonus
  FROM ?SCHEMA?.employee
GROUP BY workdept;