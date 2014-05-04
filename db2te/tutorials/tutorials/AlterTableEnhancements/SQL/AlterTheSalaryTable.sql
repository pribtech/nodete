alter table ?SCHEMA?.employee_salary
  alter column pay 
    drop expression
    set  generated always as (salary + 2 * bonus);
set integrity for ?SCHEMA?.employee_salary 
  generated column immediate unchecked;
insert into ?SCHEMA?.employee_salary(empno, salary, bonus) 
  values
    (3,10000,1000),
    (4,20000,5000);

select * from ?SCHEMA?.employee_salary;