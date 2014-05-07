CREATE OR REPLACE FUNCTION lucky_function (p_name VARCHAR(30)) RETURNS DECFLOAT
RETURN SELECT sysfun.rand()*salary FROM employee WHERE name=p_name;

CREATE OR REPLACE VIEW fulltime_employee AS 
	SELECT lucky_function(name) lucky_number, name, salary FROM employee 
	WHERE type='full time' AND salary<=100000;

SELECT * FROM lucky_fulltime_employee;