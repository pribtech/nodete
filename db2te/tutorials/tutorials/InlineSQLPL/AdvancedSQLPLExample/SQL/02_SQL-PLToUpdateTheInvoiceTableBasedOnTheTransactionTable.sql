-- select old values, for comparison
SELECT * FROM ?SCHEMA?.invoice
#

begin atomic
  declare u_items int;
  declare u_total dec(15,2);
  declare u_dateofsale date;

  -- for every record in the transaction table do
  for row as SELECT * FROM ?SCHEMA?.transactions do
    -- if the transaction type is I, insert a new record in the invoice table
    if (row.tx_type = 'I') then
       INSERT INTO ?SCHEMA?.invoice VALUES (row.invoiceno, row.dateofsale, row.items, row.total);

    -- if the transaction type is D, delete matching invoice from the invoice table
    elseif (row.tx_type = 'D') then
       DELETE FROM ?SCHEMA?.invoice WHERE invoice.invoiceno = row.invoiceno;

    -- if the transactino type is U, update non-null values
    else
       -- get current values for this invoice from the invoice table
       SET (u_dateofsale, u_items, u_total) = (SELECT dateofsale, items, total FROM ?SCHEMA?.invoice i WHERE i.invoiceno = row.invoiceno);

       -- if date of sale is not null, update local variable
       if (row.dateofsale is not null) then
            SET u_dateofsale = row.dateofsale;
       end if;

       -- if items is not null, update local variable
       if (row.items is not null) then
          SET u_items = row.items;
       end if;

       -- if total is not null, update local variable
       if (row.total is not null) then
          SET u_total = row.total;
       end if;

       -- update invoice table with new values
       UPDATE ?SCHEMA?.invoice SET
          dateofsale = u_dateofsale,
          items      = u_items,
          total      = u_total
       WHERE
          invoiceno = row.invoiceno;
    end if;
  end for;
end
#

-- select results from the modified invoice table
SELECT * FROM ?SCHEMA?.invoice
#
