create table H1
  (
  tx     int not null,
  txdate int not null constraint H1 check (txdate between 1 and 6)
  )
;
create table H2
  (
  tx     int not null,
  txdate int not null constraint H2 check (txdate between 7 and 12)
  )
;