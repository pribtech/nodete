create table store_txs_dup like store_txs
;

insert into store_txs_dup 
   select * from store_txs tablesample bernoulli(10);