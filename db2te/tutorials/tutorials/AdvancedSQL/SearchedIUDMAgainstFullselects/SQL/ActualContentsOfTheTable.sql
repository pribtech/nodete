CREATE TABLE PRODUCTS 
  (
  PROD_NO     INT          NOT NULL,
  DESCRIPTION VARCHAR(20),
  QUANTITY    INT          NOT NULL
  )
;

INSERT INTO PRODUCTS
VALUES 
(1,'Pants',10),(2,'Shorts',5),(3,'Shirts',20),(4,'Socks',12),(5,'Ties',5);


SELECT * FROM PRODUCTS;