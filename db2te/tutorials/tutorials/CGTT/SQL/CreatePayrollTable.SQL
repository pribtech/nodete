CREATE TABLE PAYROLL (
     empid          CHARACTER(6) REFERENCES employee(empno),
     salaryPA       DOUBLE,
     tax_payable    DOUBLE,
     tax_exempted   DOUBLE,
     tax_proof      DOUBLE,
     tax_to_be_paid DOUBLE,
     deptno         CHARACTER(3),
     calculate_tax  INT);

INSERT INTO PAYROLL(empid, deptno, salaryPA)
(SELECT empno,workdept, (salary * 12) AS salary FROM employee);

UPDATE PAYROLL SET tax_exempted = 100000;
