CREATE TABLE ?SCHEMA?.stocks
             (
                          name  CHAR(3) ,
                                DATE INT,
                          value INT
             );

INSERT
INTO   ?SCHEMA?.stocks
WITH temp1
     (
          nm,
          tx,
          s1
     ) AS
     (
          VALUES
          (
               'DB2',
               1,100
          )
     
     UNION ALL
     
     SELECT 'DB2',
            tx+1,
            s1+
            CASE
                   WHEN rand() >= .5
                   THEN INT(-10*rand())
                   ELSE INT(10 * rand())
            END
     FROM   ?SCHEMA?.temp1
     WHERE  tx < 25
     )
SELECT *
FROM   ?SCHEMA?.temp1;
