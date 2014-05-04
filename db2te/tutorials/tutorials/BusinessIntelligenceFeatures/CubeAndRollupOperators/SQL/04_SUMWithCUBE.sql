SELECT   store,
         quarter,
         item,
         SUM(sales)
FROM     ?SCHEMA?.transactions
GROUP BY CUBE(store, quarter, item)
