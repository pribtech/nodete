
--Search using XMLEXISTS
select PATIENT_ID,DATE_OF_CONSULTANCY,CLINICAL_DOC_ID,
	XMLQUERY('$i/patient_document/patient/name/first/text()' 
	passing ?SCHEMA?.out_patient_data.PMD as "i") as Patient_name
from ?SCHEMA?.out_patient_data 
where XMLEXISTS('$i/patient_document/patient/visit_info/visited_date/doctor_details/doctor_name[first = "Durenda"]' 
passing PMD as "i");