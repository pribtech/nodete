-- creating a trigger
CREATE TRIGGER ?SCHEMA?.check_taxes
  no cascade before
  -- that fires every time INSERT is issued for employe_wages
  INSERT on ?SCHEMA?.employee_wages 
  -- new record will live in new_record variable
  referencing new as new_record
  -- for each affected row
  for each row mode db2sql
  begin atomic
    declare tax_rate int default 0;

    -- sanity check, salary must be greater than 0    
    if (new_record.salary <= 0) then
       signal sqlstate '75000' ('Invalid salary');
    end if;

    -- pick the appropriate tax rate from tax_rates
    SET tax_rate = (SELECT tax_percent FROM ?SCHEMA?.tax_rate
                     WHERE new_record.salary >= min_salary
                     AND new_record.salary <= max_salary);

    -- calculate and update tax amount
    SET new_record.taxes = (new_record.salary / 100) * tax_rate;
  end
#
