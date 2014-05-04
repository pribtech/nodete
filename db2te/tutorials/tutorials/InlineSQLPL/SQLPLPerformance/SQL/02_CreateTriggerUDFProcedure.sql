-- 1) SQL PL function
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


-- 2) SQL PL trigger with no external functions used
-- creating a trigger
CREATE TRIGGER ?SCHEMA?.check_taxes_no_external_functions_used
  no cascade before
  -- that fires every time INSERT is issued for employe_wages
  INSERT on ?SCHEMA?.employee_wages_case2
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


-- 3) SQL PL trigger with an external SQL PL function used
CREATE TRIGGER ?SCHEMA?.check_taxes_use_external_function
  no cascade before
  INSERT on ?SCHEMA?.employee_wages_case3 referencing new as new_record
  for each row mode db2sql
  begin atomic
    SET new_record.taxes = ?SCHEMA?.tax_payment(new_record.salary);
  end
#


-- 4) SQL PL stored procedure with no external functions used
CREATE PROCEDURE ?SCHEMA?.check_taxes_no_external_functions_used(employee_id int, employee_salary int)
LANGUAGE SQL Modifies SQL data

p1: begin
    declare tax_paid int default 0;
    declare tax_rate int default 0;

    -- sanity check, salary must be greater than 0    
    if (employee_salary <= 0) then
       signal sqlstate '75000' SET message_text = 'Bad salary';
    end if;

    -- pick the appropriate tax rate from tax_rates
    SET tax_rate = (SELECT tax_percent FROM ?SCHEMA?.tax_rate
                     WHERE employee_salary >= min_salary
                     AND employee_salary <= max_salary);

    -- calculate and update tax amount
    SET tax_paid  = (employee_salary / 100) * tax_rate;

    INSERT INTO ?SCHEMA?.employee_wages_case4(empno, salary, taxes) VALUES (employee_id, employee_salary, tax_paid);
end p1
#

-- 5) SQL PL stored procedure with an external SQL PL functions used
CREATE PROCEDURE ?SCHEMA?.check_taxes_use_external_function(employee_id int, employee_salary int)
LANGUAGE SQL Modifies SQL data
p1: begin
    INSERT INTO ?SCHEMA?.employee_wages_case5(empno, salary, taxes) VALUES (employee_id, employee_salary, ?SCHEMA?.tax_payment(employee_salary));
end p1
#
