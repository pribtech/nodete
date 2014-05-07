 
--Create a procedure to modify the PMD XML

CREATE OR REPLACE PROCEDURE ?SCHEMA?.MODIFY_PATIENT_PMD(IN PATID VARCHAR(10))
SPECIFIC MODIFY_PATIENT_PMD
LANGUAGE SQL
BEGIN

INSERT INTO ?SCHEMA?.OUT_PATIENT_DATA VALUES(10002,'PMD10002','12/10/2007',(
SELECT 
	XMLQUERY( 
	'transform
	copy $newinfo := $c
	modify 
	(do delete ($newinfo/patient_document/patient/visit_info/visited_date/checkup_details/labtests_suggested,
			   $newinfo/patient_document/patient/visit_info/visited_date/checkup_details/test_report),
	do replace $newinfo/patient_document/document[@version] with <document id="PMD10002" version="2" />)
	return $newinfo' PASSING PMD AS "c")
FROM ?SCHEMA?.OUT_PATIENT_DATA 
WHERE PATIENT_ID = PATID));

END @

--call the procedure
call ?SCHEMA?.MODIFY_PATIENT_PMD('10002') @

-- fetch the PMD xml document modified by the stored procedure
SELECT *
  FROM ?SCHEMA?.OUT_PATIENT_DATA
  WHERE (PATIENT_ID = 10002
  and XMLEXISTS('$i/patient_document/document[@version = "2"]' passing PMD as "i")) @
  
  
--Dropping the procedure
 DROP PROCEDURE ?SCHEMA?.MODIFY_PATIENT_PMD @