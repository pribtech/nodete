SELECT LASTNAME, SALARY,
       (SELECT AVG(SALARY) FROM EMPLOYEE)
FROM EMPLOYEE
  WHERE
     SALARY >= (SELECT AVG(SALARY) FROM EMPLOYEE)