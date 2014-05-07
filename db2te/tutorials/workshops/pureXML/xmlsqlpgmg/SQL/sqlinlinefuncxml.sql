
-- Inline SQL Function fetch the patient in a particular xml format for a given patient 

CREATE  FUNCTION ?SCHEMA?.RET_PAT_SPECIFIC ( PATID VARCHAR(10) )
RETURNS XML
LANGUAGE SQL
NO EXTERNAL ACTION
BEGIN ATOMIC 	--XML Datatypes can be used only for Inline SQL functions.

DECLARE PAT_XML XML;

SET PAT_XML = (SELECT  XMLELEMENT (NAME "patientinfo", 
      XMLELEMENT (NAME "firstname", A.FIRST_NAME), 
        XMLELEMENT (NAME "lastname", A.LAST_NAME), 
          XMLELEMENT (NAME "ssn", A.SSN), 
            XMLELEMENT (NAME "sex", A.SEX), 
              XMLELEMENT (NAME "phone", A.PHONE_NO), 
                XMLELEMENT (NAME "dob", CHAR(A.DATE_OF_BIRTH)), 
                  XMLELEMENT (NAME "regdate", CHAR(A.DATE_OF_REGISTRATION)),
      A.ADDRESS, 
        XMLELEMENT (NAME "medhistory", XMLQUERY('$i/patient_document/patient/visit_info/visited_date/checkup_details/symptoms' PASSING  B.PMD AS "i")))
  FROM
      ?SCHEMA?.PATIENT_DETAILS AS A INNER JOIN ?SCHEMA?.OUT_PATIENT_DATA AS B ON (A.PATIENT_ID = B.PATIENT_ID)
  WHERE A.PATIENT_ID = PATID
  -- FETCHING THE LATEST VERSION OF THE DOCUMENT
  AND XMLCAST(XMLQUERY( '$newinfo/patient_document/document/@version' passing B.PMD as "newinfo") as varchar(10))  
		= (
			SELECT PMD.Document_Version FROM ?SCHEMA?.OUT_PATIENT_DATA O,
			XMLTABLE('$PMD/patient_document' 	columns 
			Document_Version varchar(50) path 'document/@version') as PMD
			WHERE O.PATIENT_ID = PATID
			ORDER BY Document_Version DESC FETCH FIRST 1 ROWS ONLY
		)
  );

RETURN PAT_XML;

END @

--call the inline function using a select statement

SELECT ?SCHEMA?.RET_PAT_SPECIFIC(PATIENT_ID)
  FROM ?SCHEMA?.OUT_PATIENT_DATA
  WHERE PATIENT_ID = 10002 @
  

  
  
DROP FUNCTION ?SCHEMA?.RET_PAT_SPECIFIC @
  
  
  