SELECT xmlquery('$i/customerinfo/name' passing c.info AS "i")
FROM   ?SCHEMA?.xmlcustomer c
WHERE  xmlexists('$i/customerinfo[phone = "905-555-7258" and phone/@type = "work"]' passing c.info AS "i") ;
