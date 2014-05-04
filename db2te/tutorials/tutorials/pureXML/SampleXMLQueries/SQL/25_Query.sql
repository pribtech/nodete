SELECT X.NAME, X.CITY, X.COUNTRY
  FROM ?SCHEMA?.XMLCUSTOMER C,
     XMLTable('$cu/customerinfo' PASSING C.INFO as "cu"
     COLUMNS 
       "NAME"    CHAR(20)  PATH 'name',
       "STREET"  CHAR(20)  PATH 'addr/street',
       "CITY"    CHAR(20)  PATH 'addr/city',
       "COUNTRY" CHAR(20)  PATH 'addr/@country'
  ) AS X
WHERE X.COUNTRY = 'Canada';
