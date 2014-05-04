SELECT lastname, edlevel, bonus,
  rank() over (partition by edlevel ORDER BY edlevel,bonus asc) as rank_bonus
  FROM ?SCHEMA?.employee
  ORDER BY edlevel,rank_bonus