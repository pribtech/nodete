CREATE FUNCTION tax_compute(salarypa DOUBLE,
                            exempted DOUBLE,awarded_pay DOUBLE)
SPECIFIC common_calculator
RETURNS DOUBLE
NO EXTERNAL ACTION
DETERMINISTIC
BEGIN 
  DECLARE payable_tax DOUBLE;
  SET payable_tax = salarypa - exempted;

  IF payable_tax <= 500000 THEN
    SET payable_tax = payable_tax * 0.10;
  ELSEIF payable_tax > 500000 AND payable_tax <= 1000000 THEN
    SET payable_tax = payable_tax * 0.20;
  ELSEIF payable_tax > 1000000 THEN
    SET payable_tax = payable_tax * 0.30;
  END IF;

  SET payable_tax = payable_tax + (awarded_pay * 0.30);
  RETURN payable_tax;
END@

CREATE  PROCEDURE initial_tax_compute()
SPECIFIC initialTax
LANGUAGE SQL
BEGIN
  DECLARE id CHARACTER(6);
  DECLARE at_end SMALLINT DEFAULT 0;
  DECLARE salary DOUBLE;
  DECLARE payable_tax DOUBLE;
  DECLARE not_found CONDITION for SQLSTATE '02000';

  DECLARE IterateOverEmpRecord CURSOR WITH HOLD FOR SELECT empid,salaryPA FROM payroll;
  DECLARE CONTINUE HANDLER for not_found SET at_end = 1;

  OPEN IterateOverEmpRecord;

  ins_loop: LOOP
    FETCH IterateOverEmpRecord INTO id,salary;

    IF at_end = 1 THEN
      LEAVE ins_loop;
    ELSE

      UPDATE payroll SET tax_payable = tax_compute(salary,100000,0) WHERE empid = id;
      COMMIT;
      ITERATE ins_loop;
    END IF;
  END LOOP;

  CLOSE IterateOverEmpRecord;
END@


CREATE PROCEDURE update()
SPECIFIC updater
LANGUAGE SQL
BEGIN
  DECLARE at_end SMALLINT DEFAULT 0;
  DECLARE id CHARACTER(6);
  DECLARE tax_left DOUBLE;
  DECLARE tax_p DOUBLE;
  DECLARE not_found CONDITION FOR SQLSTATE '02000';

  DECLARE UpdateCGTT CURSOR WITH HOLD FOR
              SELECT empno,tax_to_be_paid,tax_proof 
                 FROM SESSION.tax_cal_cgtt;
  DECLARE UpdatePayroll CURSOR WITH HOLD FOR
              SELECT empno,tax_to_be_paid,tax_payable
                 FROM SESSION.tax_cal_cgtt;
  DECLARE CONTINUE HANDLER for not_found SET at_end = 1;

  OPEN UpdateCGTT;

  up_loop: LOOP
    FETCH UpdateCGTT INTO id,tax_left,tax_p;

    IF at_end = 1 THEN
      LEAVE up_loop;
    ELSE
      UPDATE SESSION.tax_cal_cgtt SET tax_payable = tax_left,
                              tax_to_be_paid = tax_left - tax_p 
                          WHERE empno = id;
      ITERATE up_loop;
    END IF;
  END LOOP;

  CLOSE UpdateCGTT;

  SET at_end = 0;
  OPEN UpdatePayroll;

  update_payroll: LOOP
    FETCH UpdatePayroll INTO id,tax_left,tax_p;

    IF at_end = 1 THEN
      LEAVE update_payroll;
    ELSE
      UPDATE payroll SET tax_payable = tax_p,
                         tax_to_be_paid = tax_left
                     WHERE empid = id;
    ITERATE update_payroll;
    END IF;
  END LOOP;

  CLOSE UpdatePayroll;


END@

CREATE  PROCEDURE final_tax_compute()
SPECIFIC finalTax
LANGUAGE SQL
BEGIN
  DECLARE id CHARACTER(6);
  DECLARE at_end SMALLINT DEFAULT 0;
  DECLARE salary DOUBLE;
  DECLARE exempted DOUBLE;
  DECLARE proof DOUBLE;
  DECLARE awarded_pay DOUBLE;
  DECLARE bonus DOUBLE;
  DECLARE comm DOUBLE;
  DECLARE not_found CONDITION for SQLSTATE '02000';

  DECLARE IterateOverEmpRecord CURSOR WITH HOLD FOR 
          SELECT empno,bonus,comm,salaryPA,tax_exempted,tax_proof FROM SESSION.tax_cal_cgtt;
  DECLARE CONTINUE HANDLER for not_found SET at_end = 1;

  OPEN IterateOverEmpRecord;

  ins_loop: LOOP
    FETCH IterateOverEmpRecord INTO id, bonus, comm, salary, exempted, proof;

    IF at_end = 1 THEN
      LEAVE ins_loop;
    ELSE        
      IF exempted > proof THEN
        SET exempted = proof;
      END IF;
      SET awarded_pay = bonus + comm;
  
      UPDATE SESSION.tax_cal_CGTT SET tax_to_be_paid = tax_compute(salary,exempted,awarded_pay) WHERE empno = id;
      ITERATE ins_loop;
    END IF;
  END LOOP;

  CLOSE IterateOverEmpRecord;
  
END@

CREATE FUNCTION printITSheet()
SPECIFIC ITSheet
RETURNS TABLE (empno           CHARACTER(6),
               firstnme        VARCHAR(12),
               lastname        VARCHAR(15),
               birthdate       DATE,
               bonus           DOUBLE,
               comm            DOUBLE,
               salarypa        DOUBLE,
               tax_to_be_paid  DOUBLE)
LANGUAGE SQL
NO EXTERNAL ACTION
READS SQL DATA
RETURN
  SELECT empno, firstnme, lastname, birthdate, bonus, comm, salarypa, tax_to_be_paid
    FROM SESSION.tax_cal_cgtt
