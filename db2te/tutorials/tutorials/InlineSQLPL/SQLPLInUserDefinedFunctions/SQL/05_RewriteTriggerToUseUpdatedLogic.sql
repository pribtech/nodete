CREATE TRIGGER ?SCHEMA?.check_taxes
  no cascade before
  INSERT on ?SCHEMA?.employee_wages referencing new as new_record
  for each row mode db2sql
  begin atomic
    SET new_record.taxes = ?SCHEMA?.tax_payment(new_record.salary);
  end
#
