
--Create a temporary tablespace in which the temporary table will be created.

CREATE USER TEMPORARY TABLESPACE TEMP_SPACE;

--Creates a global temporary table with a column of xml type

DECLARE GLOBAL TEMPORARY TABLE SYMPTEMP(PATID VARCHAR(50),SYMPCOMP XML)  ON COMMIT PRESERVE ROWS;

--Inserting data into the temp table.
INSERT INTO SESSION.SYMPTEMP
  VALUES ('10003', '<symptoms>
		<text>The patient has shown signs of relif in the lower back. the swelling has also reduced to acceptable level.
		</text></symptoms>');

INSERT INTO SESSION.SYMPTEMP
  VALUES ('10003', '<symptoms>
		<text>There has not been complete relif from pain and occurs when there is rapid movement to the body.
		</text></symptoms>');

INSERT INTO SESSION.SYMPTEMP
  VALUES ('10003', '<symptoms>
		<text>there has also been observation of severe acidity and stomach ache after the consumption of the medicine adviced by the doctor.
		</text></symptoms>');

		
-- Inserting into the source table when the data is to commited  from temp table to source table
		
INSERT INTO ?SCHEMA?.OUT_PATIENT_DATA VALUES(10003,'PMD10003','10/10/2007',(
SELECT 
	XMLQUERY( 
	'transform
	copy $newinfo := $c
	modify 
	(do insert db2-fn:xmlcolumn("SESSION.SYMPTEMP.SYMPCOMP") 
	 after  $newinfo/patient_document/patient/visit_info/visited_date/checkup_details/weight,
	do replace $newinfo/patient_document/document[@version] with <document id="PMD10003" version="2" />)
	return $newinfo' PASSING PMD AS "c")
FROM ?SCHEMA?.OUT_PATIENT_DATA 
WHERE PATIENT_ID = 10003));



SELECT PMD FROM OUT_PATIENT_DATA WHERE PATIENT_ID =10003 
and XMLEXISTS('$i/patient_document/document[@version = "2"]' passing PMD as "i");

DROP  TABLE SESSION.SYMPTEMP;