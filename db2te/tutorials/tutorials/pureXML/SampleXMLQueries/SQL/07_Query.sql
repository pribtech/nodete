SELECT xmlquery('$i/customerinfo/name ' passing c.info AS "i")
FROM   ?SCHEMA?.xmlcustomer c
WHERE  c.cid = 1002;
