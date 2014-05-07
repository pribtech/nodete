create table ?SCHEMA?.employee_salary
  (
  empno     int not null,
  salary    int not null,
  bonus     int not null,
  pay       int generated always as (salary + bonus)
  )
;