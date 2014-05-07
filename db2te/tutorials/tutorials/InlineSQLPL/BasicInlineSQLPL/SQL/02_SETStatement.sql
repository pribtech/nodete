CREATE table ?SCHEMA?.sqlpl2 (answer varchar(40)) 
#

begin atomic
  -- declare some variables
  declare hours dec(11,2);
  declare rate  dec(11,2);
  declare wages dec(11,2);
  declare taxrate dec(11,2);
  
  -- assign new values
  SET taxrate = .30;
  SET hours = 40.0;
  SET rate = 12.25;
  
  -- calculate wages
  SET wages = (hours * rate) * (1.0 - taxrate);

  -- store variables in the table
  INSERT INTO ?SCHEMA?.sqlpl2 VALUES
                                        char(hours),
                                        char(rate),
                                        char(taxrate),
                                        char(wages);
end
#

-- select results
SELECT * FROM ?SCHEMA?.sqlpl2
#
