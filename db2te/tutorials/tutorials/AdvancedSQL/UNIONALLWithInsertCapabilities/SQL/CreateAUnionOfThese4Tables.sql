create view txYear as
  (
  select * from Q1
  union all
  select * from Q2 
  union all
  select * from Q3 
  union all
  select * from Q4 
  );