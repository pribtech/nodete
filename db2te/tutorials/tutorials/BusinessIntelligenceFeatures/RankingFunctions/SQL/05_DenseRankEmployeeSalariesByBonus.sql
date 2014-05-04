SELECT lastname, salary, bonus, 
  denserank() over (order by bonus desc) as rank_bonus
  FROM ?SCHEMA?.employee 
  ORDER BY rank_bonus;