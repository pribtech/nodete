-- Create a test table to simulate the problem scenario.
CREATE TABLE ?SCHEMA?.Dept_Access ( id           INTEGER,
                                dept         VARCHAR(5),
                                locationCode     VARCHAR(5)                  
);


-- Insert 150000 rows of random data into the test table created above								.
INSERT INTO ?SCHEMA?.Dept_Access 								
					WITH temp(ID) AS ( 
						VALUES(1) 
							UNION ALL
	                    SELECT INT(ID)+1 FROM temp WHERE INT(ID) < 50000)
					SELECT CHAR(ID), int(RAND() * 1000), int(rand()*10) FROM temp;


INSERT INTO ?SCHEMA?.Dept_Access 								
					WITH temp(ID) AS ( 
						VALUES(1) 
							UNION ALL
	                    SELECT INT(ID)+1 FROM temp WHERE INT(ID) < 50000)
					SELECT CHAR(ID), int(RAND() * 1000), int(rand()*10) FROM temp;


INSERT INTO ?SCHEMA?.Dept_Access 								
					WITH temp(ID) AS ( 
						VALUES(1) 
							UNION ALL
	                    SELECT INT(ID)+1 FROM temp WHERE INT(ID) < 50000)
					SELECT CHAR(ID), int(RAND() * 1000), int(rand()*10) FROM temp;



