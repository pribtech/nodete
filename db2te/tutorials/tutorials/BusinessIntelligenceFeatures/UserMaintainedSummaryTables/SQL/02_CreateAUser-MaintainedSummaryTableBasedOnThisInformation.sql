CREATE SUMMARY TABLE ?SCHEMA?.umst_employee AS
  (
  SELECT 
    workdept,
    count(*) as EmpCount,
    SUM(salary) AS Totsalary,
    SUM(bonus) AS TotBonus
  FROM ?SCHEMA?.employee GROUP BY workdept
  )
  DATA INITIALLY DEFERRED REFRESH DEFERRED
  MAINTAINED BY USER
  ;