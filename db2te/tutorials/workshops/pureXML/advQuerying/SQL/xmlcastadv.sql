
--CASTING XML DATA to Relational data types
SELECT P.PATIENT_ID,P.FIRST_NAME,P.LAST_NAME, P.SSN, P.SEX, P.PHONE_NO, P.DATE_OF_BIRTH,O.CLINICAL_DOC_ID,O.PMD
FROM ?SCHEMA?.PATIENT_DETAILS P, ?SCHEMA?.OUT_PATIENT_DATA O
WHERE P.FIRST_NAME =
        XMLCAST( XMLQUERY ('for $pname in $d/patient_document/patient/name/first
                              return $pname'
                           PASSING O.PMD AS "d") AS VARCHAR(128));