CREATE table ?SCHEMA?.sqlpl6 (answer varchar(40)) 
#

begin atomic
  -- declare q1 and q2 to be 1 and 2
  declare q1 int default 1;
  declare q2 int default 2;

  -- check all possible combinations of these variables
  if (q1 = 1 and q2 = 1) then
     INSERT INTO ?SCHEMA?.sqlpl6 VALUES 'q1 = 1 AND q2 = 1' ; 
  elseif (q1 = 2 and q2 = 2) then
     INSERT INTO ?SCHEMA?.sqlpl6 VALUES 'q1 = 2 AND q2 = 2' ; 
  elseif (q1 = 2 and q2 = 1) then
     INSERT INTO ?SCHEMA?.sqlpl6 VALUES 'q1 = 2 AND q2 = 1' ; 
  else
     INSERT INTO ?SCHEMA?.sqlpl6 VALUES 'q1 = 1 AND q2 = 2' ;
  end if;
end
#

SELECT * FROM ?SCHEMA?.sqlpl6
#
