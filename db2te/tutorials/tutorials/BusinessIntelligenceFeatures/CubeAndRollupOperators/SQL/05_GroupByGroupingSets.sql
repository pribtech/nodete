SELECT   store,
         quarter,
         item,
         SUM(sales)
FROM     ?SCHEMA?.transactions
GROUP BY grouping sets ((store,quarter), (store,item), (item), ())
