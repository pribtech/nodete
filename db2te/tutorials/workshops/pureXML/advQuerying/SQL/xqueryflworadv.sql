		
XQuery 
for $d in db2-fn:xmlcolumn('OUT_PATIENT_DATA.PMD')/patient_document
let $emp := $d/patient/visit_info/visited_date/checkup_details/symptoms/text()
where $d/document[@version=1]
order by $d/patient/visit_info/visited_date/@date
return 

<MedicalHistory>
	{$d/document/@id,$emp}
</MedicalHistory>;