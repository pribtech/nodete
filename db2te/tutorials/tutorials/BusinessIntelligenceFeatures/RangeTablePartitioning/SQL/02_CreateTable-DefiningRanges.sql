-- Date ranges partitioning

CREATE TABLE ?SCHEMA?.totalsales ( sale_date DATE, customer INT )   
PARTITION BY RANGE(sale_date)    
  ( 
  STARTING '2000-01-01' ENDING '2000-03-31',
  STARTING '2000-04-01' ENDING '2000-06-30',
  STARTING '2000-07-01' ENDING '2000-09-30',    
  STARTING '2000-10-01' ENDING '2004-12-31'
  );
