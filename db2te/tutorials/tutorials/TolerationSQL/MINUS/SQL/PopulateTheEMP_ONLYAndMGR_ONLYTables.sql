INSERT INTO EMP_ONLY 
  SELECT EMPNO, LASTNAME, SALARY FROM EMPLOYEE 
    WHERE SALARY > 60000;

INSERT INTO MGR_ONLY 
  SELECT EMPNO, LASTNAME, SALARY FROM EMPLOYEE 
    WHERE JOB='MANAGER';