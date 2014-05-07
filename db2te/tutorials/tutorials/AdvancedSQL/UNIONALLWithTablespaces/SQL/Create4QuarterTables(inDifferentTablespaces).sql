create table Q1_2001
  (
  tx_number  int not null,
  tx_item    char(10) not null,
  tx_quantity int not null,
  tx_date    date not null,
     check (tx_date between '2001-01-01' and '2001-03-31')
  )
  in Q1_2001;

create table Q2_2001
  (
  tx_number  int not null,
  tx_item    char(10) not null,
  tx_quantity int not null,
  tx_date    date not null,
     check (tx_date between '2001-04-01' and '2001-06-30')
  )
  in Q2_2001;

create table Q3_2001
  (
  tx_number  int not null,
  tx_item    char(10) not null,
  tx_quantity int not null,
  tx_date    date not null,
     check (tx_date between '2001-07-01' and '2001-09-30')
  )
  in Q3_2001;

create table Q4_2001
  (
  tx_number  int not null,
  tx_item    char(10) not null,
  tx_quantity int not null,
  tx_date    date not null,
     check (tx_date between '2001-10-01' and '2001-12-31')
  )
  in Q4_2001;