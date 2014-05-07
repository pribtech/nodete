create regular tablespace Q1_2002
  managed by automatic storage;

create table Q1_2002
  (
  tx_number  int not null,
  tx_item    char(10) not null,
  tx_quantity int not null,
  tx_date    date not null,
     check (tx_date between '2002-01-01' and '2002-03-31')
  )
  in Q1_2002;