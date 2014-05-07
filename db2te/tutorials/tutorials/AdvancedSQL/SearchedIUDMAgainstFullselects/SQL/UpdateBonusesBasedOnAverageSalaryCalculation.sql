update 
  (
  select 
    emp_salary,
    emp_bonus,  
    avg(EMP_salary) over () 
  from EMP_Profile
  )
  AS E(emp_salary,emp_bonus,avg_salary)
  SET 
    EMP_Bonus = avg_salary * 0.10
  WHERE
    EMP_Salary < E.avg_salary;
    
Select * from EMP_Profile;