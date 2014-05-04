create view FourQuarters as
  (
  select * from Q1_2001
  union all
  select * from Q2_2001
  union all 
  select * from Q3_2001
  union all
  select * from Q4_2001
  );
select * from FourQuarters where tx_item='S15';