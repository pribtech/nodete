declare global temporary table t1 
   like employee
   on commit preserve rows not logged in uspace;
   
insert into session.t1 
   select * from employee where edlevel between 16 and 18;
   
select * from session.t1;