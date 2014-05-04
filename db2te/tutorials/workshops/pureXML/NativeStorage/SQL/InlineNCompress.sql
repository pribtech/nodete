-- Create a bufferpool with pagesize 8k
create bufferpool bp8k_PDD3 pagesize 8k;

-- Create a table space using the above created buffer pool
create tablespace CommonTBSpace_PDD3 pagesize 8K
managed by automatic storage
bufferpool bp8k_PDD3;

-- Create the table 'out_patient_data_PDD3' in table space 'CommonTBSpace_PDD3'
CREATE TABLE ?SCHEMA?.out_patient_data_PDD3 (patient_id		INT, 
			       clinical_doc_id  	VARCHAR(50),
			       date_of_consultancy  	DATE, 
			       PMD 		        XML  INLINE LENGTH 3000) 
	COMPRESS YES
	IN CommonTBSpace_PDD3;