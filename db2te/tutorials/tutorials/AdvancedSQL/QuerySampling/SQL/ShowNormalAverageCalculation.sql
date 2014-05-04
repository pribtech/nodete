select tx_item, avg(tx_quantity) from store_txs
group by tx_item