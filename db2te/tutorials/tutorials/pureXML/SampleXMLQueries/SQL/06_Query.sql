SELECT c.cid,
       c.info
FROM   ?SCHEMA?.xmlcustomer c
WHERE  xmlexists('$i/customerinfo[name = "Kathy Smith"]' passing c.info AS "i");
