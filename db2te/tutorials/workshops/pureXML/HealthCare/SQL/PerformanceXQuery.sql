-- Replace ~~~SCHEMA~~~ with the current schema name

SELECT patient_id,date_of_consultancy,
   XMLQUERY('$i/ClinicalDocument/component/structuredBody/component/section/text' PASSING ~~~SCHEMA~~~.out_patient_data.PMD as "i") as Past_Medical_Details
   FROM ~~~SCHEMA~~~.out_patient_data 
   WHERE xmlexists('$i/ClinicalDocument/recordTarget/patientRole/patient/name[given = "James"]' passing PMD as "i");
