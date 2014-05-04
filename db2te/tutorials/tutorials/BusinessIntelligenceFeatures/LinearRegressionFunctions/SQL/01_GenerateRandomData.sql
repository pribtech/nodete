CREATE table ?SCHEMA?.xycoords(
   x int,
   y int)
   ;
INSERT into ?SCHEMA?.xycoords
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
   SELECT x, int(rand()*10)
     FROM ?SCHEMA?.temp1;