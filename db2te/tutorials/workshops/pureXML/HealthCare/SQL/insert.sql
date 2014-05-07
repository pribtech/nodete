--insert patient details in the primary table

INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10002,'James','Mathew','3000202-220','M','202-30-4456','07/06/1985','06/06/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address>
<Address1>Milk Street</Address1>
<Address2>553</Address2>
<City>Earth City</City>
<State>NewState</State>
<Country>Big Country</Country>
<Zipcode>10101</Zipcode>
</Address>' )@



--INSERT Patient medical document in XML format
INSERT INTO ?SCHEMA?.OUT_PATIENT_DATA values (10002,'PMD10002','06/06/2007','<?xml version="1.0" encoding="UTF-8"?>
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
</patient_document>' )@




CREATE PROCEDURE ?SCHEMA?.insertXML()
LANGUAGE SQL
BEGIN
DECLARE counter INTEGER DEFAULT 0;

WHILE counter < 100 DO
INSERT INTO ?SCHEMA?.out_patient_data VALUES (10001,'PMD10001','03/21/2007','<?xml version="1.0" encoding="UTF-8"?>
<patient_document xmlns="ns1"  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
    <visited_date date="199603210000">
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
SET counter = counter + 1;
END WHILE;

END@

-- Call the stored procedure insertXML to INSERT the XML document 100 times.
CALL ?SCHEMA?.insertXML()@