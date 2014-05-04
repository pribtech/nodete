select tx_item, avg(tx_quantity) from store_txs tablesample system(10)
group by tx_item