--Querying the Name and past medical info for patient with name 'James'

SELECT PATIENT_ID,DATE_OF_CONSULTANCY, 
XMLQUERY('$i/patient_document/patient/name ' passing PMD as "i" ) as Name,
XMLQUERY('$i/patient_document/patient/visit_info/visited_date/checkup_details/symptoms[1]/text()' passing PMD as "i") as Medical_Records
FROM ?SCHEMA?.OUT_PATIENT_DATA 
WHERE XMLEXISTS('$i/patient_document/patient/name[first = "James"]' passing PMD as "i");