SELECT LASTNAME, SALARY,
   DECODE(INT(SALARY/5000)*5000,
          20000,'Poor',
          25000,'Fair',
          30000,'Average',
          35000,'Good',
          40000,'Excellent',
          'Outstanding'
          ) AS COMPENSATION_LEVEL
  FROM EMPLOYEE
  ORDER BY SALARY