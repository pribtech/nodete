SELECT lastname, salary,
  rank() over (order by salary desc) as rank_salary
  FROM ?SCHEMA?.employee 
  ORDER BY lastname;