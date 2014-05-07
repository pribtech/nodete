-- Create index on Patients name in the PMD document.
CREATE INDEX ?SCHEMA?.NameIndex ON ?SCHEMA?.out_patient_data (PMD) 
   GENERATE KEY USING XMLPATTERN 
      '/patient_document/patient/name/first' 
   AS SQL VARCHAR(20);


-- Collect statistics for table 'out_patient_data' on XML column PMD.  
CALL SYSPROC.ADMIN_CMD('RUNSTATS ON TABLE ?SCHEMA?.out_patient_data ON COLUMNS (PMD LIKE STATISTICS)');

