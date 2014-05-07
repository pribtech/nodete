select tx_item, count(*) * 10 from store_txs tablesample bernoulli(10)
group by tx_item