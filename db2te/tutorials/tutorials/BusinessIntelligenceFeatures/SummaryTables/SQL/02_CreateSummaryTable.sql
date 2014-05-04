SET current refresh age 0;
CREATE summary TABLE ?SCHEMA?.storesum as (
  SELECT store, quarter, item, sum(sales) as total, count(*) as qty
  FROM ?SCHEMA?.transactions
    GROUP BY store, quarter, item
) 
data initially deferred refresh deferred not logged initially;