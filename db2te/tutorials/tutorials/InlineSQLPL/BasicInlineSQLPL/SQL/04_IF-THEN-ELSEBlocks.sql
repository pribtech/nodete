CREATE table ?SCHEMA?.sqlpl4 (answer varchar(40)) 
#

begin atomic

  -- declare q1 to be equal to 1
  declare q1 int default 1;

  -- if q1 is one
  IF (q1 = 1) then
     INSERT INTO ?SCHEMA?.sqlpl4 VALUES 'q1 equals 1' ; 
  -- if not
  ELSE
     INSERT INTO ?SCHEMA?.sqlpl4 VALUES 'q1 is not equal to 1' ;
  --endif
  END IF;
end
#

SELECT * FROM ?SCHEMA?.sqlpl4
#
