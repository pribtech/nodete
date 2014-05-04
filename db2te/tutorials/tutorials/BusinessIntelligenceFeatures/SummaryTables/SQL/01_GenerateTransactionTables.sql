CREATE table ?SCHEMA?.transactions (
   store     char(10) not null,
   quarter   char(2)  not null,
   item      char(10) not null,
   sales     int      not null)
;
INSERT into ?SCHEMA?.transactions
   with ?SCHEMA?.temp1(s1,s2,s3,s4,tx) as 
     (
     values (rand(),rand(),rand(),rand(),1)
     union all
     SELECT
  rand(),rand(),rand(),rand(),tx+1
FROM
 ?SCHEMA?.temp1

       WHERE tx  < 10000     )
   SELECT
      case
        when int(s1*5) = 0 then 'New York'
        when int(s1*5) = 1 then 'ROCKWOOD'
        when int(s1*5) = 2 then 'Sudney'
        when int(s1*5) = 3 then 'Berlin'
        else                    'Sydney'
      end,
      case
        when int(s2*4) = 0 then 'Q1'
        when int(s2*4) = 1 then 'Q2'
        when int(s2*4) = 2 then 'Q3'
        else                    'Q4'
      end,
      case
        when int(s3*4) = 0 then 'Java'
        when int(s3*4) = 1 then 'Mocha'
        when int(s3*4) = 2 then 'Columbian'
        else                    'Kona'
      end,
      int(s4*1000)
      FROM ?SCHEMA?.temp1;