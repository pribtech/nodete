

--Update patient Address XML document

UPDATE ?SCHEMA?.PATIENT_DETAILS SET Address =(
XMLPARSE(document
'<Address>
	<Address1>second Street</Address1>
	<Address2>3rd cross</Address2>
	<City>Louisville</City>
	<State>Kentucky</State>
	<Country>USA</Country>
	<Zipcode>40208</Zipcode>
</Address>'))
where patient_ID = 10001;
