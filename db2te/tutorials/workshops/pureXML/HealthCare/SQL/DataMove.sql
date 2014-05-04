-- Export the data from OLTP into 'DEL' files. The data will be then loaded into warehouse.

-- Export commands with files on Linux/UNIX
CALL SYSPROC.ADMIN_CMD('EXPORT TO /home/db2inst1/tmp/data_exp.del OF DEL SELECT * FROM ?SCHEMA?.disease_description');

CALL SYSPROC.ADMIN_CMD('EXPORT TO /home/db2inst1/tmp/xmldata_exp1.del OF DEL XML TO /home/db2inst1/tmp/XMLDataMoved_OPD XMLFILE xmlfiles_exp MODIFIED BY XMLCHAR SELECT * FROM ?SCHEMA?.out_patient_data');

CALL SYSPROC.ADMIN_CMD('EXPORT TO /home/db2inst1/tmp/xmldata_exp2.del OF DEL XML TO /home/db2inst1/tmp/XMLDataMoved_PD XMLFILE xmlfiles_exp MODIFIED BY XMLCHAR SELECT * FROM ?SCHEMA?.patient_details');


-- Export commands with files on Windows
-- CALL SYSPROC.ADMIN_CMD('EXPORT TO \"c:\\data_exp.del\" OF DEL SELECT * FROM ?SCHEMA?.disease_description');

-- CALL SYSPROC.ADMIN_CMD('EXPORT TO \"c:\\xmldata_exp1.del\" OF DEL XML TO \"c:\\XMLDataMoved_OPD\" XMLFILE xmlfiles_exp MODIFIED BY XMLCHAR SELECT * FROM ?SCHEMA?.out_patient_data');

-- CALL SYSPROC.ADMIN_CMD('EXPORT TO \"c:\\xmldata_exp2.del\" OF DEL XML TO \"c:\\XMLDataMoved_PD\" XMLFILE xmlfiles_exp MODIFIED BY XMLCHAR SELECT * FROM ?SCHEMA?.patient_details');




-- Import the above generated delimited files into the OLAP Database.

-- Import commands with files on Linux/UNIX
CALL SYSPROC.ADMIN_CMD('IMPORT FROM /home/db2inst1/tmp/data_exp.del OF DEL INSERT INTO ?SCHEMA?.disease_description');

CALL SYSPROC.ADMIN_CMD('IMPORT FROM /home/db2inst1/tmp/xmldata_exp1.del OF DEL XML FROM /home/db2inst1/tmp/XMLDataMoved_OPD INSERT INTO ?SCHEMA?.out_patient_data');
						   	   
CALL SYSPROC.ADMIN_CMD('IMPORT FROM /home/db2inst1/tmp/xmldata_exp2.del OF DEL XML FROM /home/db2inst1/tmp/XMLDataMoved_PD INSERT INTO ?SCHEMA?.patient_details');


-- Import commands with files on Windows
-- CALL SYSPROC.ADMIN_CMD('IMPORT FROM \"c:\\data_exp.del\" OF DEL INSERT INTO ?SCHEMA?.disease_description');

-- CALL SYSPROC.ADMIN_CMD('IMPORT FROM \"c:\\xmldata_exp1.del\" OF DEL XML FROM \"c:\\XMLDataMoved_OPD\" INSERT INTO ?SCHEMA?.out_patient_data');
						   	   
-- CALL SYSPROC.ADMIN_CMD('IMPORT FROM "c:\\xmldata_exp2.del\" OF DEL XML FROM "c:\\XMLDataMoved_PD" INSERT INTO ?SCHEMA?.patient_details');


