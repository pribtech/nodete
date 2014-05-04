CREATE table ?SCHEMA?.empNoMDC
   (
   empno int,
   dept int,
   div int
   )
;
INSERT into empNoMDC SELECT * FROM ?SCHEMA?.tempMDC;
