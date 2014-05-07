CREATE VIEW lucky_fulltime_employee AS 
		SELECT name FROM fulltime_employee WHERE lucky_number=(SELECT MIN(lucky_number) FROM fulltime_employee);

CREATE VIEW fulltime_employee AS 
		SELECT lucky_function(name) lucky_number, name, salary FROM employee WHERE type='full time';

CREATE FUNCTION lucky_function (p_name VARCHAR(30)) RETURNS DECFLOAT
RETURN SELECT sysfun.rand() FROM employee WHERE name=p_name;

CREATE TABLE employee (
			employe_id INTEGER NOT NULL, 
			name VARCHAR(30) NOT NULL, 
			type VARCHAR(10) NOT NULL, 
			salary INTEGER NOT NULL, 
CONSTRAINT pk_name PRIMARY KEY (name));

INSERT INTO employee VALUES
  (1, 'John Smith',   'part time',  10000),
  (2, 'Mark Trent',   'part time',  13000),
  (3, 'Mathew Dell',  'part time',  12500),
  (4, 'Max Lenon',    'full time',  70000),
  (5, 'Ivan Gopen',   'full time',  81500),
  (6, 'Marta James',  'part time',  43600),
  (7, 'Linda Brent',  'full time',  50000),
  (8, 'Steve Denon',  'full time',  110000),
  (9, 'Bereta Adams', 'full time',  90000),
  (10, 'Jenny Smith', 'full time',  55000);
