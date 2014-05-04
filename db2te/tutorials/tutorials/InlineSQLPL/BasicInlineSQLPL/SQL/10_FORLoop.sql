CREATE TABLE ?SCHEMA?.sqlpl10 (answer varchar(40)) 
#

-- insert sample values
INSERT INTO ?SCHEMA?.sqlpl10 VALUES 'A','B','C','D'
#

-- select rows
begin atomic
  declare output varchar(40) default '';
  for row as SELECT answer FROM ?SCHEMA?.sqlpl10 do
      set output = output || row.answer;
  end for;

  -- reinsert values
  INSERT INTO ?SCHEMA?.sqlpl10 values 'All values = ' || output;
end

#
SELECT * FROM ?SCHEMA?.sqlpl10
