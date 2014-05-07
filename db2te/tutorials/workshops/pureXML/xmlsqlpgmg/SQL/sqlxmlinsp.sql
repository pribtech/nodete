
--Creating a procedure which accepts XML as input parameter and returns an XML as output parameter

CREATE OR REPLACE PROCEDURE ?SCHEMA?.FETCH_PAT_INFO(IN PMD XML,IN USERS VARCHAR(10),OUT RESXML XML)
SPECIFIC FETCH_PAT_INFO
LANGUAGE SQL
BEGIN


DECLARE STRRESXML XML;


		
		SET STRRESXML = XMLQUERY('$pmd/patient_document/patient/name' passing PMD as "pmd" );
			
	CASE USERS 
		
		WHEN 'RECP' THEN 
		  
		SET STRRESXML =  XMLCONCAT(STRRESXML,XMLQUERY('$pmd/patient_document/patient/address' passing PMD as "pmd" ) ) ;
		SET STRRESXML = XMLCONCAT(STRRESXML,XMLQUERY('$pmd/patient_document/patient/visit_info/visited_date/doctor_details/doctor_name' passing PMD as "pmd" )   ) ;
				  
		WHEN 'DOCTOR' THEN 
		  
		  SET STRRESXML =  XMLCONCAT(STRRESXML, XMLQUERY('$pmd/patient_document/patient/visit_info/visited_date/checkup_details' passing PMD as "pmd" ) );
		
		WHEN 'ACCOUNTS' THEN 
		  
		  SET STRRESXML =  XMLCONCAT(STRRESXML, XMLQUERY('$pmd/patient_document/patient/visit_info/visited_date/admitted' passing PMD as "pmd" ) );
		  SET STRRESXML =  XMLCONCAT(STRRESXML, XMLQUERY('$pmd/patient_document/patient/visit_info/visited_date/admitted_date' passing PMD as "pmd" ) );
		  SET STRRESXML =  XMLCONCAT(STRRESXML, XMLQUERY('$pmd/patient_document/patient/visit_info/visited_date/ward_no' passing PMD as "pmd" ) );
		  SET STRRESXML =  XMLCONCAT(STRRESXML, XMLQUERY('$pmd/patient_document/patient/visit_info/visited_date/discharge_summary' passing PMD as "pmd" ) );
		  
		
	END CASE;
	
SET RESXML = STRRESXML;

END@



call ?SCHEMA?.FETCH_PAT_INFO(xmlparse(document '<?xml version="1.0" encoding="UTF-8"?>
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
    	   	<symptoms>The patient was taken into hospital with severe back pain. the pain is in the lower back. symptoms indicate lower arthritis.
			</symptoms>
			<symptoms>The examination also shows swelling in the lower back and needs X-ray and spinal chord examination</symptoms>
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
</patient_document>'),'RECP',?)@		

