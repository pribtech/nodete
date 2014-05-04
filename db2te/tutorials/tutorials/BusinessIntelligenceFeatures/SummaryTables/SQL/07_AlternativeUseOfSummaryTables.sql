SELECT
  store, quarter, item, avg(sales) as "Average"
FROM
 ?SCHEMA?.transactions

  GROUP BY store, quarter, item