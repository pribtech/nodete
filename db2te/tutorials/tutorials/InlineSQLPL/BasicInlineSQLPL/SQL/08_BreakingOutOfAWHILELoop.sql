CREATE table ?SCHEMA?.sqlpl8 (answer varchar(40)) 
#

begin atomic
  declare counter int default 5;

-- loop label
L1:
  while counter > 0 do
    -- decrease the counter
    set counter = counter - 1;

    INSERT INTO ?SCHEMA?.sqlpl8 VALUES 'Count = ' || char(counter) ;

    if (counter = 3) then 
       -- break off this loop
       LEAVE L1;
    end if;
  end while;
end
#

SELECT * FROM ?SCHEMA?.sqlpl8
#
