CREATE TABLE ?SCHEMA?.T1( c1 INT )  
PARTITION BY RANGE(c1)
  (
  STARTING FROM (1) ENDING(34),
                    ENDING(67),
                    ENDING(100)
  ) ;
