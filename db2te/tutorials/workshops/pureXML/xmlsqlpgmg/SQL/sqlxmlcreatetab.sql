-- Create 2 buffer pools, one for relational data and the second for XML data.
-- As a rule of thumb, choose a page size for XML data which is not smaller than 
-- two times your average expected document size, subject to the maximum of 32KB.  

create bufferpool bp4k pagesize 4k@

create bufferpool bp32k pagesize 32k@



-- Create 2 table spaces using the above created buffer pools.
-- It is also recommended to use DMS table spaces with automatic storage so that 
-- DMS containers grow as needed without manual intervention.

create tablespace relData pagesize 4K
managed by automatic storage
bufferpool bp4k@

create tablespace xmlData pagesize 32K
managed by automatic storage
bufferpool bp32k@

-- Create the tables for clinical workflow.

-- The disease_description table contains the disease code and the description of the disease.
CREATE TABLE disease_description (disease_id 	INT, 
    				  description 	VARCHAR(100), 
    				  shortname 	VARCHAR(21)) 
	IN relData@


-- The out_patient_details contains the patient ID and the Patient Medical Document (PMD) in XML format. 
-- The PMD XML document contains the complete information regarding patient.
CREATE TABLE out_patient_data (patient_id		INT, 
			       clinical_doc_id  	VARCHAR(50),
			       date_of_consultancy  	DATE, 
			       PMD 		        XML) 
	IN relData
     	LONG IN xmlData@


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
     	LONG IN xmlData@
		

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
IN relData@



-- ALL INSERT

INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10001,'Edward','Jhonson','3000202-220','M','202-30-4456','04/18/1985','03/21/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address patid="10001">
<Address1>Milk Street</Address1>
<Address2>553</Address2>
<City>Earth City</City>
<State>NewState</State>
<Country>Big Country</Country>
<Zipcode>10101</Zipcode>
</Address>' )@


INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10002,'James','Mathew','3000202-220','M','202-30-4456','07/06/1985','06/06/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address patid="10002">
<Address1>Milk Street</Address1>
<Address2>553</Address2>
<City>Earth City</City>
<State>NewState</State>
<Country>Big Country</Country>
<Zipcode>10101</Zipcode>
</Address>' )@


Insert into ?SCHEMA?.OUT_PATIENT_DATA values (10001,'PMD10001','03/21/2007','<?xml version="1.0" encoding="UTF-8"?>
<patient_document>
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
    	   	<symptoms><text>The patient indicated severe head ache for past four days, he says that the pain is permanent and the intensity varies
			from severe to light headache. the patient also indicated symptoms of chest pain and body ache. this causes to have sleeplessness.
			</text></symptoms>
			<symptoms><text>The patient explains his work habits to be very stressful with 14 hours of work on an average.</text></symptoms>
			<symptoms><text>the patient approached with symptoms of influenza.</text></symptoms>		
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
</patient_document>' )@


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
    	   	<symptoms><text>The patient has observing low to medium chest pain and breathlessness, the patient has fainted twice during the last two days.
			</text></symptoms>
			<symptoms><text>symptoms indicated of mild heart attack. the patient also has a past history of diabetes and is under going treatment.</text></symptoms>
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

INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10003,'David','Longman','3000202-220','M','202-30-4456','05/11/1964','09/12/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address patid="10002">
<Address1>one Street</Address1>
<Address2>34</Address2>
<City>Life City</City>
<State>healthy state</State>
<Country>Big Country</Country>
<Zipcode>43001</Zipcode>
</Address>' )@

INSERT INTO OUT_PATIENT_DATA values (10003,'PMD10003','09/12/2007','<?xml version="1.0" encoding="UTF-8"?>
<patient_document>
<document id ="PMD10003" version="1"/>
<patient ID="10003" >    
    <hospital_name>New Care Hospital</hospital_name>
    <name>
		<first>David</first>
		<last>Longman</last>
	<prefix></prefix>
	</name>
	 <address>
       <residence_no>34</residence_no>
       <street>one street</street>
       <city>Life City</city>
       <state>healthy state</state>
       <zip_code>43001</zip_code>
    </address>
    <email>david@hosp.com</email>
    <phone>+11-311-2345</phone>
    <date_of_birth>196405111435</date_of_birth>
    <gender>M</gender>
	<visit_info>
    <visited_date date="200709120000">
         <doctor_details>
              <type>DUTY</type>
             <doctor_name>
				<first>Mary</first>
				<last>Mathew</last>
				<prefix>M.D</prefix>
			 </doctor_name>
         </doctor_details>
       	<checkup_details>
			<weight>73</weight>
    	   	<symptoms><text>The patient was taken into hospital with severe back pain. the pain is in the lower back. symptoms indicate lower arthritis.</text>
			</symptoms>
			<symptoms><text>The examination also shows swelling in the lower back and needs X-ray and spinal chord examination</text></symptoms>
			<specialist_ref status="yes">
				<specialist>
					<name>
						<first>Doctor</first>
						<last>Good Hope</last>
					</name>
					<address>
						<street>Long beach</street>
						<city>California</city>
						<state>California</state>
						<zip_code>54001</zip_code>
					</address>
					<ref_reason>Examination by the specialist in vertibrae and spinal chord</ref_reason>
					<observation>The patient is suffering from severe arthiritis and needs immediate tratement and complete bed rest</observation>
				</specialist>
			</specialist_ref>			
			<labtests_suggested>
			   <test>X-ray of back bone</test>
			   <test>Blood test</test>
			</labtests_suggested>
			<test_report>
                <test_results>Blood sugar level seems to normal.</test_results>			
                <test_results>The xray reveals the tear in the ligament joining the lowest vertibral bones</test_results>
				<test_results>There is swelling observerd in the nevers runing throught these bones.</test_results>
			</test_report>
			<medicines>Etanercept</medicines>
			<medicines>Adalimumab</medicines>
			<medicines>Infliximab</medicines>
			<medicines>Ampicillin 250 mg I.P</medicines>
			<doctor_advice>
				<result_diagnosis>
					The patient needs immediate bed rest. The medicines and treatment prescribed needs to be taken till the pain ans swelling completely neutrlizes.
				</result_diagnosis>
			</doctor_advice>			
		</checkup_details>
    	<admitted status ="yes"></admitted>
		<admitted_date>200709120000</admitted_date>
		<ward_no>24</ward_no>
		<discharge_summary>
            <description>The patient is fit enough to be discharged and needs continues excercise and medication to completly relive from pain.</description>  
            <discharge_date>200709250000</discharge_date> 
		<payment_mode>
			<cash>
			   <amount_paid></amount_paid>   
			</cash>
			<card>
			   <card_no></card_no>
			   <cardholder_name></cardholder_name>
			   <amount_paid></amount_paid>
			</card>
			<Insuranceclaim>
			   <claim_no>5304</claim_no>
			   <amount_paid>$5000</amount_paid>
			</Insuranceclaim>   			
			<anyothermode></anyothermode>    
		</payment_mode>			
	</discharge_summary>		
    </visited_date>    
   	</visit_info>	
</patient>
</patient_document>' )@