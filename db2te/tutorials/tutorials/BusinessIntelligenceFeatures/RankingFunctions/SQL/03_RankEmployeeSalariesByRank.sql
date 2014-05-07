SELECT lastname, salary, bonus, 
  rank() over (order by salary desc) as rank_salary
  FROM ?SCHEMA?.employee 
  ORDER BY rank_salary