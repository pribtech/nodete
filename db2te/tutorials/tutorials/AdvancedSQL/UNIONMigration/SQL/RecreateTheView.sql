create view Y2004_2 as
  (
  select * from H1
  union all
  select * from H2 
  )
  with row movement;