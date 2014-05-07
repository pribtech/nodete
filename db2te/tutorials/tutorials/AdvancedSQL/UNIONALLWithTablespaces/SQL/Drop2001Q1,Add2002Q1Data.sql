drop tablespace Q1_2001;
drop view FourQuarters;
create view FourQuarters as
  (
  select * from Q1_2002
  union all
  select * from Q2_2001
  union all 
  select * from Q3_2001
  union all
  select * from Q4_2001
  );