

--Declaring Variables for the proc XSR_REGISTER

CREATE VARIABLE MY 		VARCHAR(128)  DEFAULT '?SCHEMA?';
CREATE VARIABLE MYJOB 	VARCHAR(128)  DEFAULT 'ADDRESS';
CREATE VARIABLE MYJOB2 	VARCHAR(128)  DEFAULT NULL;
CREATE VARIABLE MYJOB3 	BLOB  		  DEFAULT NULL ;

--calling the XSR_REGISTER proc and registering the annotated XML schema 

CALL SYSPROC.XSR_REGISTER(MY,MYJOB,MYJOB2
,BLOB('<?xml version="1.0" encoding="UTF-8"?><xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
				xmlns:db2-xdb="http://www.ibm.com/xmlns/prod/db2/xdb1">
<xsd:annotation>
    <xsd:appinfo>
      <db2-xdb:defaultSQLSchema>?SCHEMA?</db2-xdb:defaultSQLSchema>
      <db2-xdb:table>
        <db2-xdb:name>Patient_Info_Insurance</db2-xdb:name>
        <db2-xdb:rowSet>pat_info</db2-xdb:rowSet>
      </db2-xdb:table>
    </xsd:appinfo>
  </xsd:annotation>

  <xsd:element name="State" type="xsd:string" db2-xdb:rowSet="pat_info" db2-xdb:column="State"/>
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
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="Country" type="xsd:string"  db2-xdb:rowSet="pat_info" db2-xdb:column="Country"/>
  <xsd:element name="City" type="xsd:string"  db2-xdb:rowSet="pat_info" db2-xdb:column="City"/>
  <xsd:element name="Address1" type="xsd:string"  db2-xdb:rowSet="pat_info" db2-xdb:column="Address1"/>
  <xsd:element name="Zipcode" type="xsd:string"  db2-xdb:rowSet="pat_info" db2-xdb:column="Zipcode"/>
  <xsd:element name="Address2" type="xsd:string"  db2-xdb:rowSet="pat_info" db2-xdb:column="Address2"/>
</xsd:schema>'), NULL) ;

-- Completeing the schema registration and enabiling it for decomposition

CALL SYSPROC.XSR_COMPLETE(MY,MYJOB,MYJOB3,1) ;

--Decomposing an XML doscument to the table

CALL xdbDecompXML (MY, MYJOB, BLOB('<?xml version="1.0" encoding="UTF-8"?>
<Address>
		<Address1>Houston</Address1>
		<Address2>553</Address2>
		<City>Oventown</City>
		<State>NewState</State>
		<Country>Big Country</Country>
		<Zipcode>129345-33</Zipcode>
</Address>'), 'DOCID', 0 , NULL, NULL, NULL);

-- Fetch the data that had been insert by shredding

SELECT Address1,Address2,City,State,Country,Zipcode FROM ?SCHEMA?.Patient_Info_Insurance;

DROP VARIABLE MY ;
DROP VARIABLE MYJOB ;
DROP VARIABLE MYJOB2 ;
DROP VARIABLE MYJOB3 ;
