SELECT   'AVERAGED',
         stocks.date,
         AVG(value) over (ORDER BY DATE rows BETWEEN 3 preceding AND 3 following) AS smooth_cp
FROM     ?SCHEMA?.stocks

UNION ALL

SELECT 'ACTUAL',
       stocks.date,
       stocks.value
FROM   stocks;
