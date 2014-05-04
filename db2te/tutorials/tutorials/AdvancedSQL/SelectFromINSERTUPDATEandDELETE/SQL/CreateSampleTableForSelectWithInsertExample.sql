create table EMP_Profile
  (
  EMP_Name varchar(20),
  EMP_Salary int,
  EMP_Bonus int generated always as (emp_salary / 10)
  )
;