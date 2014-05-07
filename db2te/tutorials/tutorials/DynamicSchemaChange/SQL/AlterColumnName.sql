ALTER TABLE employee RENAME COLUMN employe_id TO employee_id;

ALTER TABLE employee ALTER COLUMN employee_ID SET DATA TYPE SMALLINT;

CALL SYSPROC.ADMIN_CMD('REORG TABLE employee');

SELECT * FROM lucky_fulltime_employee;