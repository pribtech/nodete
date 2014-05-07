select tx_item, count(*) from store_txs tablesample bernoulli(10)
group by tx_item