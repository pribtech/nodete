CREATE VIEW ?SCHEMA?.DoctorPatient AS
            ( SELECT  d.doc_id,
                     XML2CLOB ( XMLELEMENT(NAME "DoctorPatient", XMLATTRIBUTES(d.doc_id AS "DOCID"),
                                XMLAGG ( XMLELEMENT(NAME "Patient",
                                         XMLELEMENT(NAME "ID", p.pat_id),
                                         XMLELEMENT(NAME "Name", p.pat_firstname || ' ' || p.pat_lastname),
                                         XMLELEMENT(NAME "Room", p.pat_room)) ORDER BY p.pat_id ) ) ) AS DOCPATIENT
            FROM     ?SCHEMA?.patients p,
                     ?SCHEMA?.doctors d
            WHERE    d.doc_id = p.doc_id
            GROUP BY d.doc_id
            );
