CREATE table ?SCHEMA?.employee_wages
  (
  empno  int,
  salary int,
  taxes  int,
  -- calculated automatically as the difference between salary and taxes
  income generated always as (salary-taxes)
  );

CREATE table ?SCHEMA?.tax_rate
  (
  min_salary int,
  max_salary int,
  tax_percent int
  );

-- some sample tax rates
INSERT into ?SCHEMA?.tax_rate values
  (0, 10000, 10),
  (10001, 20000, 15),
  (20001, 50000, 20),
  (50001, 99999, 30);
