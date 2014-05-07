SELECT X.*
  FROM ?SCHEMA?.XMLCUSTOMER C,
     XMLTable('$cu/customerinfo' PASSING C.INFO as "cu"
       COLUMNS 
         "NAME"   CHAR(20) PATH 'name',
         "STREET" CHAR(20) PATH 'addr/street',
         "CITY"   CHAR(20) PATH 'addr/city'
  ) AS X;
