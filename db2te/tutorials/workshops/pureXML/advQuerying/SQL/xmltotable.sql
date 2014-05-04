
--XML data to Relational Format
SELECT PATIENT_ID,DATE_OF_CONSULTANCY,
PMD.Document_ID, PMD.Hospital_name,PMD.Patient_name,PMD.Doctor_Name,PMD.Medical_History 
FROM ?SCHEMA?.out_patient_data o,
XMLTABLE('$PMD/patient_document'
			columns Document_ID varchar(50) path 'document/@id',
			Hospital_name varchar(100) path 'patient/hospital_name',
			Patient_name varchar(100) path 'patient/name/first',
			Doctor_Name varchar(100) path 'patient/visit_info/visited_date/doctor_details/doctor_name/first',
			Medical_History varchar(1000) path 'patient/visit_info/visited_date/checkup_details/symptoms[1]/text()'
			 
		) as PMD;	