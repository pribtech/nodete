-- Check if database creator is able to access all data from 'credit_card' table.
SELECT * FROM ?SCHEMA?.credit_card;

-- Check if database creator is able to perform update operation on 'credit_card' table.
UPDATE ?SCHEMA?.credit_card 
  SET CARD_NUMBER = 23212322 where ID = 900003;

-- Check if database creator is able to perform insert operation on 'credit_card' table.
INSERT INTO ?SCHEMA?.credit_card 
  VALUES (901000,'Al',137,'2012-02-29','1870730172','Mastero','HDFC',2);


-- Check if database creator is able to perform delete operation on 'credit_card' table.
DELETE FROM ?SCHEMA?.credit_card 
  WHERE card_number = 1870730172;
