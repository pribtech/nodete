CREATE table ?SCHEMA?.sqlpl3 (answer varchar(40)) 
#

INSERT into ?SCHEMA?.sqlpl3 values 'A','B','C','D'
#

begin atomic
  declare COUNT int;
   
  -- store number of records in sqlpl3 in a variable COUNT
  SET COUNT = (SELECT count(*) FROM ?SCHEMA?.sqlpl3);

  -- insert the answer back in the table
  INSERT into ?SCHEMA?.sqlpl3 values 'Count = ' || char(count) ;
end
#

-- view the results
SELECT * FROM ?SCHEMA?.sqlpl3
#
