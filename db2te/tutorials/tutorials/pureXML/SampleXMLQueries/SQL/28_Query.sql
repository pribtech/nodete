SELECT X.NAME, X.PHONE
FROM ?SCHEMA?.XMLCUSTOMER C,
XMLTable('$cu/customerinfo/phone' PASSING C.INFO as "cu"
  COLUMNS 
    "NAME"  CHAR(20)  PATH '../name',
    "PHONE" CHAR(12)  PATH '.'
  ) AS X;
