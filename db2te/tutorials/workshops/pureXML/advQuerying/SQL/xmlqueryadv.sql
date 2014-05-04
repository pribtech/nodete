
--Querying XML data along with SQL statements

select PATIENT_ID,DATE_OF_CONSULTANCY,

XMLQUERY('$i/patient_document/patient/name/first/text()' 
passing ?SCHEMA?.out_patient_data.PMD as "i") as Patient_name,
XMLQUERY('$i/patient_document/patient/visit_info/visited_date/checkup_details/specialist_ref/specialist/name/first/text()'
passing ?SCHEMA?.out_patient_data.PMD as "i") as Specialist

from ?SCHEMA?.out_patient_data
where patient_id=10002;