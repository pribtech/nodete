-- Left Outer Join operation

SELECT p.product_name, p.selling_price, i.cost_price
  FROM ?SCHEMA?.product_c p LEFT OUTER JOIN ?SCHEMA?.inventory_c i
  ON p.product_ID = i.product_ID;


-- Right Outer Join operation

SELECT p.product_name, p.selling_price, i.cost_price
  FROM ?SCHEMA?.product_c p RIGHT OUTER JOIN ?SCHEMA?.inventory_c i
  ON p.product_ID = i.product_ID;

-- Full Outer Join operation

SELECT p.product_name, p.selling_price, i.cost_price
  FROM ?SCHEMA?.product_c p FULL OUTER JOIN ?SCHEMA?.inventory_c i
  ON p.product_ID = i.product_ID;
