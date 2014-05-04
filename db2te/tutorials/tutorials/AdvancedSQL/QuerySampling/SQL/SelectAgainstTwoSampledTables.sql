with tx1(item, avg_sales) as
  (
  select tx_item, avg(tx_quantity) from
     store_txs tablesample system(10)
  group by tx_item
  ),
tx2(item, avg_sales) as
  (
  select tx_item, avg(tx_quantity) from
     store_txs_dup tablesample bernoulli(10)
  group by tx_item
  )
select tx1.item, tx1.avg_sales, tx2.avg_sales from
  tx1, tx2
where 
  tx1.avg_sales > tx2.avg_sales and
 tx1.item = tx2.item
order by tx1.item