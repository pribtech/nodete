SELECT   stocks.name,
         stocks.date,
         stocks.value,
         AVG(value) over (ORDER BY DATE rows BETWEEN 3 preceding AND      3 following) AS smooth_value
FROM     ?SCHEMA?.stocks;
