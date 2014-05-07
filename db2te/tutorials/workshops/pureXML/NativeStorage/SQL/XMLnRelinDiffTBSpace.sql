-- Create 2 buffer pools, one for relational data and the second for XML data.
-- As a rule of thumb, choose a page size for XML data which is not smaller than 
-- two times your average expected document size, subject to the maximum of 32KB.  

create bufferpool bp4k_PDD2 pagesize 4k;

create bufferpool bp32k_PDD2 pagesize 32k;



-- Create 2 table spaces using the above created buffer pools.
-- It is also recommended to use DMS table spaces with automatic storage so that 
-- DMS containers grow as needed without manual intervention.

create tablespace relData_PDD2 pagesize 4K
managed by automatic storage
bufferpool bp4k_PDD2;

create tablespace xmlData_PDD2 pagesize 32K
managed by automatic storage
bufferpool bp32k_PDD2;


-- Create the table 'out_patient_data_PDD2' to store long data in a separate table space.
CREATE TABLE ?SCHEMA?.out_patient_data_PDD2 (patient_id		INT, 
			       clinical_doc_id  	VARCHAR(50),
			       date_of_consultancy  	DATE, 
			       PMD 		        XML) 
	IN relData_PDD2
     	LONG IN xmlData_PDD2;