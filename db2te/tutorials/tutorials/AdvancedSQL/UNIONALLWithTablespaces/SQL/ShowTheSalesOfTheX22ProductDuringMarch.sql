select tx_item, tx_date, tx_sales from Total_Sales
  where tx_date between '2002-03-01' and '2002-03-31' 
  and tx_item = 'X22'
order by tx_date