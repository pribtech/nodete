select * from OLD TABLE
  (update EMP_Profile
   set EMP_salary = EMP_salary * 1.2
   where EMP_salary <= 20000
  );
  
  Select * from EMP_Profile;