select tx_item, tx_date, tx_sales from Total_Sales
  where month(tx_date) = 3  
  and tx_item = 'X22'
order by tx_date