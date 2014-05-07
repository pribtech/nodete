SELECT DATA,
       DECODE(DATA,
              1,'ONE',
              2,'TWO',
              3,'THREE',
              CAST(NULL AS INT),'NULL',
              'Not found'
              ) as NUM_TO_CHAR
FROM CASENULL;