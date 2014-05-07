
--Using XMLTRANSFORM to fetch an XML and modify nodes and insert as new document.

INSERT INTO ?SCHEMA?.OUT_PATIENT_DATA VALUES(10002,'PMD10002','07/10/2007',(
SELECT 
xmlquery( 
'transform
copy $newinfo := $c
modify 
(do insert  <symptoms>
				The patient has reported with same illness and has mentionned that there has been no signs of 
				reduction in the pain and diziness.
			</symptoms>
 after  $newinfo/patient_document/patient/visit_info/visited_date/checkup_details/weight,
do replace $newinfo/patient_document/document[@version] with <document id="PMD10002" version="2" />)
return $newinfo' passing PMD as "c")
from ?SCHEMA?.out_patient_data
WHERE patient_id = 10002));

--Fetching the new document which was inserted by modifying the old document.

SELECT PMD FROM ?SCHEMA?.OUT_PATIENT_DATA  
WHERE (PATIENT_ID = 10002  AND
XMLEXISTS('$i/patient_document/document[@version ="2"]' PASSING PMD AS "i"));