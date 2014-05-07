


XQUERY
	for $pmd in db2-fn:xmlcolumn('?SCHEMA?.OUT_PATIENT_DATA.PMD')/patient_document
	for $pat in db2-fn:xmlcolumn('?SCHEMA?.PATIENT_DETAILS.ADDRESS')
	let $pmdadd := $pmd/patient/address
	let $patadd := $pat
where $pmd/patient/@ID = $pat/Address/@patid
return 
<ADDRESS>
	<PMD>
		{$pmdadd}
	</PMD>
	<PATDETAIL>
		{$patadd}
	</PATDETAIL>
</ADDRESS>