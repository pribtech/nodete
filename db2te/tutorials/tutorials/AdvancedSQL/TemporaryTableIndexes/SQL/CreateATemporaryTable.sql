declare global temporary table t1 
   like employee
   on commit preserve rows not logged in uspace;

insert into session.t1 
   select * from employee;
   
select * from session.T1
  where workdept='D11';
  
create index session.t1index on session.t1(workdept);

select * from session.T1
  where workdept='D11';