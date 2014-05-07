create view Y2004 as
  (
  select * from H1
  union all
  select * from H2 
  );