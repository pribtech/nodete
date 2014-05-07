with dinfo (deptno, deptname) as
  (select deptno, deptname from department
   where admrdept = 'A00'
   union all
   select d.deptno, d.deptname from  department d,  dinfo e
   where d.admrdept = e.deptno and
         d.deptno <> e.deptno
  )
select distinct deptno, deptname from dinfo
  order by deptno;