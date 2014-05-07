
-- Creating a view which returns particular information from the PMD xml


CREATE VIEW ?SCHEMA?.VW_FETCH_PATIENT_INFO (PATIENT_ID, DATE_OF_CONSULTANCY, PATIENT_NAME, DOCTOR_NAME,PMD) AS

SELECT PATIENT_ID,DATE_OF_CONSULTANCY, 
XMLCONCAT(
			XMLQUERY('$i/patient_document/patient/name/first/text()' PASSING PMD AS "i"),
			XMLQUERY('$i/patient_document/patient/name/last/text()' PASSING PMD AS "i")
) PATIENT_NAME,

XMLCONCAT( 
			XMLQUERY('$i/patient_document/patient/visit_info/visited_date/doctor_details/doctor_name/first/text()' PASSING PMD AS "i"),
			XMLQUERY('$i/patient_document/patient/visit_info/visited_date/doctor_details/doctor_name/last/text()'PASSING PMD AS "i"),
			XMLQUERY('$i/patient_document/patient/visit_info/visited_date/doctor_details/doctor_name/prefix/text()'PASSING PMD AS "i")
	)AS DOCTOR_NAME ,
PMD

FROM ?SCHEMA?.OUT_PATIENT_DATA
where XMLEXISTS('$i/patient_document/document[@version = "1"]' passing PMD as "i");


--fetch the data using the view

SELECT PATIENT_ID, DATE_OF_CONSULTANCY, PATIENT_NAME, DOCTOR_NAME 
FROM ?SCHEMA?.VW_FETCH_PATIENT_INFO; 


--Adding the index to the source table which holds the source data

CREATE  INDEX IDX_OUT_PATIENT_DATA ON ?SCHEMA?.OUT_PATIENT_DATA  (PMD)
GENERATE KEY USING XMLPATTERN
'/patient_document/document/@version'
AS SQL VARCHAR(20);