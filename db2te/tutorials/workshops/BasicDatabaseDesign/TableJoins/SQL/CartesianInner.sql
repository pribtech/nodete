-- Cartesian Product Join operation

SELECT * FROM ?SCHEMA?.product_c, ?SCHEMA?.inventory_c;

-- Inner Join operation

SELECT p.product_name, p.selling_price, i.cost_price
  FROM ?SCHEMA?.product_c p INNER JOIN ?SCHEMA?.inventory_c i
  ON p.product_ID = i.product_ID;
