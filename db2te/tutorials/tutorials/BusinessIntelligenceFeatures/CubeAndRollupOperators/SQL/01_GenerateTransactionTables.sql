CREATE TABLE ?SCHEMA?.transactions
             (
                          store   CHAR(10) NOT NULL,
                          quarter CHAR(2) NOT NULL ,
                          item    CHAR(10) NOT NULL,
                          sales   INT NOT NULL
             );

INSERT
INTO   ?SCHEMA?.transactions WITH ?SCHEMA?.temp1
       (
              s1,
              s2,
              s3,
              s4,
              tx
       ) AS
       (
              VALUES
              (
                     rand(),
                     rand(),
                     rand(),
                     rand(),
                     1
              )
       
       UNION ALL
       
       SELECT rand(),
              rand(),
              rand(),
              rand(),
              tx+1
       FROM   ?SCHEMA?.temp1
       WHERE  tx < 10000
       )
SELECT
       CASE
              WHEN INT(s1*5) = 0
              THEN 'New York'
              WHEN INT(s1*5) = 1
              THEN 'ROCKWOOD'
              WHEN INT(s1*5) = 2
              THEN 'Sudney'
              WHEN INT(s1*5) = 3
              THEN 'Berlin'
              ELSE 'Sydney'
       END,
       CASE
              WHEN INT(s2*4) = 0
              THEN 'Q1'
              WHEN INT(s2*4) = 1
              THEN 'Q2'
              WHEN INT(s2*4) = 2
              THEN 'Q3'
              ELSE 'Q4'
       END,
       CASE
              WHEN INT(s3*4) = 0
              THEN 'Java'
              WHEN INT(s3*4) = 1
              THEN 'Mocha'
              WHEN INT(s3*4) = 2
              THEN 'Columbian'
              ELSE 'Kona'
       END,
       INT(s4*1000)
FROM   ?SCHEMA?.temp1;
