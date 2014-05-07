-- create a table
CREATE table ?SCHEMA?.sqlpl1 (answer varchar(40)) 
#

-- SQL PL
begin atomic

  -- declare different variables
  DECLARE dept integer default 10000;
  DECLARE today date default current date;
  DECLARE watch time default current time;
  DECLARE name char(10) default 'George';
  DECLARE salary dec(10,2) default 34000.34;
  DECLARE rating float default 1e10;

  -- and insert them in the table
  INSERT into ?SCHEMA?.sqlpl1 values
     'DEPT   = ' || char(dept), 
     'TODAY  = ' || char(today), 
     'WATCH  = ' || char(watch), 
     'NAME   = ' || char(name), 
     'SALARY = ' || char(salary), 
     'RATING = ' || char(rating);
end
#

-- select from the table to see the results
SELECT
  *
FROM
 ?SCHEMA?.sqlpl1
#
