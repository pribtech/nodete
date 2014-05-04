CREATE TABLE ?SCHEMA?.sqlpl12 (answer varchar(40)) 
#

INSERT INTO ?SCHEMA?.sqlpl12 VALUES 'A','B','C','D'
#

begin atomic
  declare rowcount int ;
  UPDATE ?SCHEMA?.sqlpl12 SET answer = 'X'  WHERE answer IN ('E','F');
  GET DIAGNOSTICS rowcount = ROW_COUNT;
  
  -- raise error, if no rows were affected
  if (rowcount = 0) then
     SIGNAL SQLSTATE '75000' 
        SET MESSAGE_TEXT = 'No rows updated!';
  end if;
end
#
