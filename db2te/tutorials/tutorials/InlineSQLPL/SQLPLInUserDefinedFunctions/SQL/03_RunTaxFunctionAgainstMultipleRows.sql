INSERT into ?SCHEMA?.employee_wages(empno, salary, taxes) values
  (1,10000,?SCHEMA?.tax_payment(10000)),
  (2,20000,?SCHEMA?.tax_payment(20000)),
  (3,30000,?SCHEMA?.tax_payment(30000)),
  (4,40000,?SCHEMA?.tax_payment(40000)),
  (5,50000,?SCHEMA?.tax_payment(50000));