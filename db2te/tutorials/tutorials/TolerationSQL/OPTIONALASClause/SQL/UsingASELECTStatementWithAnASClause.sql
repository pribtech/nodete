SELECT LASTNAME, SALARY,
       (SELECT AVG(SALARY) FROM EMPLOYEE) AS AVG_SALARY
FROM EMPLOYEE
  WHERE
     SALARY >= (SELECT AVG(SALARY) FROM EMPLOYEE)