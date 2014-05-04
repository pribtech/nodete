select quarter(tx_date) as Quarter, sum(tx_quantity)
from FourQuarters
group by quarter(tx_date)