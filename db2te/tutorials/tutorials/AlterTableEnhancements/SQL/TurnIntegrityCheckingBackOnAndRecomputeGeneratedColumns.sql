set integrity for ?SCHEMA?.employee_salary off;

alter table ?SCHEMA?.employee_salary
  alter column pay 
    drop expression
    set  generated always as (salary + 3 * bonus);

set integrity for ?SCHEMA?.employee_salary
  immediate checked force generated;

select * from ?SCHEMA?.employee_salary;