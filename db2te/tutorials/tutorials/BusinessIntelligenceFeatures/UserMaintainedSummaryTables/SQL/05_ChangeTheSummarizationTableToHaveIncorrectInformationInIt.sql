SET CURRENT MAINTAINED TABLE TYPES FOR OPTIMIZATION = NONE;
DELETE FROM ?SCHEMA?.umst_employee;
INSERT into ?SCHEMA?.umst_employee
  SELECT
  *
FROM
 
    (
    SELECT workdept, count(*), 1000, 1000 FROM ?SCHEMA?.employee
    GROUP BY workdept
    ) as T;
SELECT
  *
 FROM ?SCHEMA?.umst_employee;