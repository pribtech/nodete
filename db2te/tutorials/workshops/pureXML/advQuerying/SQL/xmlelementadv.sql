--Relational Data to XML
select
xmlelement (name "patientinfo",
xmlelement (name "firstname",first_name),
xmlelement (name "lastname", last_name),
xmlelement (name "ssn",ssn),
xmlelement (name "sex",sex),
xmlelement (name "phone",phone_no),
xmlelement (name "dob",char(date_of_birth)),
xmlelement (name "regdate",char(date_of_registration)),
	address)
from ?SCHEMA?.patient_details;