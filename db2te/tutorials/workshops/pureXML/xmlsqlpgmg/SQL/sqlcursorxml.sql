

-- Creates a procedure to search for a the symptoms and consolidate all patient info into single XML document

CREATE OR REPLACE PROCEDURE ?SCHEMA?.xmlSymptom(IN insearchstr varchar(100), OUT resXML XML)
SPECIFIC xmlSymptom
LANGUAGE SQL
BEGIN
    DECLARE SQLSTATE CHAR(5);
    DECLARE stmt_text VARCHAR (1024);
    DECLARE patient XML;
    
    DECLARE title VARCHAR (100);
    DECLARE stmt STATEMENT;
 	DECLARE curSymptom CURSOR FOR stmt;

   SET title = insearchstr;

   set  stmt_text = 'XQuery 
					for $d in db2-fn:xmlcolumn("?SCHEMA?.OUT_PATIENT_DATA.PMD")/patient_document
					let $emp := $d/patient/visit_info/visited_date/checkup_details/symptoms/text/text()
					where  $d/document[@version=1] 					
					order by $d/patient/visit_info/visited_date/@date
					return 
					<patient>
						<name>{$d/patient/name/first}
								{$d/patient/name/last}
						</name>
					<MedicalHistory>{$d/document/@id,$emp}</MedicalHistory>
					</patient>';

  
  PREPARE stmt FROM stmt_text;
  OPEN curSymptom;

  FETCH curSymptom INTO patient;
  WHILE (SQLSTATE = '00000') DO
	    SET resXML = XMLCONCAT(resXML, patient);
    FETCH curSymptom INTO patient;
  END WHILE;

  set resXML = XMLQUERY('<symptom> {$res} </symptom>' passing resXML as "res");

END  @

-- calling the procedure by passing a search variable

call ?SCHEMA?.xmlSymptom('pain', ?)@