CREATE TABLE ?SCHEMA?.doctors
             (
                          doc_id        INT NOT NULL,
                          doc_firstname VARCHAR(20) NOT NULL,
                          doc_lastname  VARCHAR(20) NOT NULL,
                          doc_extension INT NOT NULL
             ) ;

INSERT
INTO   ?SCHEMA?.doctors VALUES
       (
              1       ,
              'George',
              'Martin',
              1234
       )
       ,
       (
              2           ,
              'Fred'      ,
              'Flintstone',
              2345
       )
       ,
       (
              3       ,
              'Barney',
              'Rubble',
              3456
       )
       ,
       (
              4            ,
              'Wilma'      ,
              'Rockefeller',
              9876
       );


CREATE TABLE ?SCHEMA?.patients
             (
                          pat_id        INT NOT NULL,
                          doc_id        INT NOT NULL,
                          pat_firstname VARCHAR(20) NOT NULL,
                          pat_lastname  VARCHAR(20) NOT NULL,
                          pat_room      INT NOT NULL
             ) ;

INSERT
INTO   ?SCHEMA?.patients VALUES
       (
              1      ,
              1      ,
              'Betty',
              'White',
              100
       )
       ,
       (
              2      ,
              2      ,
              'John' ,
              'Wayne',
              200
       )
       ,
       (
              3      ,
              3      ,
              'Brad' ,
              'Homes',
              202
       )
       ,
       (
              4       ,
              4       ,
              'Arthur',
              'Lismer',
              300
       )
       ,
       (
              5       ,
              2       ,
              'Lauren',
              'Harris',
              204
       )
       ,
       (
              6         ,
              3         ,
              'Tom'     ,
              'Thompson',
              205
       )
       ,
       (
              7      ,
              4      ,
              'Emily',
              'Carr' ,
              306
       )
       ,
       (
              8           ,
              1           ,
              'Frank'     ,
              'Carmichael',
              402
       );
