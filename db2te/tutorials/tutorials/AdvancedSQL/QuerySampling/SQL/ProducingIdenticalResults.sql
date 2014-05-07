select tx_item, avg(tx_quantity) from store_txs tablesample system(10) repeatable(5)
group by tx_item