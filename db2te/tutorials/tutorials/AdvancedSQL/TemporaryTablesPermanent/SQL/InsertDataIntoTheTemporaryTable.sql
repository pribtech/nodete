insert into rich
  select * from employee where
     salary+bonus+comm > 
     (select avg(salary+bonus+comm) from employee);
select lastname,salary+bonus+comm as pay from rich;