SELECT empno, lastname, firstnme, total_salary, rank_salary
  FROM 
    (
    SELECT empno, lastname, firstnme, salary+bonus as total_salary,
      rank() over (order by salary+bonus desc) as rank_salary
    FROM ?SCHEMA?.employee) 
    as ranked_employee
  WHERE rank_salary < 6
  ORDER BY rank_salary;