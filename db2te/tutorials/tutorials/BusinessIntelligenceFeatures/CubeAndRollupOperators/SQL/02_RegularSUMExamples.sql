SELECT   store,
         quarter,
         item,
         SUM(sales)
FROM     ?SCHEMA?.transactions
GROUP BY store,
         quarter,
         item;
