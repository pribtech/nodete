create view Total_Sales(tx_item, tx_date, tx_sales) as
  (
  select tx_item, tx_date, sum(tx_quantity) as tx_sales
    from FourQuarters
  group by tx_item, tx_date
  );