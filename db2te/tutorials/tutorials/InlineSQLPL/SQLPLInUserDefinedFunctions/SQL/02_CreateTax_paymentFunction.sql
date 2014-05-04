-- create tax_payment(int) function that returns an int
CREATE FUNCTION ?SCHEMA?.tax_payment(salary int) returns int
  language sql reads sql data

  begin atomic
    declare taxes int default 0;
    declare tax_rate int default 0;

    -- sanity check, salary must be greater than 0    
    if (salary <= 0) then
       signal sqlstate '75000' SET message_text = 'Bad salary';
    end if;

    -- pick the appropriate tax rate from tax_rates
    SET tax_rate = (SELECT tax_percent FROM ?SCHEMA?.tax_rate
                     WHERE salary >= min_salary
                     AND salary <= max_salary);

    -- calculate and update tax amount
    SET taxes = (salary / 100) * tax_rate;

    -- return taxes for this salary
    return taxes;
  end
#
