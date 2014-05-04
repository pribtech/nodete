select tx_item,
       tx_date, 
      (avg(tx_sales) 
          over (order by tx_date rows between 3 preceding and 3 following))
          as smooth_value, 
       tx_sales
from Total_Sales
where tx_date between '2002-03-01' and '2002-03-31'
      and tx_item = 'X22'
order by tx_date