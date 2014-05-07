-- Create a table space using the buffer pool 'bp32k_PDD2' created in section four.
-- It is recommended to use DMS table spaces with automatic storage so that 
-- DMS containers grow as needed without manual intervention.

create tablespace CLOBData_PDD2 pagesize 32K
managed by automatic storage
bufferpool bp32k_PDD2;


-- Create the table 'out_patient_data_CLOB' in table space 'CommonTBSpace_PDD1'
CREATE TABLE ?SCHEMA?.out_patient_data_CLOB (patient_id		INT, 
			       	    clinical_doc_id  	VARCHAR(50),
			       	    date_of_consultancy DATE, 
			       	    PMD 		CLOB) 
	IN relData_PDD2
     	LONG IN CLOBData_PDD2;



--INSERT Patient medical document in XML format
INSERT INTO ?SCHEMA?.out_patient_data_clob VALUES (10002,'PMD10001','06/06/2007','<?xml version="1.0" encoding="UTF-8"?>
<patient_document xmlns="ns1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<document id ="PMD10001" version="1"/>
<patient ID="10001" >    
    <hospital_name>New Care Hospital</hospital_name>
    <name>
		<first>Edward</first>
		<last>Jhonson</last>
	<prefix></prefix>
	</name>
	 <address>
       <residence_no>553</residence_no>
       <street>Milk Street</street>
       <city>Earth City</city>
       <state>NewState</state>
       <zip_code>10101</zip_code>
    </address>
    <email>akdk@good.com</email>
    <phone>+11-324-2345</phone>
    <date_of_birth>197608161435</date_of_birth>
    <gender>M</gender>
	<visit_info>
    <visited_date date="200703210000">
         <doctor_details>
              <type>DUTY</type>
             <doctor_name>
				<first>Durenda</first>
				<last>Flor</last>
				<prefix>M.D</prefix>
			 </doctor_name>
         </doctor_details>
       	<checkup_details>
			<weight>75</weight>
    	   	<symptoms>The patient indicated severe head ache for past four days, he says that the pain is permanent and the intensity varies
			from severe to light headache. the patient also indicated symptoms of chest pain and body ache. this causes to have sleeplessness.
			</symptoms>
			<symptoms>The patient explains his work habits to be very stressful with 14 hours of work on an average.</symptoms>
			<symptoms>the patient approached with symptoms of influenza.</symptoms>		
			<specialist_ref status="yes">
				<specialist>
					<name>
						<first>Henry</first>
						<last>Mathew</last>
					</name>
					<address>
						<street>Big street</street>
						<city>One City</city>
						<state>Good state</state>
						<zip_code>43020</zip_code>
					</address>
					<ref_reason>Nuero scan verification to neuro surgen.</ref_reason>
					<observation>The brain scan of the patient seems to be normal.</observation>
				</specialist>
			</specialist_ref>			
			<labtests_suggested>
			   <test>Brain Scan</test>
			   <test>Blood Test before breakfast</test>
			</labtests_suggested>
			<test_report>
                <test_results>No issues found</test_results>			
                <test_results>Viral Infection - Viral flu</test_results>
			</test_report>
			<medicines>Norfloxacin 400 mg I.P</medicines>
			<medicines>Ibuprofen 200 mg I.P</medicines>
			<medicines>Cetirizine Hydrochloride 10mg I.P</medicines>
			<doctor_advice>
				<result_diagnosis>
					The patient is having viral infection and needs medical attention. 
					Also needs to admitted and needs to take complete rest.
				</result_diagnosis>
			</doctor_advice>			
		</checkup_details>
    	<admitted status ="yes"></admitted>
		<admitted_date>199603210000</admitted_date>
		<ward_no>21</ward_no>
		<discharge_summary>
            <description>The patient is normal and all test regarding his illness has tested negative. the patient can be discharged.</description>  
            <discharge_date>199603250000</discharge_date> 
		<payment_mode>
			<cash>
			   <amount_paid>300</amount_paid>   
			</cash>
			<card>
			   <card_no></card_no>
			   <cardholder_name></cardholder_name>
			   <amount_paid></amount_paid>
			</card>
			<Insuranceclaim>
			   <claim_no></claim_no>
			   <amount_paid></amount_paid>
			</Insuranceclaim>   			
			<anyothermode></anyothermode>    
		</payment_mode>			
	</discharge_summary>		
    </visited_date>    
   	</visit_info>	
</patient>
</patient_document>' );



