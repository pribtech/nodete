

--Displaying String
xquery 'Hello world';

--Concatenation of strings
xquery fn:concat('ABC','ABD',(),'ABE');

--counting the number of elements
Xquery fn:count((5, 1.0E2, 40.5));

--Displays entire xml document
XQUERY db2-fn:xmlcolumn('OUT_PATIENT_DATA.PMD')/node();

--To display a particular node
XQUERY db2-fn:xmlcolumn('OUT_PATIENT_DATA.PMD')
/patient_document/patient/name/first;

-- To display a part of the PMD xml document
XQUERY db2-fn:sqlquery('SELECT PMD FROM out_patient_data')
/patient_document/patient;
