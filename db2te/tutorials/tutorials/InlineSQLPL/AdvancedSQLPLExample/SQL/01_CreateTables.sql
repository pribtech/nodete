CREATE TABLE ?SCHEMA?.invoice
  (
  invoiceno   int,
  dateofsale  date,
  items       int,
  total       dec(15,2)
  );

INSERT INTO ?SCHEMA?.invoice VALUES
  (1,'2000-10-05',4,100.45),
  (2,'2000-11-15',8,452.01),
  (3,'2000-12-12',1,768.77),
  (4,'2001-01-17',3,821.32),
  (5,'2000-02-05',5,420.78);

SELECT * FROM ?SCHEMA?.invoice;


CREATE TABLE ?SCHEMA?.transactions
  (
  tx_type char(1),
  invoiceno   int,
  dateofsale  date,
  items       int,
  total       dec(15,2)
  )  ;

INSERT INTO ?SCHEMA?.transactions VALUES
  ('I',6,current date,10,1000.34),
  ('D',4,null,null,null),
  ('U',3,null,2,999.99),
  ('U',5,'2001-03-03',4,345.34);

SELECT * FROM ?SCHEMA?.transactions;
