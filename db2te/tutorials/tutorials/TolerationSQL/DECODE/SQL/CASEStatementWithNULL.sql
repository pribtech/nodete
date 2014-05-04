SELECT DATA, 
       CASE DATA
         WHEN 1 THEN 'ONE'
         WHEN 2 THEN 'TWO'
         WHEN 3 THEN 'THREE'
         WHEN CAST(NULL AS INT) THEN 'NULL'
         ELSE 'Not found'
       END AS NUM_TO_CHAR
FROM CASENULL