CREATE table ?SCHEMA?.sqlpl9 (answer varchar(40)) 
#

begin atomic
  declare counter int default 5;

-- loop label
L1:
  while counter > 0 do
     -- decrease loop counter
     set counter = counter - 1;

     if (counter = 3) then 
     -- continue loop from the start
        ITERATE L1;
     end if;

     INSERT INTO ?SCHEMA?.sqlpl9 VALUES 'Count = ' || char(counter) ;

  end while;
end
#

SELECT * FROM ?SCHEMA?.sqlpl9
#
