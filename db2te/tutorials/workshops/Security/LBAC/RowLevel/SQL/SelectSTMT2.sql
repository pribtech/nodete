SELECT sales_date, sales_person, region, sales, margin, 
       varchar(SECLABEL_TO_CHAR('SEC_POLICY',secLabel_region), 30) 
FROM ?SCHEMA?.dailysales;
