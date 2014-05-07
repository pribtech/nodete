DECLARE GLOBAL TEMPORARY TABLE SESSION.tax_cal_dgtt AS 
  (SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, 
          p.salarypa, 
          p.tax_payable, p.tax_exempted,  p.tax_proof, p.tax_to_be_paid,p.deptno 
     FROM employee AS e, payroll AS p 
   WHERE e.empno = p.empid) 
   DEFINITION ONLY ON COMMIT PRESERVE ROWS; 

CREATE INDEX SESSION.indexOnId ON SESSION.tax_cal_dgtt(empno) ALLOW REVERSE SCANS;

insert into SESSION.tax_cal_dgtt(empno, firstnme, lastname, birthdate, bonus, comm, 
          salarypa, tax_exempted, deptno) SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, p.salarypa, p.tax_exempted,p.deptno 
     FROM employee AS e, payroll AS p 
   WHERE e.empno = p.empid;

SELECT * FROM SESSION.tax_cal_dgtt;