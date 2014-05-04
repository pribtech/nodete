CREATE TABLE TAX_CAL_STATIC (
    empno           CHAR(6), 
    firstnme        VARCHAR(12), 
    lastname        VARCHAR(15),
    birthdate       DATE,
    bonus           DECIMAL(9,2),
    comm            DECIMAL(9,2),
    salaryPA        DOUBLE,
    tax_payable     DOUBLE,
    tax_exempted    DOUBLE,
    tax_proof       DOUBLE,
    tax_to_be_paid  DOUBLE,
    deptno          CHARACTER(3));

CREATE INDEX indexOnId ON TAX_CAL_STATIC(empno) ALLOW REVERSE SCANS;

INSERT INTO TAX_CAL_STATIC
		   (empno,firstnme, lastname, birthdate, bonus, comm, 
		   salarypa, tax_payable, tax_exempted, tax_proof, tax_to_be_paid, deptno)
	(SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, 
          p.salarypa, 
          p.tax_payable, p.tax_exempted,  p.tax_proof, p.tax_to_be_paid,p.deptno 
    FROM employee AS e, payroll AS p 
   	WHERE e.empno = p.empid); 

SELECT * FROM TAX_CAL_STATIC;
