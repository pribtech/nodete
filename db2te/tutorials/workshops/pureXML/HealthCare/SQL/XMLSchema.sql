INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10001,'Edward','Jhonson','3000202-220','M','202-30-4456','04/18/1985','03/21/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address>
<Address1>Milk Street</Address1>
<Address2>553</Address2>
<City>Earth City</City>
<State>NewState</State>
<Country>Big Country</Country>
<Zipcode>10101</Zipcode>
</Address>' );

Insert into ?SCHEMA?.OUT_PATIENT_DATA values (10001,'PMD10001','03/21/2007','<?xml version="1.0" encoding="UTF-8"?>
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


--Declaring Variables for the proc XSR_REGISTER

CREATE VARIABLE MY 		VARCHAR(128)  DEFAULT '?SCHEMA?';
CREATE VARIABLE MYJOB 	VARCHAR(128)  DEFAULT 'PMD';
CREATE VARIABLE MYJOB2 	VARCHAR(128)  DEFAULT NULL;
CREATE VARIABLE MYJOB3 	BLOB  		  DEFAULT NULL ;

--calling the XSR_REGISTER proc and registering the annotated XML schema 

CALL SYSPROC.XSR_REGISTER(MY,MYJOB,MYJOB2
,BLOB('<?xml version="1.0" encoding="UTF-8"?><xsd:schema targetNamespace="ns1" xmlns:Q1="ns1" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <xsd:element name="test_report">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element maxOccurs="unbounded" ref="Q1:test_results"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="street" type="xsd:string"/>
  <xsd:element name="patient">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:hospital_name"/>
        <xsd:element ref="Q1:name"/>
        <xsd:element ref="Q1:address"/>
        <xsd:element ref="Q1:email"/>
        <xsd:element ref="Q1:phone"/>
        <xsd:element ref="Q1:date_of_birth"/>
        <xsd:element ref="Q1:gender"/>
        <xsd:element ref="Q1:visit_info"/>
      </xsd:sequence>
      <xsd:attribute name="ID" type="xsd:string"/>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="specialist_ref">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:specialist"/>
      </xsd:sequence>
      <xsd:attribute name="status" type="xsd:string"/>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="name">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:first"/>
        <xsd:element ref="Q1:last"/>
        <xsd:element minOccurs="0" ref="Q1:prefix"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="discharge_date" type="xsd:string"/>
  <xsd:element name="card">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:card_no"/>
        <xsd:element ref="Q1:cardholder_name"/>
        <xsd:element ref="Q1:amount_paid"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="state" type="xsd:string"/>
  <xsd:element name="prefix" type="xsd:string"/>
  <xsd:element name="test" type="xsd:string"/>
  <xsd:element name="patient_document">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:document"/>
        <xsd:element ref="Q1:patient"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="last" type="xsd:string"/>
  <xsd:element name="doctor_advice">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:result_diagnosis"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="residence_no" type="xsd:string"/>
  <xsd:element name="document">
    <xsd:complexType>
      <xsd:attribute name="version" type="xsd:string"/>
      <xsd:attribute name="id" type="xsd:string"/>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="email" type="xsd:string"/>
  <xsd:element name="admitted">
    <xsd:complexType>
      <xsd:attribute name="status" type="xsd:string"/>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="doctor_details">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:type"/>
        <xsd:element ref="Q1:doctor_name"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="visit_info">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:visited_date"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="visited_date">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:doctor_details"/>
        <xsd:element ref="Q1:checkup_details"/>
        <xsd:element ref="Q1:admitted"/>
        <xsd:element ref="Q1:admitted_date"/>
        <xsd:element ref="Q1:ward_no"/>
        <xsd:element ref="Q1:discharge_summary"/>
      </xsd:sequence>
      <xsd:attribute name="date" type="xsd:string"/>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="claim_no">
    <xsd:complexType/>
  </xsd:element>
  <xsd:element name="checkup_details">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:weight"/>
        <xsd:element maxOccurs="unbounded" ref="Q1:symptoms"/>
        <xsd:element ref="Q1:specialist_ref"/>
        <xsd:element ref="Q1:labtests_suggested"/>
        <xsd:element ref="Q1:test_report"/>
        <xsd:element maxOccurs="unbounded" ref="Q1:medicines"/>
        <xsd:element ref="Q1:doctor_advice"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="discharge_summary">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:description"/>
        <xsd:element ref="Q1:discharge_date"/>
        <xsd:element ref="Q1:payment_mode"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="doctor_name">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:first"/>
        <xsd:element ref="Q1:last"/>
        <xsd:element ref="Q1:prefix"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="observation" type="xsd:string"/>
  <xsd:element name="cardholder_name">
    <xsd:complexType/>
  </xsd:element>
  <xsd:element name="admitted_date" type="xsd:string"/>
  <xsd:element name="first" type="xsd:string"/>
  <xsd:element name="specialist">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:name"/>
        <xsd:element ref="Q1:address"/>
        <xsd:element ref="Q1:ref_reason"/>
        <xsd:element ref="Q1:observation"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="cash">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:amount_paid"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="type" type="xsd:string"/>
  <xsd:element name="payment_mode">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:cash"/>
        <xsd:element ref="Q1:card"/>
        <xsd:element ref="Q1:Insuranceclaim"/>
        <xsd:element ref="Q1:anyothermode"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="gender" type="xsd:string"/>
  <xsd:element name="Insuranceclaim">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Q1:claim_no"/>
        <xsd:element ref="Q1:amount_paid"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="anyothermode">
    <xsd:complexType/>
  </xsd:element>
  <xsd:element name="date_of_birth" type="xsd:string"/>
  <xsd:element name="test_results" type="xsd:string"/>
  <xsd:element name="zip_code" type="xsd:string"/>
  <xsd:element name="result_diagnosis" type="xsd:string"/>
  <xsd:element name="card_no">
    <xsd:complexType/>
  </xsd:element>
  <xsd:element name="amount_paid" type="xsd:string"/>
  <xsd:element name="labtests_suggested">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element maxOccurs="unbounded" ref="Q1:test"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="ward_no" type="xsd:string"/>
  <xsd:element name="symptoms" type="xsd:string"/>
  <xsd:element name="city" type="xsd:string"/>
  <xsd:element name="phone" type="xsd:string"/>
  <xsd:element name="hospital_name" type="xsd:string"/>
  <xsd:element name="ref_reason" type="xsd:string"/>
  <xsd:element name="address">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element minOccurs="0" ref="Q1:residence_no"/>
        <xsd:element ref="Q1:street"/>
        <xsd:element ref="Q1:city"/>
        <xsd:element ref="Q1:state"/>
        <xsd:element ref="Q1:zip_code"/>
      </xsd:sequence>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="weight" type="xsd:string"/>
  <xsd:element name="medicines" type="xsd:string"/>
  <xsd:element name="description" type="xsd:string"/>
</xsd:schema>'), NULL) ;

-- Completeing the schema registration 

CALL SYSPROC.XSR_COMPLETE(MY,MYJOB,MYJOB3,0) ;

DROP VARIABLE MY ;
DROP VARIABLE MYJOB ;
DROP VARIABLE MYJOB2 ;
DROP VARIABLE MYJOB3 ;
DELETE FROM ?SCHEMA?.OUT_PATIENT_DATA WHERE PATIENT_ID =10001;
Insert into ?SCHEMA?.OUT_PATIENT_DATA values (10001,'PMD10001','03/21/2007',XMLVALIDATE(XMLPARSE(document('<?xml version="1.0" encoding="UTF-8"?>
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
</patient_document>')) ACCORDING TO XMLSCHEMA ID PMD));