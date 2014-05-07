delete from (
  select * from EMP_Profile
    where EMP_Name like '%a%'
    fetch first row only);
    
Select * from EMP_Profile;