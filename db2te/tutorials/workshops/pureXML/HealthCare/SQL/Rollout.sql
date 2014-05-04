-- DETACH part1 from the table 'out_patient_data' to roll-out 3 months data.
ALTER TABLE ?SCHEMA?.out_patient_data DETACH PARTITION part1 INTO TABLE OPD_20090q1;