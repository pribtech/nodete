
--Declaring variables for the XSD registration
CREATE VARIABLE MY 		VARCHAR(128)  DEFAULT '?SCHEMA?'@
CREATE VARIABLE MYJOB 	VARCHAR(128)  DEFAULT 'ADDTRIG'@
CREATE VARIABLE MYJOB2 	VARCHAR(128)  DEFAULT NULL@
CREATE VARIABLE MYJOB3 	BLOB  		  DEFAULT NULL @

--calling the XSR_REGISTER proc and registering the annotated XML schema 

CALL SYSPROC.XSR_REGISTER(MY,MYJOB,MYJOB2
,BLOB('<?xml version="1.0" encoding="UTF-8"?><xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <xsd:element name="State" type="xsd:string"/>
  <xsd:element name="Address">
    <xsd:complexType>
      <xsd:sequence>
        <xsd:element ref="Address1"/>
        <xsd:element ref="Address2"/>
        <xsd:element ref="City"/>
        <xsd:element ref="State"/>
        <xsd:element ref="Country"/>
        <xsd:element ref="Zipcode"/>
      </xsd:sequence>
      <xsd:attribute name="patid" type="xsd:string"/>
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="Country" type="xsd:string"/>
  <xsd:element name="City" type="xsd:string"/>
  <xsd:element name="Address1" type="xsd:string"/>
  <xsd:element name="Zipcode" type="xsd:string"/>
  <xsd:element name="Address2" type="xsd:string"/>
</xsd:schema>'), NULL) @

-- Completeing the schema registration 

CALL SYSPROC.XSR_COMPLETE(MY,MYJOB,MYJOB3,0) @

DROP VARIABLE MY @
DROP VARIABLE MYJOB @
DROP VARIABLE MYJOB2 @
DROP VARIABLE MYJOB3 @


--Trigger for an insert
CREATE TRIGGER ?SCHEMA?.TRIG_PATADD_INSERT NO CASCADE BEFORE INSERT ON ?SCHEMA?.PATIENT_DETAILS
  REFERENCING NEW AS N
  FOR EACH ROW MODE DB2SQL
  BEGIN ATOMIC
     SET (N.ADDRESS) = XMLVALIDATE(N.ADDRESS
     ACCORDING TO XMLSCHEMA ID ADDTRIG);
  END@

-- Trigger for an update
CREATE TRIGGER ?SCHEMA?.TRIG_PATADD_UPDATE NO CASCADE BEFORE UPDATE ON ?SCHEMA?.PATIENT_DETAILS
  REFERENCING NEW AS N 
  FOR EACH ROW MODE DB2SQL 
  BEGIN ATOMIC 
    SET (N.ADDRESS) = XMLVALIDATE(N.ADDRESS 
    ACCORDING TO XMLSCHEMA ID ADDTRIG); 
  END@
  
 
--  XML document according to the schema 
 INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10004,'Sully','Van','3000202-220','M','202-30-4456','04/18/1985','06/06/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address>
<Address1>Milk Street</Address1>
<Address2>553</Address2>
<City>Earth City</City>
<State>NewState</State>
<Country>Big Country</Country>
<Zipcode>10101</Zipcode>
</Address>' )@


--  XML document not according to the schema
INSERT INTO ?SCHEMA?.PATIENT_DETAILS VALUES(10005,'New','man','3000202-220','M','202-30-4456','04/18/1985','06/06/2007',
'<?xml version="1.0" encoding="UTF-8"?>
<Address>
<Address1>Milk Street</Address1>
<Address2>553</Address2>
<City1>Earth City</City1>
<State>NewState</State>
<Country>Big Country</Country>
<Zipcode>10101</Zipcode>
</Address>' )@



