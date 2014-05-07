-- Create table 'dailysales' to store daily sales information.
CREATE TABLE ?SCHEMA?.dailysales (sales_date DATE,
		    sales_person VARCHAR (15),
                    ID INTEGER,
		    region VARCHAR (15),
		    sales INTEGER,
		    margin INTEGER);


-- Insert data into 'dailysales' table
INSERT INTO ?SCHEMA?.dailysales VALUES('01/12/2009', 'Joseph', 101, 'EAST', 5000, 50);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/12/2009', 'Jam', 102, 'West', 4000, 10);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/12/2009', 'Jany', 103, 'north', 3000, 20);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/12/2009', 'Martin', 104, 'south', 2000, 40);

INSERT INTO ?SCHEMA?.dailysales VALUES('01/13/2009', 'Joseph', 101, 'east', 1000, 70);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/13/2009', 'Jam', 102, 'west', 7000, 10);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/13/2009', 'Jany', 103, 'north', 6000,25);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/13/2009', 'Martin', 104, 'south', 5000, 70);

INSERT INTO ?SCHEMA?.dailysales VALUES('01/14/2009', 'Joseph', 101, 'east', 4000, 20);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/14/2009', 'Jam', 102, 'west', 3000, 90);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/14/2009', 'Jany', 103, 'north', 2000, 10);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/14/2009', 'Martin', 104, 'south', 1000, 20);

INSERT INTO ?SCHEMA?.dailysales VALUES('01/15/2009', 'Joseph', 101, 'east', 4000, 20);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/15/2009', 'Jam', 102, 'west', 3000, 90);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/15/2009', 'Jany', 103, 'north', 2000, 10);
INSERT INTO ?SCHEMA?.dailysales VALUES('01/15/2009', 'Martin', 104, 'south', 1000, 20);


-- Grant SECADM authority to Pat to perform security related operations like create roles, grant roles to users.
GRANT SECADM ON DATABASE TO USER pat;

-- Grant CONTROL privilege on 'dailysales' table to Pat
GRANT CONTROL ON ?SCHEMA?.dailysales TO USER pat;