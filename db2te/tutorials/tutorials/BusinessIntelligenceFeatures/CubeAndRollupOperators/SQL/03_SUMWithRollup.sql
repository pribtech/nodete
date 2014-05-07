SELECT   store,
         quarter,
         item,
         SUM(sales)
FROM     ?SCHEMA?.transactions
GROUP BY ROLLUP(store, quarter, item)
