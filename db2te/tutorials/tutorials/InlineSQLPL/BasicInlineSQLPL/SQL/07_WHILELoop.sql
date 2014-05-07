CREATE table ?SCHEMA?.sqlpl7 (answer varchar(40)) 
#

begin atomic
  -- loop counter
  declare counter int default 5;

  while counter > 0 DO
    INSERT INTO ?SCHEMA?.sqlpl7 values 'Count = ' || char(counter) ;

    -- decrease the counter
    set counter = counter - 1; 
  end while;
end
#

SELECT * FROM ?SCHEMA?.sqlpl7
#
