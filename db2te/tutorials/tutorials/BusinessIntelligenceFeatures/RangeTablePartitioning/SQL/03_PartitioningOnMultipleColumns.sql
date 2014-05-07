-- Partitioning using multiple columns

DROP TABLE ?SCHEMA?.totalsales;

CREATE TABLE ?SCHEMA?.totalsales ( year INT, month INT )    
PARTITION BY RANGE(year, month)    
  (    
  STARTING (2000,1)  ENDING (2000,3),    
  STARTING (2000,4)  ENDING (2000,6),    
  STARTING (2000,7)  ENDING (2000,9),    
  STARTING (2000,10) ENDING (2000,12),    
  STARTING (2001,1)  ENDING (2001,3)    
  ) ;
