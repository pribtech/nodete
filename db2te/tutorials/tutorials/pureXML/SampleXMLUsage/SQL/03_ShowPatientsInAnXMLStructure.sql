SELECT
            XML2CLOB
            (
            XMLELEMENT(NAME "PatientRecord",
            XMLELEMENT(NAME "PatientID", p.pat_id),
            XMLELEMENT(NAME "Firstname", p.pat_firstname),
            XMLELEMENT(NAME "Lastname",  p.pat_lastname)
            )
            ) AS "Result" 
FROM        ?SCHEMA?.patients p;
