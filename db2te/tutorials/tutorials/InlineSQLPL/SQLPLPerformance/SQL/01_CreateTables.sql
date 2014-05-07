-- Five identical employee_wages tables
-- to test five different ways of calculating
-- taxes
CREATE table ?SCHEMA?.employee_wages_case1
  (
  empno  int,
  salary int,
  taxes  int,
  income generated always as (salary-taxes)
  );

CREATE table ?SCHEMA?.employee_wages_case2
  (
  empno  int,
  salary int,
  taxes  int,
  income generated always as (salary-taxes)
  );

CREATE table ?SCHEMA?.employee_wages_case3
  (
  empno  int,
  salary int,
  taxes  int,
  income generated always as (salary-taxes)
  );

CREATE table ?SCHEMA?.employee_wages_case4
  (
  empno  int,
  salary int,
  taxes  int,
  income generated always as (salary-taxes)
  );

CREATE table ?SCHEMA?.employee_wages_case5
  (
  empno  int,
  salary int,
  taxes  int,
  income generated always as (salary-taxes)
  );

-- Tax rate table
CREATE table ?SCHEMA?.tax_rate
  (
  min_salary  int,
  max_salary  int,
  tax_percent int
  )
  ;
INSERT into ?SCHEMA?.tax_rate values
  (0, 10000, 10),
  (10001, 20000, 15),
  (20001, 50000, 20),
  (50001, 99999, 30);

