/* Reusing DGTT - This will fail as DGTTs are not persisted after a session is ended*/
insert into SESSION.tax_cal_dgtt(empno, firstnme, lastname, birthdate, bonus, comm, 
          salarypa, tax_exempted, deptno) SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, p.salarypa, p.tax_exempted,p.deptno 
     FROM employee AS e, payroll AS p 
   WHERE e.empno = p.empid; 
     
SELECT * FROM SESSION.tax_cal_dgtt ORDER BY EMPNO ASC;

/* Reusing CGTT */
insert into SESSION.tax_cal_cgtt(empno, firstnme, lastname, birthdate, bonus, comm, 
          salarypa, tax_exempted, deptno) SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, p.salarypa, p.tax_exempted,p.deptno 
FROM employee AS e, payroll AS p 
WHERE e.empno = p.empid; 
     
SELECT * FROM SESSION.tax_cal_cgtt ORDER BY EMPNO ASC;

/* Reusing Regular Table */
insert into TAX_CAL_STATIC(empno, firstnme, lastname, birthdate, bonus, comm,
          salarypa, tax_exempted, deptno) SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, p.salarypa, p.tax_exempted,p.deptno
FROM employee AS e, payroll AS p
WHERE e.empno = p.empid;

SELECT * FROM TAX_CAL_STATIC ORDER BY EMPNO ASC;
