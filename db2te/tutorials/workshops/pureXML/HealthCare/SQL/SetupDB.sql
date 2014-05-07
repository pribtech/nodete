
-- Create 2 buffer pools, one for relational data and the second for XML data.
-- As a rule of thumb, choose a page size for XML data which is not smaller than 
-- two times your average expected document size, subject to the maximum of 32KB.  

create bufferpool bp4k pagesize 4k;

create bufferpool bp32k pagesize 32k;



-- Create 2 table spaces using the above created buffer pools.
-- It is also recommended to use DMS table spaces with automatic storage so that 
-- DMS containers grow as needed without manual intervention.

create tablespace relData pagesize 4K
managed by automatic storage
bufferpool bp4k;

create tablespace xmlData pagesize 32K
managed by automatic storage
bufferpool bp32k;


-- Create the tables for clinical workflow.

-- The disease_description table contains the disease code and the description of the disease.
CREATE TABLE disease_description (disease_id 	INT, 
    				  description 	VARCHAR(100), 
    				  shortname 	VARCHAR(21)) 
	IN relData;


-- The out_patient_details contains the patient ID and the Patient Medical Document (PMD) in XML format. 
-- The PMD XML document contains the complete information regarding patient.
CREATE TABLE out_patient_data (patient_id		INT, 
			       clinical_doc_id  	VARCHAR(50),
			       date_of_consultancy  	DATE, 
			       PMD 		        XML) 
        PARTITION BY RANGE (date_of_consultancy)
	(PART part1 STARTING '2007-01-01' ENDING '2007-03-31',
         PART part2 STARTING '2007-04-01' ENDING '2007-06-30',
         PART part3 STARTING '2007-07-01' ENDING '2007-09-30',
         PART part4 STARTING '2007-10-01' ENDING '2007-12-31')
	IN relData
     	LONG IN xmlData;


-- The patient_details contains the basic information of a patient along with the address in XML format.
CREATE TABLE patient_details (patient_id 		INT, 
		              first_name 		VARCHAR(21), 
       			      last_name  		VARCHAR(21), 
       			      ssn 			VARCHAR(21), 
       			      sex 			VARCHAR(6), 
       			      phone_no 			VARCHAR(11), 
       			      date_of_birth 		DATE, 
       			      date_of_registration 	DATE, 
       			      address 			XML) 
	IN relData
     	LONG IN xmlData;

CREATE TABLE Patient_Info_Insurance  (
					Patient_ID INT, 
					Patient_name VARCHAR(100), 
					Address1 VARCHAR(200),
					Address2 VARCHAR(200),
					City varchar(200),
					State varchar(100),
					Country varchar(100),
					Zipcode varchar(20)
) 
IN relData;