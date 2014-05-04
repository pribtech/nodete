-- Create a buffer pool with pagesize 8k
create bufferpool bp8k_PDD1 pagesize 8k;

-- Create a table space using the above created buffer pool
create tablespace CommonTBSpace_PDD1 pagesize 8K
managed by automatic storage
bufferpool bp8k_PDD1;

-- Create the table 'out_patient_data_PDD1' in table space 'CommonTBSpace_PDD1'
CREATE TABLE ?SCHEMA?.out_patient_data_PDD1 (patient_id		INT, 
			       clinical_doc_id  	VARCHAR(50),
			       date_of_consultancy  	DATE, 
			       PMD 		        XML)
	IN CommonTBSpace_PDD1;

-- INSERT Patient medical document in XML format
INSERT INTO ?SCHEMA?.out_patient_data_PDD1 values (10002,'PMD10002','06/06/2007','<?xml version="1.0" encoding="UTF-8"?>
<patient_document>
<document id ="PMD10002" version="1"/>
<patient ID="10002" >    
    <hospital_name>New Care Hospital</hospital_name>
    <name>
		<first>James</first>
		<last>Mathew</last>
	<prefix></prefix>
	</name>
	 <address>
       <residence_no>23</residence_no>
       <street>Cross street</street>
       <city>Clinic City</city>
       <state>new state</state>
       <zip_code>43001</zip_code>
    </address>
    <email>jon@good.com</email>
    <phone>+11-311-2833</phone>
    <date_of_birth>197905111435</date_of_birth>
    <gender>M</gender>
	<visit_info>
    <visited_date date="200706060000">
         <doctor_details>
              <type>DUTY</type>
             <doctor_name>
				<first>Durenda</first>
				<last>Flor</last>
				<prefix>M.D</prefix>
			 </doctor_name>
         </doctor_details>
       	<checkup_details>
			<weight>82</weight>
    	   	<symptoms>The patient has observing low to medium chest pain and breathlessness, the patient has fainted twice during the last two days.
			</symptoms>
			<symptoms>symptoms indicated of mild heart attack. the patient also has a past history of diabetes and is under going treatment.</symptoms>
			<specialist_ref status="no">
				<specialist>
					<name>
						<first></first>
						<last></last>
					</name>
					<address>
						<street></street>
						<city></city>
						<state></state>
						<zip_code></zip_code>
					</address>
					<ref_reason></ref_reason>
					<observation></observation>
				</specialist>
			</specialist_ref>			
			<labtests_suggested>
			   <test>blood sugar level</test>
			   <test>cholestrol level</test>
			</labtests_suggested>
			<test_report>
                <test_results>blood sugar level seems to little above normal.</test_results>			
                <test_results>The cholestrol level seems to be pretty high and needs medication.</test_results>
			</test_report>
			<medicines>Erythromycin Stearate 250 mg I.P</medicines>
			<medicines>Nimesulide 100 mg I.P</medicines>
			<medicines>Cephalexin 250 mg I.P</medicines>
			<medicines>Ampicillin 250 mg I.P</medicines>
			<doctor_advice>
				<result_diagnosis>
					The patient has excess cholesterol and fat which needs to controlled drastically. The corresponding medicines have been advised.
				</result_diagnosis>
			</doctor_advice>			
		</checkup_details>
    	<admitted status ="no"></admitted>
		<admitted_date></admitted_date>
		<ward_no></ward_no>
		<discharge_summary>
            <description></description>  
            <discharge_date></discharge_date> 
		<payment_mode>
			<cash>
			   <amount_paid>100</amount_paid>   
			</cash>
			<card>
			   <card_no></card_no>
			   <cardholder_name></cardholder_name>
			   <amount_paid></amount_paid>
			</card>
			<Insuranceclaim>
			   <claim_no>5301</claim_no>
			   <amount_paid>100</amount_paid>
			</Insuranceclaim>   			
			<anyothermode></anyothermode>    
		</payment_mode>			
	</discharge_summary>		
    </visited_date>    
   	</visit_info>	
</patient>
</patient_document>' );

