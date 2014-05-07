INSERT into SESSION.tax_cal_cgtt(empno, firstnme, lastname, birthdate, bonus, comm, 
salarypa, tax_exempted, deptno) SELECT e.empno, e.firstnme, e.lastname, e.birthdate, e.bonus, e.comm, p.salarypa, p.tax_exempted,p.deptno 
FROM employee AS e, payroll AS p 
WHERE e.empno = p.empid; 

UPDATE payroll SET tax_proof = 50000;
UPDATE payroll SET calculate_tax = 1;
UPDATE SESSION.TAX_CAL_CGTT SET tax_proof = 50000;

CALL initial_tax_compute();

CALL final_tax_compute();

CALL update();

SELECT * FROM SESSION.TAX_CAL_CGTT;
