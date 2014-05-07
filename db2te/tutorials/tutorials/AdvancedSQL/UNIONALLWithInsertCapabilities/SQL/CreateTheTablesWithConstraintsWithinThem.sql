create table Q1
  (
  tx     int not null,
  txdate int not null constraint Q1 check (txdate between 1 and 3)
  )
;
create table Q2
  (
  tx     int not null,
  txdate int not null constraint Q2 check (txdate between 4 and 6)
  )
;
create table Q3
  (
  tx     int not null,
  txdate int not null constraint Q3 check (txdate between 7 and 9)
  )
;
create table Q4
  (
  tx     int not null,
  txdate int not null constraint Q4 check (txdate between 10 and 12)
  )
;