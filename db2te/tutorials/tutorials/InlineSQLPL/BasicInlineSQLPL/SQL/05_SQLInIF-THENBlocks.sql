CREATE table ?SCHEMA?.sqlpl5 (answer varchar(40)) 
#

INSERT into ?SCHEMA?.sqlpl5 values 'A','B'
#

begin atomic
  -- if records exist in the table
  if (EXISTS (SELECT * FROM ?SCHEMA?.sqlpl5))
  then
     INSERT INTO ?SCHEMA?.sqlpl5 VALUES 'Records exist IN the SQLPL table' ; 
  else
     INSERT into ?SCHEMA?.sqlpl5 VALUES 'There are no records IN the SQLPL table' ;
  end if;
end
#

SELECT * FROM ?SCHEMA?.sqlpl5
#
