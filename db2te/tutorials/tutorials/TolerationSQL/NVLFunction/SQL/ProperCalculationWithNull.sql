SELECT EMPNO, 
       SALARY,
       NVL(SALARY / 10, 0) + 1000 AS "BONUS"
  FROM TEMP_EMP