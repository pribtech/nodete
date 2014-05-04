CREATE table ?SCHEMA?.stats(
   x int,
   y int)
   ;
INSERT into ?SCHEMA?.stats
   with ?SCHEMA?.temp1(x) as 
     (
     values (0)
     union all
     SELECT
  x+1
FROM
 ?SCHEMA?.temp1
WHERE x < 10
     )
   SELECT x, 2*x + 5
     FROM ?SCHEMA?.temp1;