CREATE TABLE ?SCHEMA?.sqlpl11 (answer varchar(40)) 
#

INSERT INTO ?SCHEMA?.sqlpl11 values 'A','B','C','D'
#

begin atomic
  declare rowcount int ;
  UPDATE ?SCHEMA?.sqlpl11 SET answer = 'X' 
     WHERE answer IN ('A','C');
  
  -- get affected rows number
  GET DIAGNOSTICS rowcount = ROW_COUNT;
  INSERT INTO ?SCHEMA?.sqlpl11 VALUES 'Rows changed = ' || char(rowcount);

end
#

SELECT * FROM ?SCHEMA?.sqlpl11
#
