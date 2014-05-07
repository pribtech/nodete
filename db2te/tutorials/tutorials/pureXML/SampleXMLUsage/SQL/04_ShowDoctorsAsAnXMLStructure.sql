SELECT
            XML2CLOB
            (
            XMLELEMENT(NAME "DoctorRecord",
            XMLELEMENT(NAME "DoctorID", d.doc_id),
            XMLELEMENT(NAME "Firstname", d.doc_firstname),
            XMLELEMENT(NAME "Lastname",  d.doc_lastname),
            XMLELEMENT(NAME "Extension", d.doc_extension)
            )
            ) AS "Result" 
FROM        ?SCHEMA?.doctors d;
