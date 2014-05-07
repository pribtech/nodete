CREATE VIEW ?SCHEMA?.PatientDoctor AS
            ( SELECT XML2CLOB ( XMLELEMENT(NAME "PatientDoctor",
                                XMLELEMENT(NAME "PatientID", p.pat_id),
                                XMLELEMENT(NAME "PatientName", p.pat_firstname || ' ' || p.pat_lastname),
                                XMLELEMENT(NAME "DoctorName", d.doc_firstname  || ' ' || d.doc_lastname),
                                XMLELEMENT(NAME "Room", p.pat_room) ) ) AS "Result"
            FROM    ?SCHEMA?.patients p,
                    ?SCHEMA?.doctors d
            WHERE   p.doc_id = d.doc_id
            );
