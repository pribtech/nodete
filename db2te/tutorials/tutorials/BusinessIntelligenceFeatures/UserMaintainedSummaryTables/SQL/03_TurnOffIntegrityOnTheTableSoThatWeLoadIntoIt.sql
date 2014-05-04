SET integrity for ?SCHEMA?.umst_employee all immediate unchecked;

SET CURRENT MAINTAINED TABLE TYPES FOR OPTIMIZATION = NONE;

INSERT into ?SCHEMA?.umst_employee
  SELECT
  *
FROM
 
    (
    SELECT workdept, count(*), sum(salary), sum(bonus) FROM ?SCHEMA?.employee
    GROUP BY workdept
    ) as "?SCHEMA?.T";