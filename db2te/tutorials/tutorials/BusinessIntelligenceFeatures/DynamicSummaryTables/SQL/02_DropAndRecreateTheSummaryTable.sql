CREATE summary TABLE ?SCHEMA?.storesum AS
( SELECT  store,
         quarter,
         item,
         SUM(sales) AS total,
         COUNT(*)   AS qty
FROM     ?SCHEMA?.transactions
GROUP BY store,
         quarter,
         item
)
data initially deferred refresh immediate NOT logged initially;
refresh TABLE ?SCHEMA?.storesum;

SELECT COUNT(*)
FROM   ?SCHEMA?.storesum;
